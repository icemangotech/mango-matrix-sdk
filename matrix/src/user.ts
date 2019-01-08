/// <reference path="http.ts" />
/// <reference path="data.ts" />

namespace matrix {
    /**
     * 初始化
     * @param host 请求主机名
     * @param rsaPublicKey rsa加密公钥
     */
    export function init(host: string, rsaPublicKey: string): void {
        HttpRequest.host = host;
        HttpRequest.publicKey = rsaPublicKey;

        HttpRequest.shareId = egret.getOption('share_id');
        HttpRequest.shareDocId = egret.getOption('share_doc_id');
        HttpRequest.channelId = egret.getOption('channel_id');
        HttpRequest.mangoTmpid = egret.getOption('mango_tmpid');
    }

    /**
     * 登录成功后调用
     */
    export function onLogin(auth: WMP_AUTH): void {
        HttpRequest.auth = auth;
    }

    /**
     * 授权成功后调用
     */
    export function onAuth<T>(info: WMP_INFO): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: any;       // @todo
        platform_data: WMP_PLATFORM_DATA;
    }> {
        return HttpRequest.post('/user/auth/wmp', {
            share_id: HttpRequest.shareId,
            share_doc_id: HttpRequest.shareDocId,
            channel_id: HttpRequest.channelId,
            mango_tmpid: HttpRequest.mangoTmpid,
            info: info,
            auth: HttpRequest.auth,
        }).then((res) => {
            HttpRequest.sid = res.data.sid;
            return res.data;
        });
    }

    /**
     * 获取用户数据
     */
    export function getUserData<T>(): Promise<{
        user_data: USER_DATA_TYPE,
        user_game_data: USER_GAME_DATA_TYPE<T>,
    }> {
        return HttpRequest.post('/user/data', {})
            .then((res) => {
                return res.data;
            });
    }

    /**
     * 提交extra
     * @param extra
     */
    export function submitExtra<T>(extra: T): Promise<{
        user_game_data: USER_GAME_DATA_TYPE<T>,
        new_record: boolean,
        new_weekly_record: boolean,
    }> {
        return HttpRequest.post('/user/gamedata/extra', {
            extra,
            return_user_game_data: 1,       // @todo
        }).then((res) => res.data);
    }

    /**
     * 提交积分
     */
    export function submitScore<T>(score: number): Promise<{
        user_game_data: USER_GAME_DATA_TYPE<T>,
        new_record: boolean,
        new_weekly_record: boolean,
    }> {
        return HttpRequest.post('/user/gamedata/score', { score })
            .then(res => {
                return res.data;
            });
    }
}
