import { querystring } from './querystringify';

namespace Platform {
    type PlatformNative = 'wx' | 'web';

    export const Native: PlatformNative = 'wx' in window ? 'wx' : 'web';

    export function select<T>(platformSpecific: {
        [platform in PlatformNative | 'default']?: T
    }) {
        return Native in platformSpecific ? platformSpecific[Native]: platformSpecific.default
    }

    export function getLaunchOptionsSync() {
        switch (Native) {
            case 'wx':
                return wx.getLaunchOptionsSync();
            default:
                const url = window.location.href;
                const query = url.split('?')[1];
                return { query: querystring(query), scene: undefined };
        }
    }

    export function getSystemInfoSync() {
        switch (Native) {
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
        switch (Native) {
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

    export function setStorageItem(key: string, value: string | null) {
        switch (Native) {
            case 'wx':
                wx.setStorageSync(key, value);
            default:
                if (value === null) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, value);
                }
        }
    }

    export function getStorageItem(key: string) {
        switch (Native) {
            case 'wx':
                return wx.getStorageSync(key);
            default:
                return localStorage.getItem(key);
        }
    }
}

export default Platform;
