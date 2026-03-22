import { promises as fs } from 'node:fs';

import { afterEach } from 'vitest';

export const TEST_ADDRESS = 'EQBAjaOyi2wGWlk-EDkSabqqnF-MrrwMadnwqrurKpkla9nE';
export const TEST_PRIVATE_KEY = 'e4b8be65bc79767b68c7431e790e847e6f18d6ebe3009c9b8b45be8f60a2f7ab';
export const TEST_PUBLIC_KEY = '37419c804f5c5b994db2d69c7da663b6a90ec7e82502547c2754e4d39ad90808';

const CLI_ENV_KEYS = [
    'WEBDOM_AGENT_TOKEN_FILE',
    'WEBDOM_WALLET_MNEMONIC',
    'WALLET_MNEMONIC',
    'WEBDOM_WALLET_PRIVATE_KEY',
    'WALLET_PRIVATE_KEY',
    'WEBDOM_WALLET_PUBLIC_KEY',
    'WALLET_PUBLIC_KEY',
    'WEBDOM_WALLET_ADDRESS',
    'WALLET_ADDRESS',
    'WEBDOM_WALLET_VERSION',
    'WALLET_VERSION',
    'WEBDOM_WALLET_ID',
    'WALLET_ID',
    'WEBDOM_NETWORK_GLOBAL_ID',
    'NETWORK_GLOBAL_ID',
    'WEBDOM_WORKCHAIN',
    'WORKCHAIN'
] as const;

const tempPaths: string[] = [];
const originalFetch = globalThis.fetch;
const originalEnv = Object.fromEntries(CLI_ENV_KEYS.map((key) => [key, process.env[key]]));

export function trackTempPath(tempPath: string) {
    tempPaths.push(tempPath);
}

export function jsonResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

afterEach(async () => {
    await Promise.all(tempPaths.splice(0).map(async (tempPath) => {
        await fs.rm(tempPath, { recursive: true, force: true });
    }));
    globalThis.fetch = originalFetch;

    for (const key of CLI_ENV_KEYS) {
        const value = originalEnv[key];
        if (value === undefined) {
            delete process.env[key];
            continue;
        }

        process.env[key] = value;
    }
});
