import { NavigateBoxItemResponse, NavigateBoxItem } from './data';

export const navigateBoxItemStringify = (
    res: NavigateBoxItemResponse[]
): NavigateBoxItem[] =>
    res.map(item => ({
        ...item,
        id: String(item.id),
        query: Object.keys(item.query)
            .map(k => `${k}=${item.query[k]}`)
            .join('&'),
    }));
