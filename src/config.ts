import { Address } from '@ton/core';
import { TonClient4 } from '@ton/ton';

export type AddressLike = Address | string;

export type TokenStorageAdapter = {
    getToken(): string | null | Promise<string | null>;
    setToken(token: string | null): void | Promise<void>;
};

export type WebdomContractAddressesInput = {
    marketplace: AddressLike;
    admin: AddressLike;
    web3: AddressLike;
    usdt: AddressLike;
    burn: AddressLike;
    nativeVault: AddressLike;
    web3Vault: AddressLike;
    usdtVault: AddressLike;
    usdtPool: AddressLike;
    web3Pool: AddressLike;
    tonDnsCollection: AddressLike;
    tgUsernamesCollection: AddressLike;
};

export type WebdomContractAddressOverrides = Partial<WebdomContractAddressesInput>;

export type WebdomContractAddresses = {
    marketplace: Address;
    admin: Address;
    web3: Address;
    usdt: Address;
    burn: Address;
    nativeVault: Address;
    web3Vault: Address;
    usdtVault: Address;
    usdtPool: Address;
    web3Pool: Address;
    tonDnsCollection: Address;
    tgUsernamesCollection: Address;
};

export type WebdomSdkOptions = {
    apiBaseUrl?: string;
    contracts?: WebdomContractAddressOverrides;
    toncenterEndpoint?: string;
    tonClient?: TonClient4;
    fetch?: typeof fetch;
    requestTimeoutMs?: number;
    requestSignal?: AbortSignal;
    tokenStorage?: TokenStorageAdapter;
};

export type WebdomSdkContext = {
    apiBaseUrl: string;
    contracts: WebdomContractAddresses;
    toncenterEndpoint?: string;
    fetch: typeof fetch;
    requestTimeoutMs?: number;
    requestSignal?: AbortSignal;
    tokenStorage: TokenStorageAdapter;
    getTonClient(): TonClient4;
};

export const DEFAULT_WEBDOM_API_BASE_URL = 'https://webdom.market/api/agent/v1';
export const DEFAULT_WEBDOM_TONCENTER_ENDPOINT = 'https://mainnet-v4.tonhubapi.com';
export const DEFAULT_WEBDOM_CONTRACT_ADDRESSES_INPUT = {
    marketplace: 'EQD7-a6WPtb7w5VgoUfHJmMvakNFgitXPk3sEM8Gf_WEBDOM',
    admin: '0QCovSj8c8Ik1I-RZt7dbIOEulYe-MfJ2SN5eMhxwfACviV7',
    web3: 'EQBtcL4JA-PdPiUkB8utHcqdaftmUSTqdL8Z1EeXePLti_nK',
    usdt: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    burn: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    nativeVault: 'EQDa4VOnTYlLvDJ0gZjNYm5PXfSmmtL6Vs6A_CZEtXCNICq_',
    web3Vault: 'EQA_Au61onx7O5q1C2Q92S2bMaEL5v96HAYH4fjms1NIERVE',
    usdtVault: 'EQAYqo4u7VF0fa4DPAebk4g9lBytj2VFny7pzXR0trjtXQaO',
    usdtPool: 'EQA-X_yo3fzzbDbJ_0bzFWKqtRuZFIRa1sJsveZJ1YpViO3r',
    web3Pool: 'EQBTzDJyEgoXm88EkVTciyyZBfQYI-8OfOEDZphfHaQcoY8V',
    tonDnsCollection: 'EQC3dNlesgVD8YbAazcauIrXBPfiVhMMr5YYk2in0Mtsz0Bz',
    tgUsernamesCollection: 'EQCA14o1-VWhS2efqoh_9M1b_A9DtKTuoqfmkn83AbJzwnPi'
} as const satisfies WebdomContractAddressesInput;

export const DEFAULT_WEBDOM_CONTRACT_ADDRESSES = normalizeContracts(
    {},
    DEFAULT_WEBDOM_CONTRACT_ADDRESSES_INPUT
);

export function normalizeAddress(address: AddressLike): Address {
    return typeof address === 'string' ? Address.parse(address) : address;
}

export function normalizeContracts(
    input: WebdomContractAddressOverrides = {},
    base: WebdomContractAddressesInput = DEFAULT_WEBDOM_CONTRACT_ADDRESSES_INPUT
): WebdomContractAddresses {
    const merged = {
        ...base,
        ...input
    };

    return {
        marketplace: normalizeAddress(merged.marketplace),
        admin: normalizeAddress(merged.admin),
        web3: normalizeAddress(merged.web3),
        usdt: normalizeAddress(merged.usdt),
        burn: normalizeAddress(merged.burn),
        nativeVault: normalizeAddress(merged.nativeVault),
        web3Vault: normalizeAddress(merged.web3Vault),
        usdtVault: normalizeAddress(merged.usdtVault),
        usdtPool: normalizeAddress(merged.usdtPool),
        web3Pool: normalizeAddress(merged.web3Pool),
        tonDnsCollection: normalizeAddress(merged.tonDnsCollection),
        tgUsernamesCollection: normalizeAddress(merged.tgUsernamesCollection)
    };
}

export function resolveFetchImplementation(fetchImpl?: typeof fetch): typeof fetch {
    if (fetchImpl) {
        return fetchImpl;
    }
    if (typeof globalThis.fetch !== 'function') {
        throw new Error('Webdom SDK requires a fetch implementation');
    }
    return globalThis.fetch.bind(globalThis);
}

export function createInMemoryTokenStorage(initialToken: string | null = null): TokenStorageAdapter {
    let token = initialToken;
    return {
        getToken() {
            return token;
        },
        setToken(nextToken: string | null) {
            token = nextToken;
        }
    };
}

export function getTonClient(input: { tonClient?: TonClient4; toncenterEndpoint?: string } = {}): TonClient4 {
    if (input.tonClient) {
        return input.tonClient;
    }

    const endpoint = input.toncenterEndpoint ?? DEFAULT_WEBDOM_TONCENTER_ENDPOINT;
    if (!endpoint) {
        throw new Error('Webdom SDK requires tonClient or toncenterEndpoint for contract helpers');
    }

    return new TonClient4({ endpoint });
}

export function getTonProofDomainFromApiBaseUrl(apiBaseUrl: string = DEFAULT_WEBDOM_API_BASE_URL): string {
    return new URL(apiBaseUrl).host;
}

export function createWebdomSdkContext(options: WebdomSdkOptions = {}): WebdomSdkContext {
    const fetch = resolveFetchImplementation(options.fetch);
    const tokenStorage = options.tokenStorage ?? createInMemoryTokenStorage();
    const contracts = normalizeContracts(options.contracts);
    let tonClient = options.tonClient;

    return {
        apiBaseUrl: (options.apiBaseUrl ?? DEFAULT_WEBDOM_API_BASE_URL).replace(/\/+$/, ''),
        contracts,
        toncenterEndpoint: options.toncenterEndpoint ?? DEFAULT_WEBDOM_TONCENTER_ENDPOINT,
        fetch,
        requestTimeoutMs: options.requestTimeoutMs,
        requestSignal: options.requestSignal,
        tokenStorage,
        getTonClient() {
            tonClient ??= getTonClient({
                toncenterEndpoint: options.toncenterEndpoint ?? DEFAULT_WEBDOM_TONCENTER_ENDPOINT
            });
            return tonClient;
        }
    };
}
