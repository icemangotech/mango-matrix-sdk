namespace matrix {
    export type WMP_AUTH = {
        code: string;
    }

    export type WMP_INFO = {
        iv: string;
        encryptedData: string;
    }

    export type WMP_PLATFORM_DATA = {
        openid: string;
    }

    export type USER_DATA_TYPE = {
        id: number,
        nickname: string,
        avatar: string,
        gender: null,               // “男” ， “女” 或 null 表示未知,
        country: string,
        province: string,
        city: string,
        language: string,
        register_time: number,
        phone: string,              // 未知时为null
        email: string,              // 未知时为null
        birthday: number,           // unix时间戳表示生日 未知时为null
    }

    export type USER_GAME_DATA_TYPE<T> = {
        id: number,                         // 与user_data中的id相同
        share: USER_GAME_DATA_SHARE_TYPE,
        rank: USER_GAME_DATA_RANK_TYPE,
        extra: T,
    }

    export type USER_GAME_DATA_SHARE_TYPE = {
        time_count: number,                 // 成功分享次数
        time_count_today: number,           // 今日成功分享次数
        invite_count: number,               // 已邀请好友数
        invite_count_today: number,         // 今日已邀请好友数
    }

    export type USER_GAME_DATA_RANK_TYPE = {
        week_ranking: string,               // "1（该项为字符串，可能存在非数字字符）"
        week_score: string,                 // 本周最高分
        ranking: string,                    // 总排名 (如："未上榜")
        max_score: string,                  // 历史最高分
        week_friends_ranking: string,       // 本周好友榜排名，若游戏未开启好友榜功能则为null
        friends_ranking: string,            // 好友榜总排名，若游戏未开启好友榜功能则为null
    }

    export type NAVIGATE_BOX_ITEM_TYPE = {
        id: string;
        pic: string;
        icon: string;
        name: string;
        appId: string,
        query: string;
        path: string;
        extraData: any;
        envVersion: string;
    };

    export type NAVIGATE_BOX_ITEM_RES_TYPE = {
        id: string | number;
        pic: string;
        icon: string;
        name: string;
        appId: string,
        query: {
            [k: string]: any;
        };
        path: string;
        extraData: any;
        envVersion: string;
    }
}
