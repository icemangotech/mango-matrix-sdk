import { NavigateBoxItemResponse, NavigateBoxItem } from './data';
import { queryStringify } from './querystringify';

export const navigateBoxItemStringify = (
    res: NavigateBoxItemResponse[]
): NavigateBoxItem[] =>
    res.map(item => ({
        ...item,
        id: String(item.id),
        query: queryStringify(item.query),
    }));
