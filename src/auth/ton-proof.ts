import { Address, beginCell, storeStateInit } from '@ton/core';
import type { StateInit } from '@ton/core';
import { keyPairFromSecretKey, keyPairFromSeed, mnemonicToWalletKey, sha256_sync, sign } from '@ton/crypto';
import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import type { TonClient4 } from '@ton/ton';
import { Buffer } from 'buffer';

import { DEFAULT_WEBDOM_API_BASE_URL, getTonClient, getTonProofDomainFromApiBaseUrl } from '../config';
import type { TonProofChallenge, TonProofDomain, TonProofProof, TonProofTokenExchangeRequest } from '../generated/agent-api';

const TON_PROOF_PREFIX = 'ton-proof-item-v2/';
const TON_CONNECT_PREFIX = 'ton-connect';
export type TonProofWalletVersion = 'v4r2' | 'v5r1';
export type TonProofBytesLike = Uint8Array | Buffer | string;
export type TonProofMnemonicInput = {
    mnemonic: string | string[];
};
export type TonProofPrivateKeyInput = {
    privateKey: TonProofBytesLike;
    publicKey?: TonProofBytesLike;
};
export type TonProofWalletInput = TonProofMnemonicInput | TonProofPrivateKeyInput;
type TonProofWalletAddressSelector = {
    walletAddress: string;
    walletVersion?: never;
    walletId?: never;
    networkGlobalId?: never;
    workchain?: never;
};
type TonProofWalletVersionSelector = {
    walletAddress?: never;
    walletVersion: TonProofWalletVersion | 'auto';
    walletId?: number;
    networkGlobalId?: number;
    workchain?: number;
};
type TonProofWalletSelector = TonProofWalletAddressSelector | TonProofWalletVersionSelector;
export type TonProofSigningInput = TonProofWalletInput &
    TonProofWalletSelector & {
        payload: string;
        domain?: string | TonProofDomain;
        timestamp?: number;
    };
export type SignedTonProof = {
    wallet_address: string;
    wallet_public_key: string;
    wallet_version?: TonProofWalletVersion;
    wallet_state_init?: string;
    proof: TonProofProof;
};
export type TonProofTokenExchangeBuildInput = TonProofWalletInput &
    TonProofWalletSelector & {
        challenge: Pick<TonProofChallenge, 'challenge_id' | 'payload'>;
        domain?: string | TonProofDomain;
        timestamp?: number;
        expires_in_seconds?: number | null;
    };
export type TonProofAuthenticateInput = TonProofWalletInput &
    TonProofWalletSelector & {
        challenge?: Pick<TonProofChallenge, 'challenge_id' | 'payload'>;
        domain?: string | TonProofDomain;
        timestamp?: number;
        expires_in_seconds?: number | null;
    };

export type TonProofRuntimeOptions = {
    apiBaseUrl?: string;
    tonClient?: TonClient4;
    toncenterEndpoint?: string;
};

type KeyPair = {
    publicKey: Buffer;
    secretKey: Buffer;
};

type WalletContractResolution = {
    address: Address;
    init: StateInit;
    version: TonProofWalletVersion;
};

type WalletIdentity = {
    address: Address;
    version?: TonProofWalletVersion;
    init?: StateInit;
};

function isHexString(value: string): boolean {
    const normalized = value.startsWith('0x') ? value.slice(2) : value;
    return normalized.length > 0 && normalized.length % 2 === 0 && /^[\da-f]+$/i.test(normalized);
}

function decodeBase64String(value: string, urlSafe: boolean): Buffer | null {
    const stripped = value.replace(/=+$/u, '');
    const pattern = urlSafe ? /^[A-Za-z0-9_-]+={0,2}$/u : /^[A-Za-z0-9+/]+={0,2}$/u;
    if (stripped.length === 0 || !pattern.test(value) || stripped.length % 4 === 1) {
        return null;
    }

    const normalized = urlSafe ? stripped.replace(/-/gu, '+').replace(/_/gu, '/') : stripped;
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64');
    const canonical = (urlSafe ? decoded.toString('base64url') : decoded.toString('base64')).replace(/=+$/u, '');

    return canonical === stripped ? decoded : null;
}

function formatExpectedByteLengths(lengths: number[]): string {
    return lengths.length === 1 ? `${lengths[0]} bytes` : `${lengths.slice(0, -1).join(', ')} or ${lengths.at(-1)} bytes`;
}

function assertByteLength(value: Buffer, fieldName: string, expectedLengths: number[]): Buffer {
    if (!expectedLengths.includes(value.length)) {
        throw new Error(`${fieldName} must decode to ${formatExpectedByteLengths(expectedLengths)}`);
    }

    return value;
}

function normalizeByteString(value: string, fieldName: string, expectedLengths: number[]): Buffer {
    const normalized = value.trim();
    if (normalized.length === 0) {
        throw new Error(`${fieldName} must not be empty`);
    }
    if (isHexString(normalized)) {
        return assertByteLength(
            Buffer.from(normalized.startsWith('0x') ? normalized.slice(2) : normalized, 'hex'),
            fieldName,
            expectedLengths
        );
    }

    const base64 = decodeBase64String(normalized, false) ?? decodeBase64String(normalized, true);
    if (base64) {
        return assertByteLength(base64, fieldName, expectedLengths);
    }

    throw new Error(`${fieldName} must be a valid hex, base64, or base64url string`);
}

function normalizeBytes(value: TonProofBytesLike, fieldName: string, expectedLengths: number[]): Buffer {
    if (typeof value === 'string') {
        return normalizeByteString(value, fieldName, expectedLengths);
    }
    if (value instanceof Uint8Array) {
        return assertByteLength(Buffer.from(value), fieldName, expectedLengths);
    }
    throw new TypeError(`${fieldName} must be a hex/base64 string or Uint8Array`);
}

function normalizeMnemonic(mnemonic: string | string[]): string[] {
    const words = Array.isArray(mnemonic) ? mnemonic : mnemonic.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        throw new Error('mnemonic must contain at least one word');
    }

    return words;
}

async function resolveKeyPair(input: TonProofWalletInput): Promise<KeyPair> {
    const hasMnemonic = 'mnemonic' in input && input.mnemonic !== undefined;
    const hasPrivateKey = 'privateKey' in input && input.privateKey !== undefined;

    if (hasMnemonic === hasPrivateKey) {
        throw new Error('Provide exactly one of mnemonic or privateKey');
    }

    if (hasMnemonic) {
        const mnemonicInput = input as TonProofMnemonicInput;
        const keyPair = await mnemonicToWalletKey(normalizeMnemonic(mnemonicInput.mnemonic));
        return {
            publicKey: Buffer.from(keyPair.publicKey),
            secretKey: Buffer.from(keyPair.secretKey)
        };
    }

    const privateKeyInput = input as TonProofPrivateKeyInput;
    const privateKey = normalizeBytes(privateKeyInput.privateKey, 'privateKey', [32, 64]);
    const keyPair =
        privateKey.length === 32
            ? keyPairFromSeed(privateKey)
            : privateKey.length === 64
                ? keyPairFromSecretKey(privateKey)
                : null;

    if (!keyPair) {
        throw new Error('privateKey must be 32-byte seed or 64-byte ed25519 secret key');
    }

    if (privateKeyInput.publicKey) {
        const publicKey = normalizeBytes(privateKeyInput.publicKey, 'publicKey', [32]);
        if (!publicKey.equals(Buffer.from(keyPair.publicKey))) {
            throw new Error('publicKey does not match the provided privateKey');
        }
    }

    return {
        publicKey: Buffer.from(keyPair.publicKey),
        secretKey: Buffer.from(keyPair.secretKey)
    };
}

function resolveTonProofDomain(domain?: string | TonProofDomain, options: TonProofRuntimeOptions = {}): TonProofDomain {
    if (!domain) {
        const host = getTonProofDomainFromApiBaseUrl(options.apiBaseUrl ?? DEFAULT_WEBDOM_API_BASE_URL);
        return {
            lengthBytes: Buffer.byteLength(host),
            value: host
        };
    }

    if (typeof domain === 'string') {
        const value = domain.includes('://') ? new URL(domain).host : domain;
        return {
            lengthBytes: Buffer.byteLength(value),
            value
        };
    }

    const lengthBytes = domain.lengthBytes ?? Buffer.byteLength(domain.value);
    if (lengthBytes !== Buffer.byteLength(domain.value)) {
        throw new Error('domain.lengthBytes must match the byte length of domain.value');
    }

    return {
        lengthBytes,
        value: domain.value
    };
}

function hasWalletAddress(input: TonProofWalletSelector): input is TonProofWalletAddressSelector {
    return typeof (input as TonProofWalletAddressSelector).walletAddress === 'string';
}

function assertWalletSelector(input: Partial<TonProofWalletSelector>): void {
    const hasAddress = typeof input.walletAddress === 'string' && input.walletAddress.length > 0;
    const hasVersion = typeof input.walletVersion === 'string' && input.walletVersion.length > 0;

    if (hasAddress === hasVersion) {
        throw new Error('Provide exactly one of walletAddress or walletVersion');
    }
}

function createTonProofSignatureMessage(args: {
    address: Address;
    domain: TonProofDomain;
    payload: string;
    timestamp: number;
}): Buffer {
    const workchain = Buffer.alloc(4);
    workchain.writeUInt32BE(args.address.workChain >>> 0, 0);

    const timestamp = Buffer.alloc(8);
    timestamp.writeBigUInt64LE(BigInt(args.timestamp), 0);

    const domainLength = Buffer.alloc(4);
    domainLength.writeUInt32LE(args.domain.lengthBytes, 0);

    const message = Buffer.concat([
        Buffer.from(TON_PROOF_PREFIX),
        workchain,
        args.address.hash,
        domainLength,
        Buffer.from(args.domain.value),
        timestamp,
        Buffer.from(args.payload)
    ]);

    return Buffer.from(
        sha256_sync(Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from(TON_CONNECT_PREFIX), Buffer.from(sha256_sync(message))]))
    );
}

function createWalletContract(args: {
    version: TonProofWalletVersion;
    publicKey: Buffer;
    workchain: number;
    walletId?: number;
    networkGlobalId?: number;
}): WalletContractResolution {
    if (args.version === 'v5r1') {
        const contract =
            args.walletId === undefined
                ? WalletContractV5R1.create({
                    publicKey: args.publicKey,
                    workchain: args.workchain
                })
                : WalletContractV5R1.create({
                    publicKey: args.publicKey,
                    walletId: {
                        networkGlobalId: args.networkGlobalId ?? -239,
                        context: {
                            workchain: args.workchain,
                            walletVersion: 'v5r1' as const,
                            subwalletNumber: args.walletId
                        }
                    }
                });

        return {
            address: contract.address,
            init: contract.init,
            version: args.version
        };
    }

    const contract = WalletContractV4.create({
        workchain: args.workchain,
        publicKey: args.publicKey,
        walletId: args.walletId
    });

    return {
        address: contract.address,
        init: contract.init,
        version: args.version
    };
}

async function resolveWalletContract(args: {
    publicKey: Buffer;
    workchain: number;
    walletVersion?: TonProofWalletVersion | 'auto';
    walletId?: number;
    networkGlobalId?: number;
}, options: TonProofRuntimeOptions = {}): Promise<WalletContractResolution> {
    const requestedVersion = args.walletVersion ?? 'auto';
    if (requestedVersion !== 'auto') {
        return createWalletContract({
            version: requestedVersion,
            publicKey: args.publicKey,
            workchain: args.workchain,
            walletId: args.walletId,
            networkGlobalId: args.networkGlobalId
        });
    }

    const candidates = (['v4r2', 'v5r1'] as const).map((version) =>
        createWalletContract({
            version,
            publicKey: args.publicKey,
            workchain: args.workchain,
            walletId: args.walletId,
            networkGlobalId: args.networkGlobalId
        })
    );

    try {
        const client = getTonClient({
            tonClient: options.tonClient,
            toncenterEndpoint: options.toncenterEndpoint
        });
        const { last } = await client.getLastBlock();
        const deployed = await Promise.all(candidates.map(async (candidate) => {
            const isDeployed = await client.isContractDeployed(last.seqno, candidate.address);
            return isDeployed ? candidate : null;
        }));
        const activeCandidates = deployed.filter((candidate): candidate is WalletContractResolution => candidate !== null);

        if (activeCandidates.length > 1) {
            throw new Error('Multiple wallet versions are deployed for this key. Specify walletVersion explicitly.');
        }
        if (activeCandidates.length === 1) {
            return activeCandidates[0]!;
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('Multiple wallet versions are deployed')) {
            throw error;
        }

        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to auto-detect wallet version: ${message}`, { cause: error });
    }

    return candidates[0]!;
}

function toWalletStateInitBase64(init: Parameters<typeof storeStateInit>[0]): string {
    return beginCell().store(storeStateInit(init)).endCell().toBoc().toString('base64');
}

export async function signTonProof(input: TonProofSigningInput, options: TonProofRuntimeOptions = {}): Promise<SignedTonProof> {
    assertWalletSelector(input);
    const keyPair = await resolveKeyPair(input);
    const domain = resolveTonProofDomain(input.domain, options);
    const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);
    const wallet: WalletIdentity = hasWalletAddress(input)
        ? {
            address: Address.parse(input.walletAddress)
        }
        : await resolveWalletContract({
            publicKey: keyPair.publicKey,
            workchain: input.workchain ?? 0,
            walletVersion: input.walletVersion,
            walletId: input.walletId,
            networkGlobalId: input.networkGlobalId
        }, options);

    const signature = sign(
        createTonProofSignatureMessage({
            address: wallet.address,
            domain,
            payload: input.payload,
            timestamp
        }),
        keyPair.secretKey
    );

    return {
        wallet_address: wallet.address.toString(),
        wallet_public_key: keyPair.publicKey.toString('hex'),
        wallet_version: wallet.version,
        wallet_state_init: wallet.init ? toWalletStateInitBase64(wallet.init) : undefined,
        proof: {
            timestamp,
            domain,
            payload: input.payload,
            signature: Buffer.from(signature).toString('base64'),
            ...(wallet.init ? { state_init: toWalletStateInitBase64(wallet.init) } : {})
        }
    };
}

export async function buildTonProofTokenExchangeRequest(
    input: TonProofTokenExchangeBuildInput,
    options: TonProofRuntimeOptions = {}
): Promise<TonProofTokenExchangeRequest> {
    const signedTonProof = await signTonProof({
        ...input,
        payload: input.challenge.payload
    }, options);

    return {
        challenge_id: input.challenge.challenge_id,
        wallet_address: signedTonProof.wallet_address,
        wallet_public_key: signedTonProof.wallet_public_key,
        proof: signedTonProof.proof,
        expires_in_seconds: input.expires_in_seconds
    };
}
