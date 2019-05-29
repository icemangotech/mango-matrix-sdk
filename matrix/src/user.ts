/// <reference path="http.ts" />
/// <reference path="data.ts" />

namespace matrix {
    export async function login<T, G>(): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: G;
        navigate: NAVIGATE_BOX_ITEM_TYPE;
        navigate_list: Array<NAVIGATE_BOX_ITEM_TYPE>;
        platform_data: WMP_PLATFORM_DATA;
    }> {
        const { code } = await wxLogin();
        HttpRequest.auth = { code };
        let shareId = null;
        let shareDocId = null;
        let channelId = null;
        let mangoTmpid = null;
        if (Laya.Browser.onWeiXin) {
            shareId = wx.getStorageSync('share_id');
            shareDocId = wx.getStorageSync('share_doc_id');
            channelId = wx.getStorageSync('channel_id');
            mangoTmpid = wx.getStorageSync('mango_tmpid');
        }
        return HttpRequest.post('/user/auth/wmp', {
            share_id: shareId,
            share_doc_id: shareDocId,
            channel_id: channelId,
            mango_tmpid: mangoTmpid,
            info: null,
            auth: HttpRequest.auth,
        }).then((res) => {
            HttpRequest.platformData = res.data.platform_data;
            if (Laya.Browser.onWeiXin) {
                wx.setStorageSync('sid', res.data.sid);
            }
            return {
                ...res.data,
                navigate_list: res.data.navigate_list.map((item: NAVIGATE_BOX_ITEM_TYPE) => ({
                    ...item,
                    id: String(item.id),
                })),
            };
        });
    }

    /**
     * 异步封装的 wx.login
     */
    export async function wxLogin(): Promise<{
        code: string;
    }> {
        return new Promise((resolve: (response: { code: string }) => any, reject: () => any) => {
            if (Laya.Browser.onWeiXin) {
                wx.login({
                    success: (res) => {
                        resolve({ ...res });
                    },
                    fail: () => {
                        reject();
                    },
                });
            }
        });
    }

    /**
     * 获取 platform_data
     */
    export function getPlatformData(): WMP_PLATFORM_DATA {
        return HttpRequest.platformData;
    }

    /**
     * 授权成功后调用
     */
    export async function onAuth<T, G>(info: WMP_INFO): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: G;
        navigate: NAVIGATE_BOX_ITEM_TYPE;
        navigate_list: Array<NAVIGATE_BOX_ITEM_TYPE>;
        platform_data: WMP_PLATFORM_DATA;
    }> {
        let shareId = null;
        let shareDocId = null;
        let channelId = null;
        let mangoTmpid = null;
        if (Laya.Browser.onWeiXin) {
            shareId = wx.getStorageSync('share_id');
            shareDocId = wx.getStorageSync('share_doc_id');
            channelId = wx.getStorageSync('channel_id');
            mangoTmpid = wx.getStorageSync('mango_tmpid');
        }
        return HttpRequest.post('/user/auth/wmp', {
            share_id: shareId,
            share_doc_id: shareDocId,
            channel_id: channelId,
            mango_tmpid: mangoTmpid,
            info: info,
            auth: HttpRequest.auth,
        }).then((res) => {
            HttpRequest.platformData = res.data.platform_data;
            if (Laya.Browser.onWeiXin) {
                wx.setStorageSync('sid', res.data.sid);
            }
            return {
                ...res.data,
                navigate_list: res.data.navigate_list.map((item: NAVIGATE_BOX_ITEM_TYPE) => ({
                    ...item,
                    id: String(item.id),
                })),
            };
        });
    }

    /**
     * 获取用户信息
     */
    export async function getUserInfo<T, G>(): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: G;
        platform_data: WMP_PLATFORM_DATA;
    }> {
        const { iv, encryptedData } = await wxGetUserInfo();
        let shareId = null;
        let shareDocId = null;
        let channelId = null;
        let mangoTmpid = null;
        if (Laya.Browser.onWeiXin) {
            shareId = wx.getStorageSync('share_id');
            shareDocId = wx.getStorageSync('share_doc_id');
            channelId = wx.getStorageSync('channel_id');
            mangoTmpid = wx.getStorageSync('mango_tmpid');
        }
        return HttpRequest.post('/user/auth/wmp', {
            share_id: shareId,
            share_doc_id: shareDocId,
            channel_id: channelId,
            mango_tmpid: mangoTmpid,
            info: {
                iv,
                encryptedData,
            },
            auth: HttpRequest.auth,
        }).then((res) => {
            HttpRequest.platformData = res.data.platform_data;
            if (Laya.Browser.onWeiXin) {
                wx.setStorageSync('sid', res.data.sid);
            }
            return res.data;
        });
    }

    /**
     * 异步封装的 wx.getUserInfo
     */
    export async function wxGetUserInfo(): Promise<{
        iv: string;
        encryptedData: string;
    }> {
        return new Promise((
            resolve: (
                response: { iv: string; encryptedData: string }
            ) => any,
            reject: () => any
        ) => {
            if (Laya.Browser.onWeiXin) {
                wx.getUserInfo({
                    withCredentials: true,
                    lang: 'zh_CN',
                    success: (res) => {
                        resolve({
                            iv: res.iv,
                            encryptedData: res.encryptedData,
                        });
                    },
                    fail: () => {
                        reject();
                    }
                })
            }
        });
    }

    /**
     * 获取用户数据
     */
    export async function getUserData<T>(): Promise<{
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
    }> {
        return HttpRequest.post('/user/data', {})
            .then((res) => {
                return res.data;
            });
    }

    /**
     * 获取游戏配置
     */
    export async function getGameConfig<G>(): Promise<{
        game_config: G;
        navigate: NAVIGATE_BOX_ITEM_TYPE;
        navigate_list: Array<NAVIGATE_BOX_ITEM_TYPE>;
    }> {
        return HttpRequest.post('/game/config', {})
            .then((res) => ({
                ...res.data,
                navigate_list: res.data.navigate_list.map((item: NAVIGATE_BOX_ITEM_TYPE) => ({
                    ...item,
                    id: String(item.id),
                })),
            }));
    }

    /**
     * 提交extra
     * @param extra
     */
    export async function submitExtra<T>(extra: T, returnUserGameData: number, score: number | null = null): Promise<{
        user_game_data: USER_GAME_DATA_TYPE<T>;
        new_record: boolean;
        new_weekly_record: boolean;
    }> {
        return HttpRequest.post('/user/gamedata/extra', {
            extra,
            return_user_game_data: returnUserGameData,
            score,
        }).then((res) => res.data);
    }

    /**
     * 提交积分
     */
    export async function submitScore<T>(score: number): Promise<{
        user_game_data: USER_GAME_DATA_TYPE<T>;
        new_record: boolean;
        new_weekly_record: boolean;
    }> {
        return HttpRequest.post('/user/gamedata/score', { score })
            .then(res => {
                return res.data;
            });
    }
}
