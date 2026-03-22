import type { PrimitiveQuery, QueryInput } from './types';

function normalizePath(pathname: string): string {
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function appendQuery(searchParams: URLSearchParams, key: string, value: PrimitiveQuery): void {
    if (value === undefined || value === null) {
        return;
    }

    if (value instanceof Date) {
        searchParams.append(key, value.toISOString());
        return;
    }

    searchParams.append(key, String(value));
}

export function buildUrl(apiBaseUrl: string, pathname: string, query?: QueryInput): URL {
    const url = new URL(`${apiBaseUrl}${normalizePath(pathname)}`);

    if (!query) {
        return url;
    }

    for (const [key, rawValue] of Object.entries(query as Record<string, unknown>)) {
        if (Array.isArray(rawValue)) {
            for (const value of rawValue) {
                appendQuery(url.searchParams, key, value as PrimitiveQuery);
            }
            continue;
        }

        appendQuery(url.searchParams, key, rawValue as PrimitiveQuery);
    }

    return url;
}
