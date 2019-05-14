## mongo-matrix接入文档

### 1. 安装

#### Egret

#### Layabox

#### Cocos Creator


### 2. 初始化

* 申请请求主机名 `host` 和RSA加密公钥 `rsa_public_key`；

* 在项目代码中添加初始化代码：
    ``` ts
    matrix.init(host, rsa_public_key);
    ```
    确保 `matrix.init` 在其它方法前被调用。

### 3. 用户相关

* 数据类型定义：

    用户：
    ``` ts
    type USER_DATA_TYPE = {
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
    ```

    用户分享数据：
    ``` ts
    type USER_GAME_DATA_SHARE_TYPE = {
        time_count: number,                 // 成功分享次数
        time_count_today: number,           // 今日成功分享次数
        invite_count: number,               // 已邀请好友数
        invite_count_today: number,         // 今日已邀请好友数
    }
    ```

    用户排行榜数据：
    ``` ts
    type USER_GAME_DATA_RANK_TYPE = {
        week_ranking: string,               // "1（该项为字符串，可能存在非数字字符）"
        week_score: string,                 // 本周最高分
        ranking: string,                    // 总排名 (如："未上榜")
        max_score: string,                  // 历史最高分
        week_friends_ranking: string,       // 本周好友榜排名，若游戏未开启好友榜功能则为null
        friends_ranking: string,            // 好友榜总排名，若游戏未开启好友榜功能则为null
    }
    ```

    用户游戏数据：
    ``` ts
    type USER_GAME_DATA_TYPE<T> = {
        id: number,                         // 与user_data中的id相同
        share: USER_GAME_DATA_SHARE_TYPE,
        rank: USER_GAME_DATA_RANK_TYPE,
        extra: T,
    }
    ```
    其中 `extra` 为开发者自定义的游戏数据，用来存储开发者定义的用户在游戏中的数据。

    跳转小游戏数据：
    ``` ts
    type NAVIGATE_BOX_ITEM_TYPE = {
        id: number;
        pic: string;
        icon: string;
        name: string;
        appId: string;
        query: {
            [k: string]: any;
        };
        path: string;
        extraData: any;
        envVersion: string;
    };
    ```

* 用户登录 matrix.login:

    ``` ts
    function login<T, G>(): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: G;
        navigate: NAVIGATE_BOX_ITEM_TYPE;
        navigate_list: Array<NAVIGATE_BOX_ITEM_TYPE>;
        platform_data: WMP_PLATFORM_DATA;
    }>
    ```

* 用户授权 matrix.onAuth:

    ``` ts
    function onAuth<T, G>(info: WMP_INFO): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: G;
        navigate: NAVIGATE_BOX_ITEM_TYPE;
        navigate_list: Array<NAVIGATE_BOX_ITEM_TYPE>;
        platform_data: WMP_PLATFORM_DATA;
    }>;
    ```

* 获取UserInfo matrix.getUserInfo:

    ``` ts
    function getUserInfo<T, G>(): Promise<{
        server_time: number;
        sid: string;
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
        game_config: G;
        platform_data: WMP_PLATFORM_DATA;
    }>;
    ```

* 获取用户数据 matrix.getUserData:

    ``` ts
    function getUserData<T>(): Promise<{
        user_data: USER_DATA_TYPE;
        user_game_data: USER_GAME_DATA_TYPE<T>;
    }>;
    ```

* 获取游戏配置 matrix.getGameConfig:

    ``` ts
    function getGameConfig<G>(): Promise<{
        game_config: G;
    }>;
    ```

* 提交分数 extra.submitScore:

    ``` ts
    function submitScore<T>(score: number): Promise<{
        user_game_data: USER_GAME_DATA_TYPE<T>;
        new_record: boolean;
        new_weekly_record: boolean;
    }>;
    ```

* 提交extra extra.submitExtra:

    ``` ts
    function submitExtra<T>(extra: T, returnUserGameData: number, score?: number | null): Promise<{
        user_game_data: USER_GAME_DATA_TYPE<T>;
        new_record: boolean;
        new_weekly_record: boolean;
    }>;
    ```

* 获取世界排行周榜 matrix.getWoldWeekRank:

    ``` ts
    function getWoldWeekRank(): Promise<{
        my_ranking: string;
        my_score: string;
        list: Array<{
            id: number;
            name: string;
            score: string;
            avatar: string;
        }>;
    }>;
    ```

* 获取世界排行周榜 matrix.getWoldAllRank:

    ``` ts
    function getWoldAllRank(): Promise<{
        my_ranking: string;
        my_score: string;
        list: Array<{
            id: number;
            name: string;
            score: string;
            avatar: string;
        }>;
    }>;
    ```

* 获取所有邀请的用户 matrix.updateShareUserInfo:
    ``` ts
    function getAllShareUsers<T>(): Promise<{
        last_page: boolean;
        invite_count: number;
        invite_count_today: number;
        users: Array<{
            id: number;
            avatar: string;
            config: T;
        }>;
        today_login: null;
    }>;
    ```

* 获取某个邀请用户的信息 matrix.updateShareUserInfo:
    ``` ts
    function getShareUserInfo<T>(userId: number): Promise<{
        id: number;
        avatar: string;
        config: T;
    }>;
    ```

* 更新某个邀请用户的config matrix.updateShareUserInfo:
    ``` ts
    function updateShareUserInfo<T>(userId: number, config: T): Promise<{
        config: T;
    }>;
    ```

### 4. 分享相关

* 获取指定键名对应的文案 matrix.getShareDoc:

    ``` ts
    function getShareDoc(docKey: any): Promise<{
        button_name: string;
        id: string | null;
        title: string;
        image: string;
    }>;
    ```

### 5. 数据统计

* 游戏启动 matrix.BuriedPoint.onGameStart：

    ``` ts
    onGameStart(): Promise<{
        'page_stay_object_legal': boolean;
        'ad.banner_object_legal': boolean;
        'ad.video_array_legal': boolean;
        'event_array_legal': boolean;
    }>
    ```

* 游戏被唤醒 matrix.BuriedPoint.onGameAwake：

    ``` ts
    onGameAwaka(): Promise<{
        'page_stay_object_legal': boolean;
        'ad.banner_object_legal': boolean;
        'ad.video_array_legal': boolean;
        'event_array_legal': boolean;
    }>
    ```

* 游戏进入后台 matrix.BuriedPoint.onGameSleep：

    ``` ts
    onGameSleep(): Promise<{
        'page_stay_object_legal': boolean;
        'ad.banner_object_legal': boolean;
        'ad.video_array_legal': boolean;
        'event_array_legal': boolean;
    }>
    ```

* 进入某个场景 matrix.BuriedPoint.onEnterScene：

    ``` ts
    onEnterScene(sceneName: string): void;
    ```

* 离开某个场景 matrix.BuriedPoint.onLeaveScene

    ``` ts
    onLeaveScene(sceneName: string): void;
    ```

* 视频广告被关闭 matrix.BuriedPoint.onAdVideoClose：

    ``` ts
    onAdVideoClose(scene: string, isEnd: boolean): void;
    ```

* 某个自定义的事件触发 matrix.BuriedPoint.onEventTrigger：

    ``` ts
    onEventTrigger(evnetName: string, part1?: string | null, part2?: string | null, extra?: any): void;
    ```

* 游戏盒子某个游戏被点击 matrix.BuriedPoint.onNavigateBoxItemClick:

    ``` ts
    onNavigateBoxItemClick(id: number);
    ```

* 游戏盒子确认跳转某个消息 matrix.BuriedPoint.onNavigateBoxItemConfirm:

    ``` ts
    onNavigateBoxItemConfirm(id: number);
    ```


### **Example:**

#### 用户登录与授权

进入小游戏时，确保 `matrix.init` 方法在其他方法之前被执行。之后调用 `matrix.login`进行用户登录并获取用户信息和用户的游戏数据，如果用户未进行过授权，则返回的数据 `user_data` 字段中的用户信息为null。

如果小游戏中需要使用到用户昵称、头像等用户信息，首先需要授权。利用微信小游戏API`wx.authorize`可以知道用户是否授权过小游戏获取用户信息。如果用户为授权，需要利用微信小游戏API`wx.createUserInfoButton`新建`UserInfoButton`。注意新建的时候`withCredentials`应该为`true`。在`UserInfoButton`的`onTap`事件中，我们可以通过返回值获取`iv`、`encryptedData`，此时应该在`onTap`事件中调用`matrix.onAuth({iv, encryptedData})`。如果用户已经授权过，可以直接调用`wx.getUserInfo`来获取最新的用户信息。

#### 用户游戏数据

用户进行游戏后，可以通过`matrix.submitScore`提交分数，通过`matrix.submitExtra`提交新的`extra`数据。
