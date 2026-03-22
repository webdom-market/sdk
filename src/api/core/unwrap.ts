import type { BaseEnvelope, PaginatedEnvelope } from '../../generated/agent-api';
import type { DataResult, PaginatedResult } from './types';

export function unwrapData<T>(payload: BaseEnvelope<T>): DataResult<T> {
    return {
        data: payload.data,
        meta: {
            requestId: payload.meta.request_id,
            apiVersion: payload.meta.api_version
        }
    };
}

export function unwrapPaginated<T>(payload: PaginatedEnvelope<T>): PaginatedResult<T> {
    return {
        items: payload.data.items,
        pageInfo: {
            nextCursor: payload.page_info.next_cursor,
            hasMore: payload.page_info.has_more
        },
        meta: {
            requestId: payload.meta.request_id,
            apiVersion: payload.meta.api_version
        }
    };
}
