import type { WebdomSdkContext } from '../../config';
import type { BaseEnvelope, ErrorEnvelope, PaginatedEnvelope } from '../../generated/agent-api';
import { WebdomApiError } from '../errors';
import { buildUrl } from './url';
import type { QueryInput } from './types';

export type Transport = ReturnType<typeof createTransport>;
export type TransportAuthMode = 'required' | 'optional';
type SuccessEnvelope = BaseEnvelope<unknown> | PaginatedEnvelope<unknown>;

async function parseJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function extractErrorPayload(payload: unknown): ErrorEnvelope | null {
    if (!payload || typeof payload !== 'object' || !('error' in payload)) {
        return null;
    }

    return payload as ErrorEnvelope;
}

export function createTransport(context: WebdomSdkContext) {
    async function request<T>(args: {
        method: 'GET' | 'POST' | 'DELETE';
        path: string;
        query?: QueryInput;
        body?: unknown;
        auth?: TransportAuthMode;
    }): Promise<T> {
        const url = buildUrl(context.apiBaseUrl, args.path, args.query);
        const headers = new Headers({
            Accept: 'application/json'
        });
        const timeoutMs = context.requestTimeoutMs;
        const parentSignal = context.requestSignal;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let removeAbortListener: (() => void) | undefined;
        let signal: AbortSignal | undefined;
        let timedOut = false;

        if (args.body !== undefined) {
            headers.set('Content-Type', 'application/json');
        }

        if (args.auth) {
            const token = await context.tokenStorage.getToken();
            const normalizedToken = typeof token === 'string' ? token.trim() : '';

            if (normalizedToken.length === 0 && args.auth === 'required') {
                throw new WebdomApiError({
                    message: 'This endpoint requires an auth token, but no token is configured.',
                    status: 401,
                    code: 'AUTH_TOKEN_MISSING',
                    retryable: false
                });
            }

            if (normalizedToken.length > 0) {
                headers.set('Authorization', `Bearer ${normalizedToken}`);
            }
        }

        if (parentSignal || timeoutMs !== undefined) {
            const controller = new AbortController();
            signal = controller.signal;

            if (parentSignal) {
                if (parentSignal.aborted) {
                    controller.abort(parentSignal.reason);
                } else {
                    const onAbort = () => controller.abort(parentSignal.reason);
                    parentSignal.addEventListener('abort', onAbort, { once: true });
                    removeAbortListener = () => parentSignal.removeEventListener('abort', onAbort);
                }
            }

            if (timeoutMs !== undefined) {
                if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
                    throw new Error('requestTimeoutMs must be a non-negative finite number');
                }

                timeoutId = setTimeout(() => {
                    timedOut = true;
                    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            }
        }

        let response: Response;
        try {
            response = await context.fetch(url, {
                method: args.method,
                headers,
                body: args.body === undefined ? undefined : JSON.stringify(args.body),
                signal
            });
        } catch (error: unknown) {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
            removeAbortListener?.();

            if (timedOut) {
                throw new WebdomApiError({
                    message: `Request timed out after ${timeoutMs}ms`,
                    status: 408,
                    code: 'REQUEST_TIMEOUT',
                    retryable: true,
                    cause: error
                });
            }

            if (signal?.aborted) {
                throw new WebdomApiError({
                    message: 'Request was aborted before completion.',
                    status: 0,
                    code: 'REQUEST_ABORTED',
                    retryable: true,
                    cause: error
                });
            }

            throw new WebdomApiError({
                message: error instanceof Error ? error.message : 'Network request failed',
                status: 0,
                code: 'NETWORK_ERROR',
                retryable: true,
                cause: error
            });
        }

        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        removeAbortListener?.();

        const payload = await parseJson(response);
        if (!response.ok) {
            const errorPayload = extractErrorPayload(payload);
            throw new WebdomApiError({
                message: errorPayload?.error.message || response.statusText || 'Request failed',
                status: response.status,
                code: errorPayload?.error.code || 'HTTP_ERROR',
                details: errorPayload?.error.details,
                retryable: errorPayload?.error.retryable,
                meta: errorPayload?.meta,
                response: payload,
                cause: errorPayload ? undefined : payload
            });
        }

        return payload as T;
    }

    return {
        get<T extends SuccessEnvelope>(path: string, query?: QueryInput, auth?: TransportAuthMode) {
            return request<T>({ method: 'GET', path, query, auth });
        },
        post<T extends SuccessEnvelope>(path: string, body?: unknown, auth?: TransportAuthMode) {
            return request<T>({ method: 'POST', path, body, auth });
        },
        delete<T extends SuccessEnvelope>(path: string, auth?: TransportAuthMode) {
            return request<T>({ method: 'DELETE', path, auth });
        }
    };
}
