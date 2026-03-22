import { createAgentApi } from './api/high-level';
import { createRawAgentApi } from './api/raw';
import { createAuthClient } from './auth';
import { createWebdomSdkContext } from './config';
import type { WebdomSdkContext, WebdomSdkOptions } from './config';
import { createTxClient } from './tx';

export type WebdomSdk = ReturnType<typeof createWebdomSdk>;

export function createWebdomSdk(options: WebdomSdkOptions = {}) {
    const context = createWebdomSdkContext(options);
    return createWebdomSdkFromContext(context);
}

export function createWebdomSdkFromContext(context: WebdomSdkContext) {
    const raw = createRawAgentApi(context);
    const api = createAgentApi(raw);
    const auth = createAuthClient(context, api);
    const tx = createTxClient(context, api);

    return {
        context,
        api,
        auth,
        raw,
        tx,
    } as const;
}
