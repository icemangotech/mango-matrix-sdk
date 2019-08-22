import { WMP_AUTH, WMP_PLATFORM_DATA } from './data';
import Environment from './environment';

// declare const CryptoJS: CryptoJS.Hashes;
import encLatin1 from 'crypto-js/enc-latin1';
import AES from 'crypto-js/aes';
import JSEncrypt from 'jsencrypt';

declare const MANGO_MATRIX_SDK_VERSION: string;

export interface NetworkResponse<T = any> {
    code: number;
    cnmsg: string;
    enmsg: string;
    data: T | null;
    version: string;
}

export default class HttpRequest {
    public static publicKey: null | string = null;

    public static publicKeyId: null | string = null;

    public static host: null | string = null;

    public static gameVersion: null | string = null;

    public static auth: null | WMP_AUTH = null;

    public static brand: null | string = null; // 设备品牌

    public static model: null | string = null; // 设备型号

    private static aesIv: string = '1234567890123456';

    public static platformData: WMP_PLATFORM_DATA = {
        openid: null,
    };

    public static setSid(sid: string | null) {
        Environment.setStorageItem('sid', sid);
    }

    private static rsaEncrypt(text: string): string {
        if (HttpRequest.publicKey === null) {
            // tslint:disable-next-line: no-console
            console.error('必须先调用init方法进行初始化');
            return;
        }
        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(HttpRequest.publicKey);
        return text
            .match(/.{117}|.+$/g)
            .map(sub => {
                let encryptData = encrypt.encrypt(sub);
                while (String(encryptData).length !== 172 && encryptData) {
                    encryptData = encrypt.encrypt(sub);
                }
                return encryptData;
            })
            .join('');
    }

    private static getAesEncryptKey(): string {
        const keyLength = 16;
        const baseString =
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const arr = [];
        for (let i = 0; i < keyLength; i++) {
            const idx = Math.floor(Math.random() * baseString.length);
            arr.push(baseString[idx]);
        }
        return arr.join('');
    }

    private static aesDecrypt(text: string, aesKey: string): string {
        const key = encLatin1.parse(aesKey);
        const iv = encLatin1.parse(HttpRequest.aesIv);
        return AES.decrypt(text, key, {
            iv,
            // mode: CryptoJS.mode.CBC,
        })
            .toString()
            .split(/(.{2})/)
            .filter(s => s.length === 2)
            .map(s => parseInt(s, 16))
            .map(n => String.fromCharCode(n))
            .join('');
    }

    private static unicodeEscape(str: string): string {
        return str
            .split('')
            .map((char: string): string => {
                const charCode = char.charCodeAt(0);
                if (charCode === 10 || charCode === 9) {
                    // 0x00~0x1F中，除了0x0A（回车），0x09（TAB）这两个，其他全删
                    return char;
                } else if (charCode <= 31 || charCode === 127) {
                    // 127 = DEL， 0x1F = 31
                    return;
                }
                return charCode > 127
                    ? HttpRequest.unicodeCharEscape(charCode)
                    : char; // 高于0x7F的都转译成unicode
            })
            .join('');
    }

    private static unicodeCharEscape(charCode: number): string {
        return '\\u' + HttpRequest.padWithLeadingZeros(charCode.toString(16));
    }

    private static padWithLeadingZeros(str: string): string {
        return new Array(5 - str.length).join('0') + str;
    }

    public static post<T = any>(url: string, data?: {}): Promise<NetworkResponse<T>> {
        if (HttpRequest.publicKey === null || HttpRequest.host === null) {
            // tslint:disable-next-line: no-console
            console.error('必须先调用init方法进行初始化');
            return;
        }
        const aesKey = this.getAesEncryptKey();
        const sid = Environment.getStorageItem('sid');

        const header = {
            'Content-Type': 'application/json',
            'Rsa-Certificate-Id': HttpRequest.publicKeyId,
            'X-ClientInfo-Brand': HttpRequest.brand,
            'X-ClientInfo-Model': HttpRequest.model,
        };

        const postData = {
            rand: aesKey,
            timestamp: new Date().getTime(),
            ua: Environment.platform === 'wx' ? 'wmp' : 'mp',
            sid,
            v: this.gameVersion,
            sv: MANGO_MATRIX_SDK_VERSION,
            data,
        };
        let postDataStr = this.unicodeEscape(JSON.stringify(postData));
        postDataStr = this.rsaEncrypt(postDataStr);

        const request = Environment.post(
            `${this.host}${url}`,
            header,
            postDataStr
        );

        return request.then(cypher => {
            const decryptedRes = this.aesDecrypt(cypher, aesKey);
            if (!decryptedRes) {
                return Promise.reject({
                    code: 500,
                    enmsg: 'Error on decrypt reponse',
                    cnmsg: '解码错误',
                    data: null,
                });
            }
            const response = JSON.parse(decryptedRes);
            if (response.code === 200 && response.enmsg === 'ok') {
                return Promise.resolve(response);
            } else {
                return Promise.reject(response);
            }
        });
    }
}
