import type { ErrorEnvelope } from '../generated/agent-api';

export class WebdomApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: Record<string, unknown>;
    readonly retryable?: boolean;
    readonly meta?: ErrorEnvelope['meta'];
    readonly response?: unknown;
    override readonly cause?: unknown;

    constructor(args: {
        message: string;
        status: number;
        code: string;
        details?: Record<string, unknown>;
        retryable?: boolean;
        meta?: ErrorEnvelope['meta'];
        response?: unknown;
        cause?: unknown;
    }) {
        super(args.message, { cause: args.cause });
        this.name = 'WebdomApiError';
        this.status = args.status;
        this.code = args.code;
        this.details = args.details;
        this.retryable = args.retryable;
        this.meta = args.meta;
        this.response = args.response;
        this.cause = args.cause;
    }
}
