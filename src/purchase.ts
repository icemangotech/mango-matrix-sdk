import HttpRequest from './http';
import { USER_GAME_DATA_TYPE } from './data';
import Environment from './environment';

export interface Goods {
    [itemName: string]:
        | { type: 'fixed'; price: number }
        | { type: 'variable'; prices: number[]; par: string[] };
}

export type PrePayParams = { id: any; price: number } & (
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
      }
    | {
          type: 'badam';
          params: {
              goods_name: string;
              user_data: string;
              ts: string;
              sign: string;
          };
      });

export default class Purchase {
    public static fetchGoodsList = (key: string = '') =>
        HttpRequest.post<{ goods: Goods }>(`/shop/goods/${key}`).then(
            res => res.data
        );

    public static onPreorder = (key: string, par?: string, channel?: any) =>
        HttpRequest.post<PrePayParams>(`/shop/order/add/${key}/${par}`, {
            channel,
        }).then(res => {
            if (res.data.type === 'wmp' && Environment.platform === 'wx') {
                const { params } = res.data;
                return new Promise<wx.GeneralCallbackResult>(
                    (resolve, reject) => {
                        wx.requestPayment({
                            ...params,
                            signType: params.signType as any,
                            success: result => {
                                resolve(result);
                            },
                            fail: err => {
                                reject(Error(err.errMsg));
                            },
                        });
                    }
                );
            } else {
                // TODO: handle 'badam' type
                return Promise.reject(Error('Payment not supported.'));
            }
        });

    public static queryOrderStatus = (id: any) =>
        HttpRequest.post<{
            status: 0 | 1 | 2;
            settled: boolean;
        }>('/shop/order/query', { id }).then(res => res.data);

    public static settleOrder = <T>(
        id: any,
        extra: T,
        returnUserGameData: number
    ) =>
        HttpRequest.post<{
            success: boolean;
            user_game_data: USER_GAME_DATA_TYPE<T>;
        }>('/shop/order/settle', {
            id,
            extra,
            return_user_game_data: returnUserGameData,
        }).then(res => res.data);

    public static fetchUnsettledOrder = (key: string = '') =>
        HttpRequest.post<{
            orders: {
                [key: string]: Array<{
                    id: any;
                    key: string;
                    par: string;
                    price: number;
                }>;
            };
        }>(`/shop/order/unsettled/${key}`).then(res => res.data);
}
