import HttpRequest from './http';
import BuriedPoint from './buried';
import {
    WMP_PLATFORM_DATA,
    WMP_AUTH,
    WMP_INFO,
    USER_DATA_TYPE,
    USER_GAME_DATA_RANK_TYPE,
    USER_GAME_DATA_SHARE_TYPE,
    USER_GAME_DATA_TYPE,
    USER_IP_INFO_TYPE,
    NAVIGATE_BOX_ITEM_RES_TYPE,
    NAVIGATE_BOX_ITEM_TYPE,
} from './data';

export default class Matrix {
    public static version = '2.0.0';

    public static init(
        host: string,
        rsaPublicKey: string,
        rsaPublicKeyId: string,
        gameVersion: string
    ): void {
        HttpRequest.host = host;
        HttpRequest.publicKey = rsaPublicKey;
        HttpRequest.publicKeyId = rsaPublicKeyId;
        HttpRequest.gameVersion = gameVersion;

        BuriedPoint.lastTimestamp = Date.now();

        const { query, scene } = wx.getLaunchOptionsSync();
        wx.setStorageSync('share_id', query.share_id);
        wx.setStorageSync('share_doc_id', query.share_doc_id);
        wx.setStorageSync('channel_id', query.channel_id);
        wx.setStorageSync('mango_tmpid', query.mango_tmpid);
        wx.setStorageSync('scene', scene);
        wx.setStorageSync('sid', null);

        const { brand, model } = wx.getSystemInfoSync();
        HttpRequest.brand = brand;
        HttpRequest.model = model;
    }

    // Rank

    /**
     * 获取周排行榜
     */
    public static getWoldWeekRank(): Promise<{
        my_ranking: string;
        my_score: string;
        list: Array<{
            id: number;
            name: string;
            score: string;
            avatar: string;
        }>;
    }> {
        return HttpRequest.post('/rank/listing/week', {}).then(res => res.data);
    }

    /**
     * 获取总排行榜
     */
    public static getWoldAllRank(): Promise<{
        my_ranking: string;
        my_score: string;
        list: Array<{
            id: number;
            name: string;
            score: string;
            avatar: string;
        }>;
    }> {
        return HttpRequest.post('/rank/listing/all', {}).then(res => res.data);
    }

    // Share

    public static getAllShareUsers<T>(): Promise<{
        last_page: boolean;
        invite_count: number;
        invite_count_today: number;
        users: Array<{
            id: number;
            avatar: string;
            config: T;
        }>;
        today_login: null; // @todo
    }> {
        return HttpRequest.post('/share/users', {}).then(res => res.data);
    }

    public static getShareUserInfo<T>(
        userId: number
    ): Promise<{
        id: number;
        avatar: string;
        config: T;
    }> {
        return HttpRequest.post(`/share/user/${userId}`, {}).then(
            res => res.data
        );
    }

    public static updateShareUserInfo<T>(
        userId: number,
        config: T
    ): Promise<{
        config: T;
    }> {
        return HttpRequest.post(`/share/user/config/${userId}`, config).then(
            res => res.data
        );
    }

    /**
     * 根据分享文案的键名获取分享文案
     * @param docKey 分享文案的键名
     */
    public static getShareDoc(
        docKey: string,
        isPrepare: boolean = false
    ): Promise<{
        button_name: string;
        id: string | null;
        title: string;
        image: string;
        shareQuery: string;
    }> {
        return HttpRequest.post(
            `/share/doc/${docKey}${isPrepare ? '/prepare' : ''}?v=2`,
            {}
        ).then(res => ({
            ...res.data,
            shareQuery: `share_id=${HttpRequest.platformData.openid}&share_doc_id=${res.data.id}`,
        }));
    }

    // User

    public static async login<T, G>(): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: G;
        navigate: NAVIGATE_BOX_ITEM_TYPE;
        navigate_list: NAVIGATE_BOX_ITEM_TYPE[];
        box_layout: {
            highlight: NAVIGATE_BOX_ITEM_TYPE[];
            category: Array<{
                name: string;
                icon: string;
                list: NAVIGATE_BOX_ITEM_TYPE[];
            }>;
        };
        platform_data: WMP_PLATFORM_DATA;
        ip_info: USER_IP_INFO_TYPE;
    }> {
        const { code } = await this.wxLogin();
        HttpRequest.auth = { code };
        const shareId = wx.getStorageSync('share_id');
        const shareDocId = wx.getStorageSync('share_doc_id');
        const channelId = wx.getStorageSync('channel_id');
        const mangoTmpid = wx.getStorageSync('mango_tmpid');
        const scene = wx.getStorageSync('scene');
        return HttpRequest.post('/user/auth/wmp', {
            share_id: shareId,
            share_doc_id: shareDocId,
            channel_id: channelId,
            mango_tmpid: mangoTmpid,
            scene,
            info: null,
            auth: HttpRequest.auth,
        }).then(res => {
            HttpRequest.platformData = res.data.platform_data;
            wx.setStorageSync('sid', res.data.sid);
            return {
                ...res.data,
                navigate_list: res.data.navigate_list.map(
                    (item: NAVIGATE_BOX_ITEM_RES_TYPE) => ({
                        ...item,
                        id: String(item.id),
                        query: Object.keys(item.query)
                            .map(k => `${k}=${item.query[k]}`)
                            .join('&'),
                    })
                ),
                box_layout: {
                    highlight: res.data.box_layout.highlight.map(
                        (item: NAVIGATE_BOX_ITEM_RES_TYPE) => ({
                            ...item,
                            id: String(item.id),
                            query: Object.keys(item.query)
                                .map(k => `${k}=${item.query[k]}`)
                                .join('&'),
                        })
                    ),
                    category: res.data.box_layout.category.map(
                        (c: {
                            name: string;
                            icon: string;
                            list: NAVIGATE_BOX_ITEM_RES_TYPE[];
                        }) => ({
                            ...c,
                            list: c.list.map(item => ({
                                ...item,
                                id: String(item.id),
                                query: Object.keys(item.query)
                                    .map(k => `${k}=${item.query[k]}`)
                                    .join('&'),
                            })),
                        })
                    ),
                },
            };
        });
    }

    /**
     * 异步封装的 wx.login
     */
    public static async wxLogin(): Promise<{
        code: string;
    }> {
        return new Promise(
            (
                resolve: (response: { code: string }) => any,
                reject: () => any
            ) => {
                wx.login({
                    success: res => {
                        resolve({ ...res });
                    },
                    fail: () => {
                        reject();
                    },
                });
            }
        );
    }

    /**
     * 获取 platform_data
     */
    public static getPlatformData(): WMP_PLATFORM_DATA {
        return HttpRequest.platformData;
    }

    /**
     * 授权成功后调用
     */
    public static async onAuth<T, G>(
        info: WMP_INFO
    ): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: G;
        navigate: NAVIGATE_BOX_ITEM_TYPE;
        navigate_list: NAVIGATE_BOX_ITEM_TYPE[];
        box_layout: {
            highlight: NAVIGATE_BOX_ITEM_TYPE[];
            category: Array<{
                name: string;
                icon: string;
                list: NAVIGATE_BOX_ITEM_TYPE[];
            }>;
        };
        platform_data: WMP_PLATFORM_DATA;
        ip_info: USER_IP_INFO_TYPE;
    }> {
        const shareId = wx.getStorageSync('share_id');
        const shareDocId = wx.getStorageSync('share_doc_id');
        const channelId = wx.getStorageSync('channel_id');
        const mangoTmpid = wx.getStorageSync('mango_tmpid');
        const scene = wx.getStorageSync('scene');
        return HttpRequest.post('/user/auth/wmp', {
            share_id: shareId,
            share_doc_id: shareDocId,
            channel_id: channelId,
            mango_tmpid: mangoTmpid,
            scene,
            info,
            auth: HttpRequest.auth,
        }).then(res => {
            HttpRequest.platformData = res.data.platform_data;
            wx.setStorageSync('sid', res.data.sid);
            return {
                ...res.data,
                navigate_list: res.data.navigate_list.map(
                    (item: NAVIGATE_BOX_ITEM_RES_TYPE) => ({
                        ...item,
                        id: String(item.id),
                        query: Object.keys(item.query)
                            .map(k => `${k}=${item.query[k]}`)
                            .join('&'),
                    })
                ),
                box_layout: {
                    highlight: res.data.box_layout.highlight.map(
                        (item: NAVIGATE_BOX_ITEM_RES_TYPE) => ({
                            ...item,
                            id: String(item.id),
                            query: Object.keys(item.query)
                                .map(k => `${k}=${item.query[k]}`)
                                .join('&'),
                        })
                    ),
                    category: res.data.box_layout.category.map(
                        (c: {
                            name: string;
                            icon: string;
                            list: NAVIGATE_BOX_ITEM_RES_TYPE[];
                        }) => ({
                            ...c,
                            list: c.list.map(item => ({
                                ...item,
                                id: String(item.id),
                                query: Object.keys(item.query)
                                    .map(k => `${k}=${item.query[k]}`)
                                    .join('&'),
                            })),
                        })
                    ),
                },
            };
        });
    }

    /**
     * 获取用户信息
     */
    public static async getUserInfo<T, G>(): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: G;
        platform_data: WMP_PLATFORM_DATA;
    }> {
        const { iv, encryptedData } = await this.wxGetUserInfo();
        const shareId = wx.getStorageSync('share_id');
        const shareDocId = wx.getStorageSync('share_doc_id');
        const channelId = wx.getStorageSync('channel_id');
        const mangoTmpid = wx.getStorageSync('mango_tmpid');
        const scene = wx.getStorageSync('scene');
        return HttpRequest.post('/user/auth/wmp', {
            share_id: shareId,
            share_doc_id: shareDocId,
            channel_id: channelId,
            mango_tmpid: mangoTmpid,
            scene,
            info: {
                iv,
                encryptedData,
            },
            auth: HttpRequest.auth,
        }).then(res => {
            HttpRequest.platformData = res.data.platform_data;
            wx.setStorageSync('sid', res.data.sid);
            return res.data;
        });
    }

    /**
     * 异步封装的 wx.getUserInfo
     */
    public static async wxGetUserInfo(): Promise<{
        iv: string;
        encryptedData: string;
    }> {
        return new Promise(
            (
                resolve: (response: {
                    iv: string;
                    encryptedData: string;
                }) => any,
                reject: () => any
            ) => {
                wx.getUserInfo({
                    withCredentials: true,
                    lang: 'zh_CN',
                    success: res => {
                        resolve({
                            iv: res.iv,
                            encryptedData: res.encryptedData,
                        });
                    },
                    fail: () => {
                        reject();
                    },
                });
            }
        );
    }

    /**
     * 获取用户数据
     */
    public static async getUserData<T>(): Promise<{
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
    }> {
        return HttpRequest.post('/user/data', {}).then(res => {
            return res.data;
        });
    }

    /**
     * 获取游戏配置
     */
    public static async getGameConfig<G>(): Promise<{
        game_config: G;
        navigate: NAVIGATE_BOX_ITEM_TYPE;
        navigate_list: NAVIGATE_BOX_ITEM_TYPE[];
        box_layout: {
            highlight: NAVIGATE_BOX_ITEM_TYPE[];
            category: Array<{
                name: string;
                icon: string;
                list: NAVIGATE_BOX_ITEM_TYPE[];
            }>;
        };
        ip_info: USER_IP_INFO_TYPE;
    }> {
        return HttpRequest.post('/game/config', {}).then(res => ({
            ...res.data,
            navigate_list: res.data.navigate_list.map(
                (item: NAVIGATE_BOX_ITEM_RES_TYPE) => ({
                    ...item,
                    id: String(item.id),
                    query: Object.keys(item.query)
                        .map(k => `${k}=${item.query[k]}`)
                        .join('&'),
                })
            ),
            box_layout: {
                highlight: res.data.box_layout.highlight.map(
                    (item: NAVIGATE_BOX_ITEM_RES_TYPE) => ({
                        ...item,
                        id: String(item.id),
                        query: Object.keys(item.query)
                            .map(k => `${k}=${item.query[k]}`)
                            .join('&'),
                    })
                ),
                category: res.data.box_layout.category.map(
                    (c: {
                        name: string;
                        icon: string;
                        list: NAVIGATE_BOX_ITEM_RES_TYPE[];
                    }) => ({
                        ...c,
                        list: c.list.map(item => ({
                            ...item,
                            id: String(item.id),
                            query: Object.keys(item.query)
                                .map(k => `${k}=${item.query[k]}`)
                                .join('&'),
                        })),
                    })
                ),
            },
        }));
    }

    /**
     * 提交extra
     * @param extra
     */
    public static async submitExtra<T>(
        extra: T,
        returnUserGameData: number,
        score: number | null = null
    ): Promise<{
        user_game_data: USER_GAME_DATA_TYPE<T>;
        new_record: boolean;
        new_weekly_record: boolean;
    }> {
        return HttpRequest.post('/user/gamedata/extra', {
            extra,
            return_user_game_data: returnUserGameData,
            score,
        }).then(res => res.data);
    }

    /**
     * 提交积分
     */
    public static async submitScore<T>(
        score: number
    ): Promise<{
        user_game_data: USER_GAME_DATA_TYPE<T>;
        new_record: boolean;
        new_weekly_record: boolean;
    }> {
        return HttpRequest.post('/user/gamedata/score', { score }).then(res => {
            return res.data;
        });
    }
}
