/// <reference path="http.ts" />

namespace matrix {
    /**
     * 获取周排行榜
     */
    export function getWoldWeekRank(): Promise<{
        my_ranking: string;
        my_score: string;
        list: Array<{
            id: number;
            name: string;
            score: string;
            avatar: string;
        }>
    }> {
        return HttpRequest.post('/rank/listing/week', {})
            .then((res) => res.data);
    }

    /**
     * 获取总排行榜
     */
    export function getWoldAllRank(): Promise<{
        my_ranking: string;
        my_score: string;
        list: Array<{
            id: number;
            name: string;
            score: string;
            avatar: string;
        }>
    }> {
        return HttpRequest.post('/rank/listing/all', {})
            .then((res) => res.data);
    }
}
