import HttpRequest from './http';
import BuriedPoint from './buried';
import Purchase, { PurchaseRestrict } from './purchase';
import { navigateBoxItemStringify } from './utils';
import {
    PlatformDataWmp,
    LoginInfoWmp,
    UserData,
    UserGameData,
    UserIpInfo,
    NavigateBoxItemResponse,
    NavigateBoxItem,
} from './data';
import Environment from './environment';
import { PURCHASE_RESTRICT, IP_INFO } from './variables';
import { queryStringify } from './utils';

declare const MANGO_MATRIX_SDK_VERSION: string;

export default class Matrix {
    public static version = MANGO_MATRIX_SDK_VERSION;

    public static Purchase = Purchase;

    public static BuriedPoint = BuriedPoint;

    /**
     * 预先与我方联系获取参数
     *
     * **必须首先调用**
     *
     * @param {string} host 域名
     * @param {string} rsaPublicKey RSA 加密公钥
     * @param {string} rsaPublicKeyId 公钥 ID
     * @param {string} gameVersion 游戏版本
     */
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

        const { query, scene } = Environment.getLaunchOptionsSync();
        ['share_id', 'share_doc_id', 'channel_id', 'mango_tmpid'].forEach(
            item => {
                Environment.setStorageItem(item, query[item]);
            }
        );
        Environment.setStorageItem('scene', scene);
        HttpRequest.setSid();

        const { brand, model } = Environment.getSystemInfoSync();
        HttpRequest.brand = brand;
        HttpRequest.model = model;
    }

    // Rank

    /**
     * 获取周排行榜
     */
    public static getWorldWeekRank(): Promise<{
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
    public static getWorldAllRank(): Promise<{
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

    /**
     * 获取所有邀请的用户
     *
     * @template T 只有当前用户可见的，绑定在被邀请用户对象上的存档
     */
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

    /**
     * 获取单个被邀请用户的信息
     *
     * @template T 同 getAllShareUsers
     * @param {number} userId 用户ID
     */
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

    /**
     * 更新某个被邀请用户的 config
     *
     * @template T 同 getAllShareUsers
     * @param {number} userId 用户 ID
     * @param {T} config 新 config
     */
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
     * 获取指定键名对应的文案
     *
     * @param {string} docKey 键
     * @param {boolean} [isPrepare=false]
     * 接管微信右上角分享那里不能通过这种方式获取文案，所以，getShareDoc提供一个参数isPrepare，
     * 默认值是false，当传入true的时候依然能够获取分享文案，但这个分享的请求就不作为统计项了。这
     * 个可以用来在游戏启动时初始化获取文案，为用户的右上角分享做准备。除了右上角分享之外，都是需
     * 要在拉起分享的前一刻通过SDK获取文案与图片
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
            shareQuery: queryStringify({
                share_id: HttpRequest.platformData.openid,
                share_doc_id: res.data.id,
            }),
        }));
    }

    // User

    private static getAuthData() {
        const res = {};
        [
            'share_id',
            'share_doc_id',
            'channel_id',
            'mango_tmpid',
            'scene',
        ].forEach(item => {
            res[item] = Environment.getStorageItem(item) || null;
        });
        return res;
    }

    public static async login<T, G extends { purchase?: PurchaseRestrict }>(
        code?: string
    ) {
        let authCode = code;
        if (Environment.platform === 'wx') {
            const wxResult = await this.wxLogin();
            authCode = wxResult.code;
        }
        HttpRequest.auth = { code: authCode };
        return this.onAuthApi<T, G>(null);
    }

    /**
     * 异步封装的 wx.login
     */
    private static async wxLogin(): Promise<{
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
    public static getPlatformData(): PlatformDataWmp {
        return HttpRequest.platformData;
    }

    /**
     * 授权成功后调用
     *
     * @platform Wechat
     */
    public static onAuth<T, G extends { purchase?: PurchaseRestrict }>(
        info: LoginInfoWmp
    ) {
        return this.onAuthApi<T, G>(info);
    }

    /**
     * 获取用户信息
     *
     * @platform Wechat
     */
    public static async getUserInfo<
        T,
        G extends { purchase?: PurchaseRestrict }
    >() {
        if (Environment.platform !== 'wx') {
            return Promise.reject('Not on WeChat');
        }
        const { iv, encryptedData } = await this.wxGetUserInfo();
        return this.onAuthApi<T, G>({ iv, encryptedData });
    }

    private static async onAuthApi<
        T,
        G extends { purchase?: PurchaseRestrict }
    >(info: LoginInfoWmp | null) {
        const res = await HttpRequest.post<{
            server_time: number;
            sid: string;
            user_data: UserData;
            user_game_data: UserGameData<T>;
            game_config: G;
            navigate: NavigateBoxItem;
            navigate_list: NavigateBoxItemResponse[];
            box_layout: {
                highlight: NavigateBoxItemResponse[];
                category: Array<{
                    name: string;
                    icon: string;
                    list: NavigateBoxItemResponse[];
                }>;
            };
            platform_data: PlatformDataWmp;
            ip_info: UserIpInfo;
        }>(`/user/auth/${Environment.platform === 'wx' ? 'wmp' : 'mp'}`, {
            ...this.getAuthData(),
            info,
            auth: HttpRequest.auth,
        });
        const { navigate_list, box_layout, ...data } = res.data;
        HttpRequest.platformData = data.platform_data;
        HttpRequest.setSid(data.sid);
        this.savePurchaseInfo(data.game_config.purchase, data.ip_info);
        return {
            ...data,
            navigate_list: navigateBoxItemStringify(navigate_list),
            box_layout: {
                highlight: navigateBoxItemStringify(box_layout.highlight),
                category: box_layout.category.map(cat => ({
                    ...cat,
                    list: navigateBoxItemStringify(cat.list),
                })),
            },
        };
    }

    /**
     * 异步封装的 wx.getUserInfo
     */
    private static async wxGetUserInfo(): Promise<{
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
        user_data: UserData;
        user_game_data: UserGameData<T>;
    }> {
        return HttpRequest.post('/user/data', {}).then(res => {
            return res.data;
        });
    }

    /**
     * 获取游戏配置
     */
    public static async getGameConfig<
        G extends { purchase?: PurchaseRestrict }
    >() {
        return HttpRequest.post<{
            game_config: G;
            navigate: NavigateBoxItem;
            navigate_list: NavigateBoxItemResponse[];
            box_layout: {
                highlight: NavigateBoxItemResponse[];
                category: Array<{
                    name: string;
                    icon: string;
                    list: NavigateBoxItemResponse[];
                }>;
            };
            ip_info: UserIpInfo;
        }>('/game/config', {}).then(res => {
            this.savePurchaseInfo(
                res.data.game_config.purchase,
                res.data.ip_info
            );
            const { navigate_list, box_layout, ...data } = res.data;
            return {
                ...data,
                navigate_list: navigateBoxItemStringify(navigate_list),
                box_layout: {
                    highlight: navigateBoxItemStringify(box_layout.highlight),
                    category: box_layout.category.map(cat => ({
                        ...cat,
                        list: navigateBoxItemStringify(cat.list),
                    })),
                },
            };
        });
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
        user_game_data: UserGameData<T>;
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
        user_game_data: UserGameData<T>;
        new_record: boolean;
        new_weekly_record: boolean;
    }> {
        return HttpRequest.post('/user/gamedata/score', { score }).then(res => {
            return res.data;
        });
    }

    private static savePurchaseInfo(
        purchase?: PurchaseRestrict,
        ipInfo?: UserIpInfo
    ) {
        if (purchase) {
            const str = JSON.stringify(purchase);
            Environment.setStorageItem(PURCHASE_RESTRICT, str);
        }
        if (ipInfo) {
            const str = JSON.stringify(ipInfo);
            Environment.setStorageItem(IP_INFO, str);
        }
    }
}
