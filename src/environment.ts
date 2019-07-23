import { querystring } from './querystringify';

namespace Environment {
    enum Engine {
        None,
        Egret,
        Cocos,
        Laya,
    }

    const checkGlobalModule = (name: string) => name in window;

    export const engine: Engine = checkGlobalModule('egret')
        ? Engine.Egret
        : checkGlobalModule('cc')
        ? Engine.Cocos
        : checkGlobalModule('Laya')
        ? Engine.Laya
        : Engine.None;

    type Platform = 'wx' | 'web';

    export const platform: Platform = checkGlobalModule('wx') ? 'wx' : 'web';

    export function select<T>(
        platformSpecific: {
            [plat in Platform | 'default']?: T;
        }
    ) {
        return platform in platformSpecific
            ? platformSpecific[platform]
            : platformSpecific.default;
    }

    export function getLaunchOptionsSync() {
        switch (platform) {
            case 'wx':
                return wx.getLaunchOptionsSync();
            default:
                const url = window.location.href;
                const query = url.split('?')[1];
                return { query: querystring(query), scene: undefined };
        }
    }

    export function getSystemInfoSync() {
        switch (platform) {
            case 'wx':
                return wx.getSystemInfoSync();
            default:
                return {
                    model: '',
                    brand: '',
                };
        }
    }

    export function post(
        url: string,
        header: { [name: string]: string },
        postData: string
    ) {
        switch (platform) {
            case 'wx':
                return new Promise<string>((resolve, reject) => {
                    wx.request({
                        url: `${url}`,
                        data: postData,
                        header,
                        method: 'POST',
                        success: res => resolve(res.data),
                        fail: () => {
                            reject({
                                code: 500,
                                enmsg: 'Fail Network response',
                                cnmsg: '网络错误',
                                data: null,
                            });
                        },
                    });
                });
            default:
                return fetch(url, {
                    body: postData,
                    headers: header,
                    method: 'POST',
                }).then(res => res.text());
        }
    }

    export function clearStorage() {
        localStorage.clear();
    }

    export function setStorageItem(key: string, value?: string | null) {
        if (value === null || value === undefined) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    }

    export function getStorageItem(key: string) {
        return localStorage.getItem(key);
    }
}

export default Environment;
