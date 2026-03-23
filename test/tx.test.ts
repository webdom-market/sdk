import { Address } from '@ton/core';
import { describe, expect, it } from 'vitest';

import { createWebdomSdk } from '../src';
import { TEST_ADDRESS, jsonResponse } from './helpers';

describe('transaction namespaces', () => {
    it('uses instance contract addresses for marketplace transactions', () => {
        const customMarketplace = Address.parse(TEST_ADDRESS);
        const sdk = createWebdomSdk({
            contracts: {
                marketplace: customMarketplace
            }
        });

        const transaction = sdk.tx.marketplace.buySubscription({
            subscriptionLevel: 2,
            subscriptionPeriod: 30,
            subscriptionPrice: 10n
        });

        expect(transaction.messages).toHaveLength(1);
        expect(transaction.messages[0]?.address).toBe(customMarketplace.toString());
        expect(transaction.meta?.kind).toBe('BuySubscription');
    });

    it('loads deal pricing through the instance api for purchase builders', async () => {
        const sdk = createWebdomSdk({
            fetch: async () =>
                jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-deal'
                    },
                    data: {
                        address: TEST_ADDRESS,
                        domain_names: ['gold.ton'],
                        pricing: {
                            price: {
                                amount: '1500000000',
                                currency: 'TON'
                            }
                        }
                    }
                })
        });

        const transaction = await sdk.tx.sales.purchaseTonSimple({
            saleAddress: TEST_ADDRESS
        });

        expect(transaction.messages[0]?.address).toBe(TEST_ADDRESS);
        expect(transaction.messages[0]?.amount).toBe('1676000000');
        expect(transaction.meta?.kind).toBe('PurchaseTonSimpleSale');
    });

    it('fetches marketplace config once for deployDomainSwap when both values are omitted', async () => {
        let configRequests = 0;
        const sdk = createWebdomSdk({
            fetch: async (input) => {
                const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

                if (url.endsWith('/marketplace/config')) {
                    configRequests += 1;
                    return jsonResponse({
                        success: true,
                        meta: {
                            request_id: 'req-marketplace-config'
                        },
                        data: {
                            deploy_configs: {
                                multiple_domain_swap: {
                                    deploy_fee: {
                                        amount: '1500000000',
                                        currency: 'TON'
                                    },
                                    completion_commission: {
                                        amount: '200000000',
                                        currency: 'TON'
                                    }
                                }
                            }
                        }
                    });
                }

                throw new Error(`Unexpected fetch URL: ${url}`);
            }
        });

        const transaction = await sdk.tx.swaps.deployDomainSwap({
            leftDomainAddresses: [TEST_ADDRESS],
            leftPaymentTotal: 1n,
            rightOwnerAddress: TEST_ADDRESS,
            rightDomainAddresses: [TEST_ADDRESS],
            rightPaymentTotal: 2n,
            validUntil: 1_700_000_000
        });

        expect(configRequests).toBe(1);
        expect(transaction.messages).toHaveLength(1);
        expect(transaction.meta?.kind).toBe('DeployDomainSwap');
    });

    it('loads marketplace completion commission for TON offers when omitted', async () => {
        let configRequests = 0;
        const sdk = createWebdomSdk({
            fetch: async (input) => {
                const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

                if (url.endsWith('/marketplace/config')) {
                    configRequests += 1;
                    return jsonResponse({
                        success: true,
                        meta: {
                            request_id: 'req-marketplace-config'
                        },
                        data: {
                            deploy_configs: {
                                ton_simple_offer: {
                                    deploy_fee: {
                                        amount: '1500000000',
                                        currency: 'TON'
                                    },
                                    completion_commission: {
                                        amount: '200000000',
                                        currency: 'TON'
                                    }
                                }
                            }
                        }
                    });
                }

                throw new Error(`Unexpected fetch URL: ${url}`);
            }
        });

        const transaction = await sdk.tx.offers.deployTonSimple({
            sellerAddress: TEST_ADDRESS,
            domainName: 'gold.ton',
            price: 1_000_000_000n,
            validUntil: 1_700_000_000
        });

        expect(configRequests).toBe(1);
        expect(transaction.messages).toHaveLength(1);
        expect(transaction.meta?.kind).toBe('DeployTonSimpleOffer');
    });
});
