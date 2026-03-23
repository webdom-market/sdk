import type { Address } from '@ton/core';
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
        expect(sdk.balances).toBeDefined();
        expect('catalog' in sdk).toBe(false);
    });

    it('reads TON, USDT, and WEB3 balances through the balance client', async () => {
        const tonWalletAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
        const usdtJettonWalletAddress = 'EQAYqo4u7VF0fa4DPAebk4g9lBytj2VFny7pzXR0trjtXQaO';
        const web3JettonWalletAddress = 'EQA_Au61onx7O5q1C2Q92S2bMaEL5v96HAYH4fjms1NIERVE';

        const tonClient = {
            async getLastBlock() {
                return { last: { seqno: 321 } };
            },
            async getAccount(_seqno: number, address: Address) {
                const normalized = address.toString();

                if (normalized === tonWalletAddress) {
                    return {
                        account: {
                            balance: { coins: '1234567890' },
                            state: { type: 'active' }
                        }
                    };
                }

                if (normalized === usdtJettonWalletAddress) {
                    return {
                        account: {
                            balance: { coins: '0' },
                            state: { type: 'active' }
                        }
                    };
                }

                if (normalized === web3JettonWalletAddress) {
                    return {
                        account: {
                            balance: { coins: '0' },
                            state: { type: 'active' }
                        }
                    };
                }

                throw new Error(`Unexpected account lookup for ${normalized}`);
            },
            async runMethod(_seqno: number, address: Address, method: string) {
                const normalized = address.toString();

                if (method === 'get_wallet_address') {
                    if (normalized === 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs') {
                        return {
                            reader: {
                                readAddress() {
                                    return { toString: () => usdtJettonWalletAddress };
                                }
                            }
                        };
                    }

                    if (normalized === 'EQBtcL4JA-PdPiUkB8utHcqdaftmUSTqdL8Z1EeXePLti_nK') {
                        return {
                            reader: {
                                readAddress() {
                                    return { toString: () => web3JettonWalletAddress };
                                }
                            }
                        };
                    }
                }

                if (method === 'get_wallet_data') {
                    if (normalized === usdtJettonWalletAddress) {
                        return {
                            reader: {
                                readBigNumber() {
                                    return 42000000n;
                                }
                            }
                        };
                    }

                    if (normalized === web3JettonWalletAddress) {
                        return {
                            reader: {
                                readBigNumber() {
                                    return 12345n;
                                }
                            }
                        };
                    }
                }

                throw new Error(`Unexpected runMethod call ${method} on ${normalized}`);
            }
        };

        const sdk = createWebdomSdk({
            tonClient: tonClient as any
        });

        const balances = await sdk.balances.getAll({
            address: tonWalletAddress
        });

        expect(balances.owner_address).toBe(tonWalletAddress);
        expect(balances.ton.amount).toBe('1234567890');
        expect(balances.ton.amount_decimal).toBe('1.23456789');
        expect('owner_address' in balances.ton).toBe(false);
        expect(balances.usdt.amount).toBe('42000000');
        expect(balances.usdt.amount_decimal).toBe('42');
        expect(balances.usdt.jetton_wallet_address).toBe(usdtJettonWalletAddress);
        expect(balances.web3.amount).toBe('12345');
        expect(balances.web3.amount_decimal).toBe('12.345');
        expect(balances.web3.jetton_wallet_address).toBe(web3JettonWalletAddress);
    });
});
