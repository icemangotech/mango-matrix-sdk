import HttpRequest from './http';
import { UserGameData, UserIpInfo } from './data';
import Environment from './environment';
import { PURCHASE_RESTRICT, IP_INFO } from './variables';

/**
 * 键为支付项目，值为具体的描述
 */
export interface Goods {
    [key: string]:
        | {
              /** 固定价格 */
              type: 'fixed';
              /** 价格，单位为分 */
              price: number;
          }
        | {
              /** 可变价格 */
              type: 'variable';
              /** 价格，单位为分 */
              prices: number[];
              /** 档位 */
              par: string[];
          };
}

export type PreOrderParams = { id: any; price: number; cp_id?: string } & (
    | {
          type: 'web';
          params: {
              /** 跳转地址，若当前环境无法直接拉起公众号支付，该项为需要跳转到的地址 */
              url: string;
              /** 跳转地址的二维码图片地址 */
              url_qr_code: string;
          };
      }
    | {
          type: 'wmp';
          params: {
              timeStamp: string;
              nonceStr: string;
              package: string;
              signType: string;
              paySign: string;
              appId: string;
          };
      });

export interface PurchaseRestrict {
    disabled_cities: string[];
    disabled_provinces: string[];
    pay_type: 'web' | 'wmp';
}

export default class Purchase {
    /**
     * 获取商品列表
     * @param key 与后台事先约定的项目名，为空则返回全部商品
     */
    public static fetchGoodsList = (key: string = '') =>
        HttpRequest.post<{ goods: Goods }>(`/shop/goods/${key}`).then(
            res => res.data
        );

    /**
     * 预下单，该接口会自动调起微信小程序支付，返回支付结果
     * @param key 为与后台事先约定的支付项目，如vip、gold(金币)等
     * @param par 为与后台事先约定的订单参数，若无par则缺省
     * @param cpId 开发者指定的订单号，可以缺省
     * @param channel 支付通道id，该项暂时缺省
     */
    public static onPreOrder = (
        key: string,
        par?: string,
        cpId?: string,
        channel?: any
    ) =>
        HttpRequest.post<PreOrderParams>(`/shop/order/add/${key}/${par}`, {
            channel,
            cp_id: cpId,
        }).then(res => {
            if (res.data.type === 'wmp' && Environment.platform === 'wx') {
                const { params } = res.data;
                return new Promise<PreOrderParams>((resolve, reject) => {
                    wx.requestPayment({
                        ...params,
                        signType: params.signType as any,
                        success: result => {
                            resolve(res.data);
                        },
                        fail: err => {
                            reject(Error(err.errMsg));
                        },
                    });
                });
            } else if (res.data.type === 'web') {
                return res.data;
            } else {
                return Promise.reject(Error('Payment not supported.'));
            }
        });

    /**
     * @param param.id 订单 ID
     * @param param.cp_id cpID
     */
    public static queryOrderStatus = (
        param:
            | {
                  id: any;
                  cp_id?: never;
              }
            | {
                  id?: never;
                  cp_id: string;
              }
    ) =>
        HttpRequest.post<{
            /** 0处理中或失败，1支付成功，2已退款 */
            status: 0 | 1 | 2;
            settled: boolean;
        }>('/shop/order/query', { ...param }).then(res => res.data);

    /**
     * 把某个订单标记为“已处理”
     * @param param.id 订单ID
     * @param param.cp_id cpID
     * @param param.extra 同 Matrix.submitExtra
     * @param param.return_user_game_data 为 0 时返回值不含 `user_game_data` ，减轻服务器压力
     */
    public static settleOrder = <T>(
        param: { extra: T; return_user_game_data: 0 | 1 } & (
            | {
                  id: any;
                  cp_id?: never;
              }
            | {
                  id?: never;
                  cp_id: string;
              })
    ) =>
        HttpRequest.post<{
            /** 为true表示更改标记成功，为false表示该订单已为“已处理”状态 */
            success: boolean;
            user_game_data?: UserGameData<T>;
        }>('/shop/order/settle', {
            ...param,
        }).then(res => res.data);

    /**
     * 获取所有已成功支付，但是“未处理”的订单
     * @param key 与后台事先约定的项目名
     */
    public static fetchUnsettledOrder = (key: string = '') =>
        HttpRequest.post<{
            orders: {
                [key: string]: Array<{
                    id: any;
                    key: string;
                    par: string;
                    price: number;
                    cp_id?: string;
                }>;
            };
        }>(`/shop/order/unsettled/${key}`).then(res => res.data);

    /**
     * 基于定位判断当前内购是否可用
     */
    public static isPurchaseAvailable = () => {
        const restrict: PurchaseRestrict | null = JSON.parse(
            Environment.getStorageItem(PURCHASE_RESTRICT) || 'null'
        );
        const ipInfo: UserIpInfo | null = JSON.parse(
            Environment.getStorageItem(IP_INFO) || 'null'
        );
        if (restrict && ipInfo) {
            return !(
                restrict.disabled_provinces.includes(ipInfo.province) ||
                restrict.disabled_cities.includes(ipInfo.city) ||
                ipInfo.country !== 'China'
            );
        }
        return false;
    };
}
