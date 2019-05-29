
namespace matrix {
    export const version: string = '1.0.2';
    /**
     * 初始化
     * @param host 请求主机名
     * @param rsaPublicKey rsa加密公钥
     * @param rsaPublicKeyId rsa加密公钥ID
     * @param gameVersion 游戏版本号
     */
    export function init(host: string, rsaPublicKey: string, rsaPublicKeyId: string, gameVersion: string): void {
        HttpRequest.host = host;
        HttpRequest.publicKey = rsaPublicKey;
        HttpRequest.publicKeyId = rsaPublicKeyId;
        HttpRequest.gameVersion = gameVersion;

        BuriedPoint.lastTimestamp = Date.now();

        const { query } = wx.getLaunchOptionsSync();
        wx.setStorageSync('share_id', query.share_id);
        wx.setStorageSync('share_doc_id', query.share_doc_id);
        wx.setStorageSync('channel_id', query.channel_id);
        wx.setStorageSync('mango_tmpid', query.mango_tmpid);
        wx.setStorageSync('sid', null);
    }
}

window['matrix'] = matrix;
