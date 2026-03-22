import type { Meta } from '../../generated/agent-api';

export type PrimitiveQuery = string | number | boolean | Date | null | undefined;
export type QueryInput = object;

export type ResultMeta = {
    requestId: Meta['request_id'];
    apiVersion: Meta['api_version'];
};

export type DataResult<T> = {
    data: T;
    meta: ResultMeta;
};

export type PaginatedResult<T> = {
    items: T[];
    pageInfo: {
        nextCursor: string | null;
        hasMore: boolean;
    };
    meta: ResultMeta;
};
