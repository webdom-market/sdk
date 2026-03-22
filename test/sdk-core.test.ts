import { describe, expect, it } from 'vitest';

import {
    DEFAULT_WEBDOM_API_BASE_URL,
    DEFAULT_WEBDOM_TONCENTER_ENDPOINT,
    createInMemoryTokenStorage,
    createWebdomSdk
} from '../src';

describe('createWebdomSdk', () => {
    it('creates isolated instances with independent token storage and runtime config', async () => {
        const tokenStorageA = createInMemoryTokenStorage();
        const tokenStorageB = createInMemoryTokenStorage();

        const sdkA = createWebdomSdk({
            apiBaseUrl: 'https://alpha.example/api',
            tokenStorage: tokenStorageA
        });
        const sdkB = createWebdomSdk({
            apiBaseUrl: 'https://beta.example/api',
            tokenStorage: tokenStorageB
        });

        await sdkA.auth.setToken('token-a');
        await sdkB.auth.setToken('token-b');

        expect(sdkA.context.apiBaseUrl).toBe('https://alpha.example/api');
        expect(sdkB.context.apiBaseUrl).toBe('https://beta.example/api');
        expect(await sdkA.auth.getToken()).toBe('token-a');
        expect(await sdkB.auth.getToken()).toBe('token-b');
        expect(sdkA.context.toncenterEndpoint).toBe(DEFAULT_WEBDOM_TONCENTER_ENDPOINT);
    });

    it('ships with documented defaults and layered namespaces', () => {
        const sdk = createWebdomSdk();

        expect(sdk.context.apiBaseUrl).toBe(DEFAULT_WEBDOM_API_BASE_URL);
        expect(sdk.context.contracts.marketplace.toString()).toBe('EQD7-a6WPtb7w5VgoUfHJmMvakNFgitXPk3sEM8Gf_WEBDOM');
        expect(sdk.context.contracts.usdt.toString()).toBe('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
        expect(sdk.api.catalog).toBeDefined();
        expect(sdk.api.marketplace).toBeDefined();
        expect(sdk.raw.catalog).toBeDefined();
        expect(sdk.raw.marketplace).toBeDefined();
        expect('catalog' in sdk).toBe(false);
    });
});
