/// <reference path="http.ts" />

namespace matrix {

    enum BURRY_POINT_TYPE {
        HOME,
        PLANT,
        PET,
        EXPLORE,
        ELIMATION,
    }
    
    enum BURRY_POINT_REPORT_TYPE {
        TICK,
        START,
        END,
        AWAKE,
        SLEEP,
    }
    
    class BuriedPoint {
    
        public static enable: boolean = true;	// 总开关
    
        private static _page_dic: Object; 		// key 为埋点枚举, value[0]为进入次数， value[1]为停留时长
    
        private static _all_burry_type: BURRY_POINT_TYPE[] = [
            BURRY_POINT_TYPE.HOME,
            BURRY_POINT_TYPE.PLANT,
            BURRY_POINT_TYPE.PET,
            BURRY_POINT_TYPE.EXPLORE,
            BURRY_POINT_TYPE.ELIMATION,
        ]
    
        private static getBurryName(type: BURRY_POINT_TYPE): string {
            if (type === BURRY_POINT_TYPE.HOME) return "HOME";
            if (type === BURRY_POINT_TYPE.PLANT) return "PLANT";
            if (type === BURRY_POINT_TYPE.PET) return "PET";
            if (type === BURRY_POINT_TYPE.EXPLORE) return "EXPLORE";
            if (type === BURRY_POINT_TYPE.ELIMATION) return "ELIMATION";
            if (DEBUG) debugger;
        }
    
        public static initPageDic() {
            if (BuriedPoint._page_dic) return;
            let dic = BuriedPoint._page_dic = {};
            let arr = BuriedPoint._all_burry_type;
            for (let i = 0, iLen = arr.length; i < iLen; i++) {
                let type = arr[i];
                dic[type] = [0, 0];
            }
        }
    
        private static _cur_burry_point: BURRY_POINT_TYPE;
    
        private static clearPageDic() {
            if (!BuriedPoint._page_dic) return;
    
            let dic = BuriedPoint._page_dic;
            let arr = BuriedPoint._all_burry_type;
            for (let i = 0, iLen = arr.length; i < iLen; i++) {
                let type = arr[i];
                dic[type][0] = dic[type][1] = 0;
            }
        }
    
        private static getPostData(): Object {
            let rst: any = {};
            rst.current_timestamp = Date.now();
            rst.start_timestamp = BuriedPoint._last_report_stamp || egret.sys.$START_TIME;
            let dic = BuriedPoint._page_dic;
            let arr = BuriedPoint._all_burry_type;
            let page_data = {};
            for (let i = 0, iLen = arr.length; i < iLen; i++) {
                let type = arr[i];
                let data = dic[type];
                let name = BuriedPoint.getBurryName(type);
                if (dic[type][1] !== 0) {
                    page_data[name] = data.concat();
                }
            }
            rst.page_stay = page_data;
    
            return rst;
        }
    
        private static _report_async_arr: BURRY_POINT_REPORT_TYPE[] = [
            BURRY_POINT_REPORT_TYPE.TICK,
            BURRY_POINT_REPORT_TYPE.START,
            BURRY_POINT_REPORT_TYPE.AWAKE,
        ]
    
        private static _last_report_stamp: number;
    
        private static getReportName(type: BURRY_POINT_REPORT_TYPE): string {
            if (type === BURRY_POINT_REPORT_TYPE.TICK) return "tick";
            if (type === BURRY_POINT_REPORT_TYPE.START) return "start";
            if (type === BURRY_POINT_REPORT_TYPE.END) return "end";
            if (type === BURRY_POINT_REPORT_TYPE.AWAKE) return "awake";
            if (type === BURRY_POINT_REPORT_TYPE.SLEEP) return "sleep";
            if (DEBUG) debugger;
        }
    
        public static async reportAsync(type: BURRY_POINT_REPORT_TYPE) {
            if (!BuriedPoint._page_dic) return;
            if (!BuriedPoint.enable) return;
    
            let report_name: string = BuriedPoint.getReportName(type);
            if (BuriedPoint._report_async_arr.indexOf(type) < 0) {
                console.warn(`埋点数据 ${name} 不需要异步执行`);
                return;
            }
            if (!HttpRequest.sid) {
                console.error("只有授权之后才能使用埋点接口");
                return;
            }
            return new Promise(async (res, rej) => {
                let data = BuriedPoint.getPostData();
                try {
                    let res_data: { orders: Object, page_stay_object_legal: boolean, "server_time": number } = await HttpRequest.post(`/app/heartbeat/${report_name}`, data);
                    if (!res_data.page_stay_object_legal) console.warn("埋点数据不合理，请检查");
                    BuriedPoint.clearPageDic();
                    BuriedPoint._last_report_stamp = Date.now();
                    res(res_data);
                } catch (e) {
                    // todo 不应该阻塞代码的执行，这里考虑删除
                    WxPlatform.showToast("服务器开小差了");
                    console.error(e);
                }
            });
        }
    
        public static reportSync(type: BURRY_POINT_REPORT_TYPE) {
            if (!BuriedPoint._page_dic) return;
            if (!BuriedPoint.enable) return;
    
            let report_name: string = BuriedPoint.getReportName(type);
            if (BuriedPoint._report_async_arr.indexOf(type) >= 0) {
                console.warn(`埋点数据 ${name} 需要异步执行`);
                return;
            }
            if (!HttpRequest.sid) {
                console.error("只有授权之后才能使用埋点接口");
                return;
            }
    
            let data = BuriedPoint.getPostData();
            HttpRequest.post(`/app/heartbeat/${report_name}`, data);
            BuriedPoint._last_report_stamp = Date.now();
            BuriedPoint.clearPageDic();
        }
    
        private static _last_point_start_stamp: number;
    
        public static changePoint(type: BURRY_POINT_TYPE) {
            BuriedPoint.initPageDic();
            let hasLastPoint = BuriedPoint._cur_burry_point != undefined;
            if (BuriedPoint._last_point_start_stamp && hasLastPoint) {
                let elapse = Date.now() - BuriedPoint._last_point_start_stamp;
                BuriedPoint._page_dic[BuriedPoint._cur_burry_point][1] += elapse;
            }
            BuriedPoint._last_point_start_stamp = Date.now();
            BuriedPoint._cur_burry_point = type;
            hasLastPoint && BuriedPoint._page_dic[type][0]++;
        }
    
        private static _heart_timer: number;
        public static registerHeartTick() {
            BuriedPoint.initPageDic();
            BuriedPoint.unRegisterHeartTick();
            BuriedPoint._heart_timer = egret.setTimeout(BuriedPoint.onHeartTick, BuriedPoint, 60 * 1000);
        }
    
        public static unRegisterHeartTick() {
            if (BuriedPoint._heart_timer != undefined) {
                egret.clearTimeout(BuriedPoint._heart_timer);
            }
        }
    
        private static async onHeartTick() {
            try {
                await BuriedPoint.reportAsync(BURRY_POINT_REPORT_TYPE.TICK);
            } catch (e) {
                console.error(e);
            }
        }
    
    }
}