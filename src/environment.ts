import { querystring } from './querystringify';

namespace Environment {

    type Platform = 'wx' | 'web';

    export const platform: Platform = typeof wx !== 'undefined' ? 'wx' : 'web';

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
            case 'web':
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
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        } else {
            wx.clearStorageSync();
        }
    }

    export function setStorageItem(key: string, value?: string | null) {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
        } else {
            wx.setStorageSync(key, value);
        }
    }

    export function getStorageItem(key: string): string {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem(key);
        } else {
            return wx.getStorageSync(key);
        }
    }
}

export default Environment;
