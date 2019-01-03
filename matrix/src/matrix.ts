

namespace matrix {
    export interface NetworkConfig {
        url: string;
        data?: {};
    }

    export interface NetworkResponse<T = any> {
        code: number;
        cnmsg: string;
        enmsg: string;
        data: T | null;
    }

    export class HttpRequest {
        private static publicKey: string = `MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC9EYcsLFRsvBrHtRsKg2wt/MNg
fq0YB3U/9cuiuQMvREoH4ElRKlu9oawVwh3MAvfvOcudSbQd02UPqg3X/b6V4ErQ
evfWUF6jJBmJJc4zBSg1U7YqmHX5p9ErZ710ahuurERIVj4pr75zQqHAw/Z3vZMV
t2S8Do6xnVUEC2t2mwIDAQAB`;
        private static aesIv = '1234567890123456';

        private static host = 'https://tge.wmp.brae.co';

        public static sid = null;
        public static loginCode = '';

        public static rsaEncrypt(text: string): string {
            let encrypt = new JSEncrypt();
            encrypt.setPublicKey(HttpRequest.publicKey);
            return text
                .match(/.{117}|.+$/g)
                .map(sub => encrypt.encrypt(sub))
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

        public static post({ url, data = {}}: NetworkConfig): Promise<NetworkResponse> {
            const aesKey = HttpRequest.getAesEncryptKey();
            return new Promise((resolve, reject) => {
                const postData = {
                    rand: aesKey,
                    timestamp: new Date().getTime(),
                    ua: 'wmp',
                    sid: HttpRequest.sid,
                    data: data,
                };
                let postDataStr = JSON.stringify(postData);
                postDataStr = HttpRequest.rsaEncrypt(postDataStr);

                let request = new egret.HttpRequest();
                request.responseType = egret.HttpResponseType.TEXT;
                request.open(`${HttpRequest.host}${url}`, egret.HttpMethod.POST);
                request.setRequestHeader("Content-Type", "application/json");
                request.setRequestHeader("Rsa-Certificate-Id", "1");

                request.send(postDataStr);

                request.addEventListener(egret.Event.COMPLETE, function (evt: egret.Event) {
                    let res = <egret.HttpRequest>evt.currentTarget;
                    const decryptedRes = HttpRequest.aesDecrypt(res.response, aesKey);
                    const data = JSON.parse(decryptedRes);
                    if (data.code == 200 && data.enmsg == 'ok') {
                        resolve(data);
                    } else {
                        reject(data);
                    }
                }, this);
                request.addEventListener(egret.IOErrorEvent.IO_ERROR, function (evt: egret.IOErrorEvent) {
                    reject(evt);
                }, this);
            });
        }
    }
}