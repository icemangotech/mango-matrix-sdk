/// <reference path="http.ts" />

namespace matrix {
    export type BANNER_TYPE = {
        click: number;
        showtime: number;
    };

    export type VIDEO_TYPE = Array<{
        scene: string;
        duration: number;
        end: string;
        time: number;
    }>;

    export type EVENT_TYPE = Array<{
        key: string;
        time: number;
        par1: any;
        par2: any;
        par3: any;
        par4: any;
        par5: any;
        extra: {
            [k: string]: any;
        };
    }>;

    export type PAGE_TYPE = {
        time: number;
        duration: number;
        lastEnterTime: number;
        active: boolean;
    };

    export type POST_DATA_TYPE = {
        current_timestamp: number;
        start_timestamp: number;
        page_stay: {
            [k: string]: [number, number],
        };
        ad: {
            banner: {
                click: 0,
                showtime: 0,
            };
            video: Array<{
                scene: string;
                duration: number;
                end: string;
                time: number;
            }>;
        };
        event: EVENT_TYPE;
        navigate: Array<{
            id: number;
            type: 'click' | 'confirm';
            time: number;
        }>;
    };

    export class BuriedPoint {
        public static lastTimestamp: number = 0;

        public static pages: { [k: string]: PAGE_TYPE } = {};

        public static banner: BANNER_TYPE = {
            click: 0,
            showtime: 0,
        };

        public static videos: VIDEO_TYPE = [];

        public static events: EVENT_TYPE = [];

        public static navigate: Array<{
            id: number;
            type: 'click' | 'confirm';
            time: number;
        }> = [];

        private static timer: number | null = null;

        private static currentScene: string | null = null;

        public static onGameStart(): Promise<{
            'page_stay_object_legal': boolean;
            'ad.banner_object_legal': boolean;
            'ad.video_array_legal': boolean;
            'event_array_legal': boolean;
        }> {
            this.lastTimestamp = Date.now();
            const postData = this.getPostData();
            this.timer = this.onGameTick();
            return HttpRequest.post('/app/heartbeat/start', postData)
                .then((res) => {
                    this.resetData();
                    this.lastTimestamp = Date.now();
                    return res.data;
                });
        }

        private static onGameTick(): number {
            return setTimeout(async () => {
                const postData = this.getPostData();
                try {
                    await HttpRequest.post('/app/heartbeat/tick', postData);
                    this.lastTimestamp = Date.now();
                    this.resetData();
                    this.timer && clearTimeout(this.timer);
                    this.timer = this.onGameTick();
                } catch(e) {
                    //
                }
            }, 60000);
        }

        public static onGameAwake(): Promise<{
            'page_stay_object_legal': boolean;
            'ad.banner_object_legal': boolean;
            'ad.video_array_legal': boolean;
            'event_array_legal': boolean;
        }> {
            this.lastTimestamp = Date.now();
            const postData = this.getPostData();
            this.timer && clearTimeout(this.timer);
            this.timer = this.onGameTick();
            return HttpRequest.post('/app/heartbeat/awake', postData)
                .then((res) => {
                    this.resetData();
                    this.lastTimestamp = Date.now();
                    return res.data;
                })
        }

        public static onGameSleep(): Promise<{
            'page_stay_object_legal': boolean;
            'ad.banner_object_legal': boolean;
            'ad.video_array_legal': boolean;
            'event_array_legal': boolean;
        }> {
            const postData = this.getPostData();
            this.timer && clearTimeout(this.timer);
            return HttpRequest.post('/app/heartbeat/sleep', postData)
                .then((res) => {
                    this.resetData();
                    this.lastTimestamp = Date.now();
                    return res.data;
                })
        }

        private static resetData(): void {
            this.pages = {};
            this.banner  = {
                click: 0,
                showtime: 0,
            };
            this.videos = [];
            this.events = [];
            this.navigate = [];
            if (this.currentScene) {
                this.onEnterScene(this.currentScene);
            }
        }

        private static getPostData(): POST_DATA_TYPE {
            const current_timestamp = Date.now();
            const start_timestamp = this.lastTimestamp;
            const page_stay = {};
            for (let key in this.pages) {
                page_stay[key] = [this.pages[key].time, this.pages[key].duration + Date.now() - this.pages[key].lastEnterTime];
            }
            return {
                current_timestamp,
                start_timestamp,
                page_stay,
                ad: {
                    banner: {
                        click: 0,
                        showtime: 0,
                    },
                    video: [...this.videos],
                },
                event: [...this.events],
                navigate: [...this.navigate],
            };
        }

        public static onEnterScene(sceneName: string): void {
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
                this.pages[sceneName].duration += Date.now() - this.pages[sceneName].lastEnterTime;
            }
        }

        // public static onAdBannerShow(): void {
        // }

        // public static onAdBannerClose(): void {
        // }

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

        public static onEventTrigger(evnetName: string, par1: any = null, par2: any = null,
                                    par3: any = null, par4: any = null, par5: any = null, 
                                    extra: any = {}): void {
            this.events.push({
                key: evnetName,
                par1,
                par2,
                par3,
                par4,
                par5,
                extra,
                time: Date.now(),
            });
        }

        public static onNavigateBoxItemClick(id: number) {
            this.navigate.push({
                id,
                type: 'click',
                time: Date.now(),
            });
        }

        public static onNavigateBoxItemConfirm(id: number) {
            this.navigate.push({
                id,
                type: 'confirm',
                time: Date.now(),
            });
        }
    }
}
