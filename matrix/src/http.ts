/// <reference path="data.ts" />
/// <reference path="matrix.ts" />

namespace matrix {
    export interface NetworkResponse<T = any> {
        code: number;
        cnmsg: string;
        enmsg: string;
        data: T | null;
        version: string;
    }

    export class HttpRequest {

        public static publicKey: null | string = null;

        public static publicKeyId: null | string = null;

        public static host: null | string = null;

        public static gameVersion: null | string = null;

        public static auth: null | WMP_AUTH = null;

        private static aesIv: string = '1234567890123456';

        public static platformData: WMP_PLATFORM_DATA = {
            openid: null,
        };

        public static rsaEncrypt(text: string): string {
            if (HttpRequest.publicKey === null) {
                console.error('必须先调用init方法进行初始化');
                return;
            }
            let encrypt = new JSEncrypt();
            encrypt.setPublicKey(HttpRequest.publicKey);
            return text
                .match(/.{117}|.+$/g)
                .map(sub => {
                    let encrypt_data = encrypt.encrypt(sub);
                    while (String(encrypt_data).length != 172 && encrypt_data) {
                        encrypt_data = encrypt.encrypt(sub);
                    }
                    return encrypt_data;
                })
                .join('');
        }

        public static getAesEncryptKey(): string {
            const keyLength = 16
            const baseString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            let arr = []
            for (let i = 0; i < keyLength; i++) {
                const idx = Math.floor(Math.random() * baseString.length)
                arr.push(baseString[idx])
            }
            return arr.join('');
        }

        public static aesDecrypt(text: string, aesKey: string): string {
            const key = CryptoJS.enc.Latin1.parse(aesKey);
            const iv = CryptoJS.enc.Latin1.parse(HttpRequest.aesIv);
            return CryptoJS.AES.decrypt(text, key, { iv: iv, mode: CryptoJS.mode.CBC })
                    .toString()
                    .split(/(.{2})/)
                    .filter(s => s.length == 2)
                    .map(s => parseInt(s, 16))
                    .map(n => String.fromCharCode(n))
                    .join('');
        }

        public static unicodeEscape(str: string): string {
            return str
                .split('')
                .map((char: string): string => {
                    const charCode = char.charCodeAt(0);
                    if (charCode == 10 || charCode == 9) {                                  // 0x00~0x1F中，除了0x0A（回车），0x09（TAB）这两个，其他全删
                        return char;
                    } else if (charCode <= 31 || charCode == 127) {                         // 127 = DEL， 0x1F = 31
                        return;
                    }
                    return charCode > 127 ? HttpRequest.unicodeCharEscape(charCode) : char; // 高于0x7F的都转译成unicode
                })
                .join('');
        };
    
        public static unicodeCharEscape(charCode: number): string {
            return '\\u' + HttpRequest.padWithLeadingZeros(charCode.toString(16));
        };
    
        public static padWithLeadingZeros(str: string): string {
            return new Array(5 - str.length).join('0') + str;
        };

        public static post(url: string, data?: {}): Promise<NetworkResponse> {
            if (HttpRequest.publicKey === null || HttpRequest.host === null) {
                console.error('必须先调用init方法进行初始化');
                return;
            }
            const aesKey = HttpRequest.getAesEncryptKey();
            let sid = null;
            if (Laya.Browser.onWeiXin) {
                sid = wx.getStorageSync('sid');
            }
            return new Promise((resolve, reject) => {
                const postData = {
                    rand: aesKey,
                    timestamp: new Date().getTime(),
                    ua: 'wmp',
                    sid: sid,
                    v: HttpRequest.gameVersion,
                    sv: matrix.version,
                    data: data,
                };
                let postDataStr = this.unicodeEscape(JSON.stringify(postData));
                postDataStr = HttpRequest.rsaEncrypt(postDataStr);

                if (Laya.Browser.onWeiXin) {
                    wx.request({
                        url: `${HttpRequest.host}${url}`,
                        data: postDataStr,
                        header: {
                            "Content-Type": "application/json",
                            "Rsa-Certificate-Id": HttpRequest.publicKeyId,
                        },
                        method: 'POST',
                        success: (res) => {
                            const decryptedRes = HttpRequest.aesDecrypt(res.data, aesKey);
                            if (!decryptedRes) {
                                reject({
                                    code: 500,
                                    enmsg: 'Error on decrypt reponse',
                                    cnmsg: '解码错误',
                                    data: null,
                                });
                                return;
                            }
                            const data = JSON.parse(decryptedRes);
                            if (data.code == 200 && data.enmsg == 'ok') {
                                resolve(data);
                            } else {
                                reject(data);
                            }
                        },
                        fail: () => {
                            reject({
                                code: 500,
                                enmsg: 'Fail Network response',
                                cnmsg: '网络错误',
                                data: null,
                            });
                        },
                    });
                }
            });
        }
    }
}