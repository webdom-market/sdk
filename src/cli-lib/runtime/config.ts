import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { WebdomSdkOptions } from '../../config';

export type CliIo = {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    stdin?: () => Promise<string>;
};

const DEFAULT_TOKEN_FILE_PATH = path.join(os.homedir(), '.config', 'webdom', 'agent-token');

function getEnvValue(...keys: string[]) {
    for (const key of keys) {
        const value = process.env[key]?.trim();
        if (value) {
            return value;
        }
    }

    return undefined;
}

function parseOptionalEnvNumber(value: string | undefined, fieldName: string) {
    if (value === undefined) {
        return undefined;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`${fieldName} must be a valid number`);
    }

    return parsed;
}

export function getAuthDefaults() {
    return {
        ...(getEnvValue('WEBDOM_WALLET_MNEMONIC', 'WALLET_MNEMONIC') ? { mnemonic: getEnvValue('WEBDOM_WALLET_MNEMONIC', 'WALLET_MNEMONIC') } : {}),
        ...(getEnvValue('WEBDOM_WALLET_PRIVATE_KEY', 'WALLET_PRIVATE_KEY') ? { private_key: getEnvValue('WEBDOM_WALLET_PRIVATE_KEY', 'WALLET_PRIVATE_KEY') } : {}),
        ...(getEnvValue('WEBDOM_WALLET_PUBLIC_KEY', 'WALLET_PUBLIC_KEY') ? { public_key: getEnvValue('WEBDOM_WALLET_PUBLIC_KEY', 'WALLET_PUBLIC_KEY') } : {}),
        ...(getEnvValue('WEBDOM_WALLET_ADDRESS', 'WALLET_ADDRESS') ? { wallet_address: getEnvValue('WEBDOM_WALLET_ADDRESS', 'WALLET_ADDRESS') } : {}),
        ...(getEnvValue('WEBDOM_WALLET_VERSION', 'WALLET_VERSION') ? { wallet_version: getEnvValue('WEBDOM_WALLET_VERSION', 'WALLET_VERSION') } : {}),
        ...(parseOptionalEnvNumber(getEnvValue('WEBDOM_WALLET_ID', 'WALLET_ID'), 'walletId') !== undefined
            ? { wallet_id: parseOptionalEnvNumber(getEnvValue('WEBDOM_WALLET_ID', 'WALLET_ID'), 'walletId') }
            : {}),
        ...(parseOptionalEnvNumber(getEnvValue('WEBDOM_NETWORK_GLOBAL_ID', 'NETWORK_GLOBAL_ID'), 'networkGlobalId') !== undefined
            ? { network_global_id: parseOptionalEnvNumber(getEnvValue('WEBDOM_NETWORK_GLOBAL_ID', 'NETWORK_GLOBAL_ID'), 'networkGlobalId') }
            : {}),
        ...(parseOptionalEnvNumber(getEnvValue('WEBDOM_WORKCHAIN', 'WORKCHAIN'), 'workchain') !== undefined
            ? { workchain: parseOptionalEnvNumber(getEnvValue('WEBDOM_WORKCHAIN', 'WORKCHAIN'), 'workchain') }
            : {})
    } satisfies Record<string, unknown>;
}

async function readProcessStdin(): Promise<string> {
    const chunks: Buffer[] = [];

    return await new Promise((resolve, reject) => {
        process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        process.stdin.on('error', reject);
    });
}

export async function resolveJsonInput(
    flags: Record<string, string | boolean | Array<string | boolean>>,
    io: CliIo
): Promise<unknown> {
    const jsonFlag = flags.json;
    const inputFlag = flags.input;
    delete flags.json;
    delete flags.input;

    if (jsonFlag && inputFlag) {
        throw new Error('Use either --json or --input, not both');
    }

    if (typeof jsonFlag === 'string') {
        return JSON.parse(jsonFlag);
    }

    if (typeof inputFlag !== 'string') {
        return undefined;
    }

    const source = inputFlag.trim();
    if (source === '-') {
        const content = io.stdin ? await io.stdin() : await readProcessStdin();
        return JSON.parse(content);
    }

    const resolvedPath = path.resolve(process.cwd(), source);
    return JSON.parse(await fs.readFile(resolvedPath, 'utf8'));
}

async function createTokenStorage(tokenFilePath?: string, tokenFromArg?: string) {
    const resolvedPath = tokenFilePath ? path.resolve(process.cwd(), tokenFilePath) : null;

    return {
        async getToken() {
            if (tokenFromArg) {
                return tokenFromArg;
            }
            if (!resolvedPath) {
                return null;
            }
            try {
                const value = await fs.readFile(resolvedPath, 'utf8');
                return value.trim() || null;
            } catch {
                return null;
            }
        },
        async setToken(token: string | null) {
            if (!resolvedPath) {
                return;
            }
            if (!token) {
                await fs.rm(resolvedPath, { force: true });
                return;
            }
            await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
            await fs.writeFile(resolvedPath, token, 'utf8');
        }
    };
}

export async function resolveSdkOptions(flags: Record<string, string | boolean | Array<string | boolean>>): Promise<WebdomSdkOptions> {
    const configPath = typeof flags.config === 'string' ? flags.config : undefined;
    const cliApiBaseUrl = typeof flags['api-base-url'] === 'string' ? flags['api-base-url'] : undefined;
    const cliToken = typeof flags.token === 'string' ? flags.token : undefined;
    const cliTokenFile = typeof flags['token-file'] === 'string' ? flags['token-file'] : undefined;
    const cliToncenterEndpoint = typeof flags['toncenter-endpoint'] === 'string' ? flags['toncenter-endpoint'] : undefined;
    const envApiBaseUrl = process.env.WEBDOM_API_BASE_URL;
    const envToken = process.env.WEBDOM_AGENT_TOKEN;
    const envTokenFile = process.env.WEBDOM_AGENT_TOKEN_FILE;
    const envToncenterEndpoint = process.env.WEBDOM_TONCENTER_ENDPOINT;

    delete flags.config;
    delete flags['api-base-url'];
    delete flags.token;
    delete flags['token-file'];
    delete flags['toncenter-endpoint'];

    const tokenStorage = await createTokenStorage(cliTokenFile ?? envTokenFile ?? DEFAULT_TOKEN_FILE_PATH, cliToken ?? envToken);
    const loaded = configPath
        ? JSON.parse(await fs.readFile(path.resolve(process.cwd(), configPath), 'utf8')) as WebdomSdkOptions
        : undefined;

    return {
        ...(loaded ?? {}),
        apiBaseUrl: cliApiBaseUrl ?? loaded?.apiBaseUrl ?? envApiBaseUrl,
        toncenterEndpoint: cliToncenterEndpoint ?? loaded?.toncenterEndpoint ?? envToncenterEndpoint,
        tokenStorage
    };
}
