import type { WebdomSdkContext } from '../config';
import type { WebdomApi } from '../api/high-level';
import type {
    TonProofAuthenticateInput,
    TonProofRuntimeOptions,
    TonProofTokenExchangeBuildInput
} from './ton-proof';
import { buildTonProofTokenExchangeRequest } from './ton-proof';
import type { TonProofTokenExchangeRequest } from '../generated/agent-api';

export type WebdomAuth = ReturnType<typeof createAuthClient>;

function runtimeOptionsFromContext(context: WebdomSdkContext): TonProofRuntimeOptions {
    return {
        apiBaseUrl: context.apiBaseUrl,
        tonClient: context.getTonClient(),
        toncenterEndpoint: context.toncenterEndpoint
    };
}

export function createAuthClient(context: WebdomSdkContext, api: WebdomApi) {
    const exchangeTonProofForToken = async (
        body: TonProofTokenExchangeRequest,
        options?: { persistToken?: boolean }
    ) => {
        const token = await api.auth.exchangeTonProofForToken(body);
        if (options?.persistToken !== false) {
            await context.tokenStorage.setToken(token.access_token);
        }
        return token;
    };

    return {
        async getTonProofPayload() {
            return api.auth.getTonProofPayload();
        },
        async buildTokenExchangeRequest(input: TonProofTokenExchangeBuildInput) {
            return buildTonProofTokenExchangeRequest(input, runtimeOptionsFromContext(context));
        },
        async exchangeTonProofForToken(body: TonProofTokenExchangeRequest, options?: { persistToken?: boolean }) {
            return exchangeTonProofForToken(body, options);
        },
        async authenticate(input: TonProofAuthenticateInput, options?: { persistToken?: boolean }) {
            const challenge = input.challenge ?? await api.auth.getTonProofPayload();
            const body = await buildTonProofTokenExchangeRequest({
                ...input,
                challenge
            }, runtimeOptionsFromContext(context));
            return exchangeTonProofForToken(body, options);
        },
        async revokeCurrentToken() {
            const data = await api.auth.revokeCurrentToken();
            await context.tokenStorage.setToken(null);
            return data;
        },
        async setToken(token: string | null) {
            await context.tokenStorage.setToken(token);
        },
        async getToken() {
            return context.tokenStorage.getToken();
        },
        async clearToken() {
            await context.tokenStorage.setToken(null);
        }
    };
}
