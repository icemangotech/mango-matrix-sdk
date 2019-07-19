import HttpRequest from './http';

type BANNER_TYPE = {
    show: number;
    showtime: number;
};

type BANNER_SHOW_TYPE = {
    scene: string;
    time: number;
};

type VIDEO_TYPE = {
    scene: string;
    duration: number;
    end: string;
    time: number;
};

type EVENT_TYPE = {
    key: string;
    time: number;
    par1?: string;
    par2?: string;
    par3?: string;
    par4?: string;
    par5?: string;
    extra?: {
        [k: string]: any;
    };
};

type PAGE_TYPE = {
    time: number;
    duration: number;
    lastEnterTime: number;
    active: boolean;
};

type REQUEST_EVENT = {
    time: number;
    result: boolean;
    scene: string;
};

type INTERSTITIAL_AD_EVENT =
    | {
          type: 'INTENTION';
          time: number;
          scene: string;
          result: boolean;
      }
    | { type: 'SHOW'; time: number; scene: string };

type POST_DATA_TYPE = {
    current_timestamp: number;
    start_timestamp: number;
    page_stay: {
        [k: string]: [number, number];
    };
    ad: {
        banner: BANNER_TYPE;
        banner_event: REQUEST_EVENT[];
        banner_show: BANNER_SHOW_TYPE[];
        video_intention: REQUEST_EVENT[];
        video: Array<{
            scene: string;
            duration: number;
            end: string;
            time: number;
        }>;
        interstitial: INTERSTITIAL_AD_EVENT[];
    };
    event: EVENT_TYPE[];
};

export default class BuriedPoint {
    public static lastTimestamp: number = 0;

    private static pages: { [k: string]: PAGE_TYPE } = {};

    private static banner: BANNER_TYPE = {
        show: 0,
        showtime: 0,
    };
    private static bannerShow: BANNER_SHOW_TYPE[] = [];
    private static bannerEvents: REQUEST_EVENT[] = [];

    private static videos: VIDEO_TYPE[] = [];
    private static videoIntentions: REQUEST_EVENT[] = [];

    private static interstitialAdEvents: INTERSTITIAL_AD_EVENT[] = [];

    private static events: EVENT_TYPE[] = [];

    private static timer: number | null = null;

    private static currentScene: string | null = null;

    public static onGameStart(): Promise<{
        page_stay_object_legal: boolean;
        'ad.banner_object_legal': boolean;
        'ad.video_array_legal': boolean;
        event_array_legal: boolean;
    }> {
        const postData = this.getPostData();
        this.resetData();
        this.lastTimestamp = Date.now();
        if (this.timer) { clearTimeout(this.timer); }
        this.timer = this.onGameTick();
        return HttpRequest.post('/app/heartbeat/start', postData).then(res => {
            return res.data;
        });
    }

    private static onGameTick(): number {
        return window.setTimeout(async () => {
            const postData = this.getPostData();
            this.lastTimestamp = Date.now();
            this.resetData();
            if (this.timer) { clearTimeout(this.timer); }
            this.timer = this.onGameTick();
            try {
                await HttpRequest.post('/app/heartbeat/tick', postData);
            } catch (e) {
                //
            }
        }, 60000);
    }

    // TODO: SID missing
    public static onGameAwake(): Promise<{
        page_stay_object_legal: boolean;
        'ad.banner_object_legal': boolean;
        'ad.video_array_legal': boolean;
        event_array_legal: boolean;
    }> {
        this.lastTimestamp = Date.now();
        const postData = this.getPostData();
        this.resetData();
        if (this.timer) { clearTimeout(this.timer); }
        this.timer = this.onGameTick();
        this.lastTimestamp = Date.now();
        if (this.currentScene) {
            this.onEnterScene(this.currentScene);
        }
        return HttpRequest.post('/app/heartbeat/awake', postData).then(res => {
            return res.data;
        });
    }

    public static onGameSleep(): Promise<{
        page_stay_object_legal: boolean;
        'ad.banner_object_legal': boolean;
        'ad.video_array_legal': boolean;
        event_array_legal: boolean;
    }> {
        const postData = this.getPostData();
        this.resetData();
        this.lastTimestamp = Date.now();
        if (this.timer) { clearTimeout(this.timer); }
        return HttpRequest.post('/app/heartbeat/sleep', postData).then(res => {
            return res.data;
        });
    }

    private static resetData(): void {
        this.pages = {};
        this.banner = {
            show: 0,
            showtime: 0,
        };
        this.videos = [];
        this.events = [];
        this.bannerEvents = [];
        this.bannerShow = [];
        this.videoIntentions = [];
        this.interstitialAdEvents = [];
    }

    private static getPostData(): POST_DATA_TYPE {
        const current = Date.now();
        const start = this.lastTimestamp;
        const pages = {};
        for (const key in this.pages) {
            if (this.pages[key].active) {
                pages[key] = [
                    this.pages[key].time,
                    this.pages[key].duration +
                        current -
                        this.pages[key].lastEnterTime,
                ];
            } else {
                pages[key] = [
                    this.pages[key].time,
                    this.pages[key].duration,
                ];
            }
        }
        return {
            current_timestamp: current,
            start_timestamp: start,
            page_stay: pages,
            ad: {
                banner: { ...this.banner },
                video: [...this.videos],
                video_intention: [...this.videoIntentions],
                banner_event: [...this.bannerEvents],
                banner_show: [...this.bannerShow],
                interstitial: [...this.interstitialAdEvents],
            },
            event: [...this.events],
        };
    }

    public static onEnterScene(sceneName: string): void {
        if (!sceneName) {
            return;
        }
        this.onLeaveScene(this.currentScene);
        this.currentScene = sceneName;
        if (sceneName in this.pages) {
            this.pages[sceneName].lastEnterTime = Date.now();
            this.pages[sceneName].time += 1;
            this.pages[sceneName].active = true;
        } else {
            this.pages[sceneName] = {
                time: 1,
                duration: 0,
                lastEnterTime: Date.now(),
                active: true,
            };
        }
    }

    public static onLeaveScene(sceneName: string): void {
        if (sceneName in this.pages && this.pages[sceneName].active === true) {
            this.pages[sceneName].active = false;
            this.pages[sceneName].duration +=
                Date.now() - this.pages[sceneName].lastEnterTime;
        }
    }

    public static onAdBannerRequest(sceneName: string, result: boolean) {
        this.bannerEvents.push({ scene: sceneName, result, time: Date.now() });
    }

    public static onAdBannerShow(sceneName: string): void {
        this.banner.show += 1;
        this.bannerShow.push({
            scene: sceneName,
            time: Date.now(),
        });
    }

    // public static onAdBannerClose(): void {
    // }

    public static onAdVideoRequest(sceneName: string, result: boolean) {
        this.videoIntentions.push({
            scene: sceneName,
            result,
            time: Date.now(),
        });
    }

    // public static onAdVideoShow(scene: string, duration: number): void {
    // }

    public static onAdVideoClose(scene: string, isEnd: boolean): void {
        this.videos.push({
            scene,
            duration: 15000,
            end: isEnd ? 'FINISH' : 'CLOSE',
            time: Date.now(),
        });
    }

    // public static onAdVideoError(): void {
    // }

    /**
     * 插屏广告请求统计
     *
     * @param {string} sceneName 场景名，默认传 "DEFAULT"
     * @param {boolean} result 请求结果
     */
    public static onAdInterstitialAdRequest(
        sceneName: string,
        result: boolean
    ) {
        this.interstitialAdEvents.push({
            type: 'INTENTION',
            scene: sceneName,
            time: Date.now(),
            result,
        });
    }

    /**
     * 插屏广告播放统计
     *
     * @param {string} sceneName  场景名，默认传 "DEFAULT"
     */
    public static onAdInterstitialShow(sceneName: string) {
        this.interstitialAdEvents.push({
            type: 'SHOW',
            scene: sceneName,
            time: Date.now(),
        });
    }

    public static onEventTrigger(
        eventName: string,
        par1?: string,
        par2?: string,
        par3?: string,
        par4?: string,
        par5?: string,
        extra?: any
    ): void {
        const event: EVENT_TYPE = {
            key: eventName,
            par1,
            par2,
            par3,
            par4,
            par5,
            extra,
            time: Date.now(),
        };
        for (const key of Object.keys(event)) {
            if (event[key] === undefined || event[key] === '') {
                delete event[key];
            }
        }
        this.events.push(event);
    }

    public static onNavigateBoxItemClick(id: string) {
        return HttpRequest.post('/app/navigate/report/click', {
            id,
        });
    }

    public static onNavigateBoxItemConfirm(id: string) {
        return HttpRequest.post('/app/navigate/report/confirm', {
            id,
        });
    }
}
