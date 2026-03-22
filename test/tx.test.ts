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
});
