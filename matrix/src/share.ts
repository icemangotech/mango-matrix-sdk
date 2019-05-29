/// <reference path="http.ts" />

namespace matrix {
    export function getAllShareUsers<T>(): Promise<{
        last_page: boolean;
        invite_count: number;
        invite_count_today: number;
        users: Array<{
            id: number;
            avatar: string;
            config: T;
        }>,
        today_login: null;      // @todo
    }> {
        return HttpRequest.post('/share/users', {})
            .then(res => res.data);
    }

    export function getShareUserInfo<T>(userId: number): Promise<{
        id: number;
        avatar: string;
        config: T;
    }> {
        return HttpRequest.post(`/share/user/${userId}`, {})
            .then((res) => res.data);
    }

    export function updateShareUserInfo<T>(userId: number, config: T): Promise<{
        config: T;
    }> {
        return HttpRequest.post(`/share/user/config/${userId}`, config)
            .then((res) => res.data);
    }

    /**
     * 根据分享文案的键名获取分享文案
     * @param docKey 分享文案的键名
     */
    export function getShareDoc(docKey: string): Promise<{
        button_name: string;
        id: string | null;
        title: string;
        image: string;
        shareQuery: {
            shareId: string;
            shareDocId: string;
        };
    }> {
        return HttpRequest.post(`/share/doc/${docKey}?v=2`, {})
            .then((res) => ({
                ...res.data,
                shareQuery: {
                    shareId: HttpRequest.platformData.openid,
                    shareDocId: res.data.id,
                },
            }));
    }
}
