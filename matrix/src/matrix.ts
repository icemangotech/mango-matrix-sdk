
namespace matrix {
    export const version: string = '1.0.0';
    /**
     * 初始化
     * @param host 请求主机名
     * @param rsaPublicKey rsa加密公钥
     * @param gameVersion 游戏版本号
     */
    export function init(host: string, rsaPublicKey: string, gameVersion: string): void {
        HttpRequest.host = host;
        HttpRequest.publicKey = rsaPublicKey;
        HttpRequest.gameVersion = gameVersion;

        wx.setStorageSync('share_id', egret.getOption('share_id'));
        wx.setStorageSync('share_doc_id', egret.getOption('share_doc_id'));
        wx.setStorageSync('channel_id', egret.getOption('channel_id'));
        wx.setStorageSync('mango_tmpid', egret.getOption('mango_tmpid'));
        wx.setStorageSync('sid', null);
    }
}

window['matrix'] = matrix;
