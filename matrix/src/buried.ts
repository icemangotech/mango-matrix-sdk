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
        part1: string | null;
        part2: string | null;
        extra: any;
    }>;

    export type PAGE_TYPE = {
        time: number;
        duration: number;
        lastEnterTime: number;
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
        event: Array<{
            key: string;
            time: number;
            part1: string | null;
            part2: string | null;
            extra: any;
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

        private static timer: number | null = null;

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
            };
        }

        public static onEnterScene(sceneName: string): void {
            if (sceneName in this.pages) {
                this.pages[sceneName].lastEnterTime = Date.now();
                this.pages[sceneName].time += 1;
            } else {
                this.pages[sceneName] = {
                    time: 1,
                    duration: 0,
                    lastEnterTime: Date.now(),
                };
            }
        }

        public static onLeaveScene(sceneName: string): void {
            if (sceneName in this.pages) {
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

        public static onEventTrigger(evnetName: string, part1: string | null = null, part2: string | null = null, extra: any = {}): void {
            this.events.push({
                key: evnetName,
                part1,
                part2,
                extra,
                time: Date.now(),
            });
        }
    }
}
