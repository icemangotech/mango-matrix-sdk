export type LoginInfoWmp = {
    iv: string;
    encryptedData: string;
};

/**
 * @deprecated use `LoginInfoWmp`
 */
export type WMP_INFO = LoginInfoWmp;

export type PlatformDataWmp = {
    openid: string;
};

/**
 * @deprecated use `PlatformDataWmp`
 */
export type WMP_PLATFORM_DATA = PlatformDataWmp;

export interface UserData {
    id: number;
    nickname: string;
    avatar: string;
    gender: null; // “男” ， “女” 或 null 表示未知,
    country: string;
    province: string;
    city: string;
    language: string;
    register_time: number;
    phone: string; // 未知时为null
    email: string; // 未知时为null
    birthday: number; // unix时间戳表示生日 未知时为null
}

/**
 * @deprecated use `UserData`
 */
export type USER_DATA_TYPE = UserData;

export interface UserGameData<T> {
    /**
     * 与 `UserData` 中的 `id` 相同
     */
    id: number;
    share: UserGameShareData;
    rank: UserGameRankData;
    extra: T;
}

/**
 * @deprecated use `UserGameData<T>`
 */
export type USER_GAME_DATA_TYPE<T> = UserGameData<T>;

export type UserGameShareData = {
    time_count: number; // 成功分享次数
    time_count_today: number; // 今日成功分享次数
    invite_count: number; // 已邀请好友数
    invite_count_today: number; // 今日已邀请好友数
};

/**
 * @deprecated use `UserGameShareData`
 */
export type USER_GAME_DATA_SHARE_TYPE = UserGameShareData;

export type UserGameRankData = {
    week_ranking: string; // "1（该项为字符串，可能存在非数字字符）"
    week_score: string; // 本周最高分
    ranking: string; // 总排名 (如："未上榜")
    max_score: string; // 历史最高分
    week_friends_ranking: string; // 本周好友榜排名，若游戏未开启好友榜功能则为null
    friends_ranking: string; // 好友榜总排名，若游戏未开启好友榜功能则为null
};

/**
 * @deprecated use `UserGameRankData`
 */
export type USER_GAME_DATA_RANK_TYPE = UserGameRankData;

type NavigateBoxItemBase = {
    pic: string;
    icon: string;
    name: string;
    appId: string;
    path: string;
    extraData: any;
    envVersion: string;
};

export type NavigateBoxItem = NavigateBoxItemBase & {
    id: string;
    query: string;
};

/**
 * @deprecated use `NavigateBoxItem`
 */
export type NAVIGATE_BOX_ITEM_TYPE = NavigateBoxItem;

export type NavigateBoxItemResponse = NavigateBoxItemBase & {
    id: string | number;
    query: {
        [k: string]: any;
    };
};

/**
 * @deprecated use `NavigateBoxItemResponse`
 */
export type NAVIGATE_BOX_ITEM_RES_TYPE = NavigateBoxItemResponse;

export type UserIpInfo = {
    ip: string;
    country: string;
    province: string;
    city: string;
    county: string;
    isp: string;
    zone_code: number;
    longitude: number;
    latitude: number;
};

/**
 * @deprecated use `UserIpInfo`
 */
export type USER_IP_INFO_TYPE = UserIpInfo;
