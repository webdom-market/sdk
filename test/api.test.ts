import { describe, expect, it } from 'vitest';

import { WebdomApiError } from '../src/api';
import { createInMemoryTokenStorage, createWebdomSdk } from '../src';
import { TEST_ADDRESS, TEST_PUBLIC_KEY, jsonResponse } from './helpers';

const CATALOG_CASES = [
    {
        name: 'available domain labels',
        expectedUrl: 'https://webdom.market/api/agent/v1/catalog/domains/available-labels?regex=%5E%5Ba-z%5D%7B4%7D%24&limit=2&has_letter=true',
        highLevelCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.api.catalog.listAvailableDomainLabels({
            regex: '^[a-z]{4}$',
            limit: 2,
            has_letter: true
        }),
        rawCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.raw.catalog.listAvailableDomainLabels({
            regex: '^[a-z]{4}$',
            limit: 2,
            has_letter: true
        }),
        response: {
            success: true,
            meta: {
                request_id: 'req-available-labels',
                api_version: '2026-03-22'
            },
            page_info: {
                next_cursor: 'cursor-available-2',
                has_more: true
            },
            data: {
                items: [
                    {
                        label: 'ably',
                        category: 'Business',
                        tags: ['eth_minted', 'top_100_web2']
                    },
                    {
                        label: 'atom',
                        category: null,
                        tags: []
                    }
                ],
                filter_options: {
                    tags: [
                        { value: 'eth_minted', label: '.eth minted' },
                        { value: 'top_100_web2', label: 'TOP-100 WEB2' }
                    ],
                    categories: ['Business']
                }
            }
        },
        assertHighLevel(result: any) {
            expect(result.items).toEqual([
                { label: 'ably', category: 'Business', tags: ['eth_minted', 'top_100_web2'] },
                { label: 'atom', category: null, tags: [] }
            ]);
            expect(result.labels).toEqual(['ably', 'atom']);
            expect(result.filterOptions).toEqual({
                tags: [
                    { value: 'eth_minted', label: '.eth minted' },
                    { value: 'top_100_web2', label: 'TOP-100 WEB2' }
                ],
                categories: ['Business']
            });
            expect(result.pageInfo.nextCursor).toBe('cursor-available-2');
            expect(result.pageInfo.hasMore).toBe(true);
        }
    }
] as const;

const ANALYTICS_AND_MARKETPLACE_CASES = [
    {
        name: 'marketplace config',
        expectedUrl: 'https://webdom.market/api/agent/v1/marketplace/config',
        highLevelCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.api.marketplace.getConfig(),
        rawCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.raw.marketplace.getConfig(),
        response: {
            success: true,
            meta: {
                request_id: 'req-marketplace-config',
                api_version: '2026-03-22'
            },
            data: {
                address: TEST_ADDRESS,
                name: 'webdom',
                last_updated_at: '2026-03-22T00:00:00Z',
                deploy_configs: {
                    ton_simple_sale: {
                        alias: 'ton_simple_sale',
                        code_hash: 'code-hash',
                        deploy_function_code_hash: 'deploy-code-hash',
                        deploy_type: 'sale',
                        deploy_fee: {
                            amount: '1500000000',
                            amount_decimal: 1.5,
                            decimals: 9,
                            currency: 'TON'
                        }
                    }
                },
                promotion_prices: {
                    move_up_price: {
                        amount: '1000',
                        amount_decimal: 1,
                        decimals: 3,
                        currency: 'WEB3'
                    },
                    period_prices: {
                        '86400': {
                            hot_price: {
                                amount: '2500',
                                amount_decimal: 2.5,
                                decimals: 3,
                                currency: 'WEB3'
                            },
                            colored_price: {
                                amount: '4000',
                                amount_decimal: 4,
                                decimals: 3,
                                currency: 'WEB3'
                            }
                        }
                    }
                }
            }
        },
        assertHighLevel(result: any) {
            expect(result.name).toBe('webdom');
            expect(result.deploy_configs.ton_simple_sale.deploy_fee.amount).toBe('1500000000');
            expect(result.promotion_prices.move_up_price.amount).toBe('1000');
            expect(result.promotion_prices.period_prices['86400'].hot_price.currency).toBe('WEB3');
        }
    },
    {
        name: 'market overview',
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/market/overview?domain_zone=ton',
        highLevelCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.api.analytics.getMarketOverview({ domain_zone: 'ton' }),
        rawCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.raw.analytics.getMarketOverview({ domain_zone: 'ton' }),
        response: {
            success: true,
            meta: {
                request_id: 'req-market-overview',
                api_version: '2026-03-22'
            },
            data: {
                snapshot_updated_at: '2026-03-22T00:00:00Z',
                domains_count: 1200,
                domains_on_sale_count: 315,
                domains_owners: 512,
                domains_statuses: {
                    expired: 5,
                    expiring_in_1_day: 7,
                    expiring_in_7_days: 20,
                    not_for_sale: 880,
                    on_auction: 40,
                    on_sale: 315
                }
            }
        },
        assertHighLevel(result: any) {
            expect(result.domains_count).toBe(1200);
            expect(result.domains_statuses.on_sale).toBe(315);
        }
    },
    {
        name: 'market charts',
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/market/charts?domain_zone=ton',
        highLevelCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.api.analytics.getMarketCharts({ domain_zone: 'ton' }),
        rawCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.raw.analytics.getMarketCharts({ domain_zone: 'ton' }),
        response: {
            success: true,
            meta: {
                request_id: 'req-market-charts',
                api_version: '2026-03-22'
            },
            data: {
                snapshot_updated_at: '2026-03-22T00:00:00Z',
                domains_length: {
                    '3': {
                        total_count: 10,
                        on_sale_count: 2,
                        floor_price_ton: 150,
                        average_price_ton: 210
                    }
                },
                total_sales_count: { TON: 15, USDT: 1, WEB3: 0 },
                total_sales_volume: { TON: 1250, USDT: 40, WEB3: 0 },
                primary_sales_count: { TON: 10, USDT: 0, WEB3: 0 },
                primary_sales_volume: { TON: 1000, USDT: 0, WEB3: 0 },
                secondary_sales_count: { TON: 5, USDT: 1, WEB3: 0 },
                secondary_sales_volume: { TON: 250, USDT: 40, WEB3: 0 },
                sales_count_in_7_days: { TON: 2, USDT: 0, WEB3: 0 },
                sales_count_in_30_days: { TON: 4, USDT: 0, WEB3: 0 },
                sales_count_in_60_days: { TON: 6, USDT: 1, WEB3: 0 },
                sales_count_in_90_days: { TON: 8, USDT: 1, WEB3: 0 },
                sales_count_in_1_year: { TON: 15, USDT: 1, WEB3: 0 },
                sales_volume_in_7_days: { TON: 30, USDT: 0, WEB3: 0 },
                sales_volume_in_30_days: { TON: 65, USDT: 0, WEB3: 0 },
                sales_volume_in_60_days: { TON: 125, USDT: 40, WEB3: 0 },
                sales_volume_in_90_days: { TON: 200, USDT: 40, WEB3: 0 },
                sales_volume_in_1_year: { TON: 1250, USDT: 40, WEB3: 0 },
                sales_history: { TON: [], USDT: [], WEB3: [] },
                mints_count_in_7_days: { TON: 1, USDT: 0, WEB3: 0 },
                mints_count_in_30_days: { TON: 2, USDT: 0, WEB3: 0 },
                mints_count_in_60_days: { TON: 3, USDT: 0, WEB3: 0 },
                mints_count_in_90_days: { TON: 5, USDT: 0, WEB3: 0 },
                mints_count_in_1_year: { TON: 10, USDT: 0, WEB3: 0 },
                mints_volume_in_7_days: { TON: 15, USDT: 0, WEB3: 0 },
                mints_volume_in_30_days: { TON: 30, USDT: 0, WEB3: 0 },
                mints_volume_in_60_days: { TON: 50, USDT: 0, WEB3: 0 },
                mints_volume_in_90_days: { TON: 70, USDT: 0, WEB3: 0 },
                mints_volume_in_1_year: { TON: 1000, USDT: 0, WEB3: 0 },
                mints_history: { TON: [], USDT: [], WEB3: [] }
            }
        },
        assertHighLevel(result: any) {
            expect(result.snapshot_updated_at).toBe('2026-03-22T00:00:00Z');
            expect(result.domains_length['3'].floor_price_ton).toBe(150);
            expect(result.total_sales_count.TON).toBe(15);
        }
    },
    {
        name: 'top sales',
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/market/top-sales?domain_zone=ton&sale_segment=secondary&limit=2',
        highLevelCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.api.analytics.listTopSales({
            domain_zone: 'ton',
            sale_segment: 'secondary',
            limit: 2
        }),
        rawCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.raw.analytics.listTopSales({
            domain_zone: 'ton',
            sale_segment: 'secondary',
            limit: 2
        }),
        response: {
            success: true,
            meta: {
                request_id: 'req-top-sales',
                api_version: '2026-03-22'
            },
            data: {
                items: [
                    {
                        domain_name: 'gold.ton',
                        currency: 'TON',
                        price_native: {
                            amount: '250000000000',
                            amount_decimal: 250,
                            decimals: 9,
                            currency: 'TON'
                        },
                        price_ton_normalized: '250000000000',
                        price_usdt_normalized: '50000000000',
                        price_web3_normalized: null,
                        seller_address: TEST_ADDRESS,
                        seller_nickname: 'seller',
                        buyer_address: TEST_ADDRESS,
                        buyer_nickname: 'buyer',
                        tx_hash: 'hash-1',
                        tx_timestamp: '2026-03-22T00:00:00Z'
                    }
                ],
                limit: 2,
                offset: 0,
                snapshot_updated_at: '2026-03-22T00:00:00Z',
                total_results: 1
            }
        },
        assertHighLevel(result: any) {
            expect(result.items[0].domain_name).toBe('gold.ton');
            expect(result.total_results).toBe(1);
        }
    },
    {
        name: 'user rankings',
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/users/rankings?rating=total_purchases_volume&limit=2',
        highLevelCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.api.analytics.listUserRankings({
            rating: 'total_purchases_volume',
            limit: 2
        }),
        rawCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.raw.analytics.listUserRankings({
            rating: 'total_purchases_volume',
            limit: 2
        }),
        response: {
            success: true,
            meta: {
                request_id: 'req-user-rankings',
                api_version: '2026-03-22'
            },
            data: {
                generated_at: '2026-03-22T00:00:00Z',
                items: [
                    {
                        rating_value: 420,
                        user: {
                            address: TEST_ADDRESS,
                            avatar_url: null,
                            last_linked_domain: 'gold.ton',
                            link: 'https://webdom.market/u/gold',
                            nickname: 'gold-holder',
                            stats: {
                                domains_count: 4,
                                primary_purchase_volume: null,
                                primary_purchases_count: 1,
                                sales_count: 2,
                                secondary_purchase_volume: null,
                                secondary_purchases_count: 1,
                                total_purchase_volume: null,
                                total_purchases_count: 2,
                                total_sale_volume: null
                            }
                        }
                    }
                ]
            }
        },
        assertHighLevel(result: any) {
            expect(result.items[0].rating_value).toBe(420);
            expect(result.items[0].user.nickname).toBe('gold-holder');
        }
    },
    {
        name: 'jetton prices',
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/prices/jettons',
        highLevelCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.api.analytics.getJettonPrices(),
        rawCall: (sdk: ReturnType<typeof createWebdomSdk>) => sdk.raw.analytics.getJettonPrices(),
        response: {
            success: true,
            meta: {
                request_id: 'req-jetton-prices',
                api_version: '2026-03-22'
            },
            data: {
                generated_at: '2026-03-22T00:00:00Z',
                source_timestamp: '2026-03-21T23:59:00Z',
                usdt_price_ton: 0.32,
                web3_price_ton: 1.75
            }
        },
        assertHighLevel(result: any) {
            expect(result.usdt_price_ton).toBe(0.32);
            expect(result.web3_price_ton).toBe(1.75);
        }
    }
] as const;

describe('api namespaces', () => {
    it('unwraps high-level responses and preserves raw envelopes', async () => {
        const seenUrls: string[] = [];
        const sdk = createWebdomSdk({
            fetch: async (input) => {
                seenUrls.push(String(input));

                if (String(input).includes('/catalog/domains')) {
                    return jsonResponse({
                        success: true,
                        meta: {
                            request_id: 'req-domains',
                            api_version: '2026-03-22'
                        },
                        page_info: {
                            next_cursor: 'cursor-2',
                            has_more: true
                        },
                        data: {
                            items: [
                                {
                                    name: 'gold.ton',
                                    relevance_score: '287385951250884900'
                                }
                            ]
                        }
                    });
                }

                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-domain'
                    },
                    data: {
                        name: 'gold.ton',
                        owner: TEST_ADDRESS,
                        relevance_score: '287385951250884900'
                    }
                });
            }
        });

        const domains = await sdk.api.catalog.listDomains({
            search: 'gold',
            regex: '^gold.*\\.ton$',
            limit: 1
        });
        const rawDomain = await sdk.raw.domains.get({
            domain_name: 'gold.ton'
        });

        expect(seenUrls[0]).toContain('/catalog/domains?search=gold&regex=%5Egold.*%5C.ton%24&limit=1');
        expect(domains.items[0]?.name).toBe('gold.ton');
        expect(domains.items[0]?.relevance_score).toBe('287385951250884900');
        expect(domains.pageInfo.nextCursor).toBe('cursor-2');
        expect(domains.meta.requestId).toBe('req-domains');
        expect(rawDomain.meta.request_id).toBe('req-domain');
        expect(rawDomain.data.owner).toBe(TEST_ADDRESS);
        expect(rawDomain.data.relevance_score).toBe('287385951250884900');
    });

    it.each(ANALYTICS_AND_MARKETPLACE_CASES)('covers %s via high-level and raw namespaces', async (testCase) => {
        const seenUrls: string[] = [];
        const sdk = createWebdomSdk({
            fetch: async (input) => {
                seenUrls.push(String(input));
                return jsonResponse(testCase.response);
            }
        });

        const result = await testCase.highLevelCall(sdk);
        const rawResult = await testCase.rawCall(sdk);

        expect(seenUrls).toEqual([
            testCase.expectedUrl,
            testCase.expectedUrl
        ]);
        testCase.assertHighLevel(result);
        expect(rawResult.meta.request_id).toBe(testCase.response.meta.request_id);
        expect(rawResult.data).toEqual(testCase.response.data);
    });

    it.each(CATALOG_CASES)('covers catalog %s via high-level and raw namespaces', async (testCase) => {
        const seenUrls: string[] = [];
        const sdk = createWebdomSdk({
            fetch: async (input) => {
                seenUrls.push(String(input));
                return jsonResponse(testCase.response);
            }
        });

        const result = await testCase.highLevelCall(sdk);
        const rawResult = await testCase.rawCall(sdk);

        expect(seenUrls).toEqual([
            testCase.expectedUrl,
            testCase.expectedUrl
        ]);
        testCase.assertHighLevel(result);
        expect(rawResult.meta.request_id).toBe(testCase.response.meta.request_id);
        expect(rawResult.data.items).toEqual(testCase.response.data.items);
        expect(rawResult.page_info).toEqual(testCase.response.page_info);
    });

    it('persists tokens through the auth client and sends auth headers on protected calls', async () => {
        let authorizationHeader: string | null = null;
        const sdk = createWebdomSdk({
            tokenStorage: createInMemoryTokenStorage(),
            fetch: async (_input, init) => {
                authorizationHeader = init?.headers instanceof Headers ? init.headers.get('Authorization') : null;

                if (init?.method === 'POST') {
                    return jsonResponse({
                        success: true,
                        meta: {
                            request_id: 'req-token'
                        },
                        data: {
                            access_token: 'persisted-token',
                            expires_at: '2026-03-22T00:00:00Z'
                        }
                    });
                }

                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-offers'
                    },
                    data: {
                        incoming: [],
                        outgoing: [],
                        generated_at: '2026-03-22T00:00:00Z'
                    }
                });
            }
        });

        await sdk.auth.exchangeTonProofForToken({
            challenge_id: 'challenge',
            wallet_address: TEST_ADDRESS,
            wallet_public_key: TEST_PUBLIC_KEY,
            proof: {
                timestamp: 1,
                domain: {
                    lengthBytes: 12,
                    value: 'example.com'
                },
                payload: 'payload',
                signature: 'signature'
            }
        });
        await sdk.api.offers.listMine();

        expect(await sdk.auth.getToken()).toBe('persisted-token');
        expect(authorizationHeader).toBe('Bearer persisted-token');
    });

    it('uses bearer auth on optional-auth user lookups only when a token exists', async () => {
        let authenticatedAuthorizationHeader: string | null = 'unset';
        let anonymousAuthorizationHeader: string | null = 'unset';

        const authenticatedSdk = createWebdomSdk({
            tokenStorage: createInMemoryTokenStorage('viewer-token'),
            fetch: async (_input, init) => {
                authenticatedAuthorizationHeader = init?.headers instanceof Headers ? init.headers.get('Authorization') : null;
                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-user-auth',
                        api_version: '2026-03-22'
                    },
                    data: {
                        address: TEST_ADDRESS,
                        nickname: 'viewer-aware'
                    }
                });
            }
        });

        const anonymousSdk = createWebdomSdk({
            tokenStorage: createInMemoryTokenStorage(),
            fetch: async (_input, init) => {
                anonymousAuthorizationHeader = init?.headers instanceof Headers ? init.headers.get('Authorization') : null;
                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-user-anon',
                        api_version: '2026-03-22'
                    },
                    data: {
                        address: TEST_ADDRESS,
                        nickname: 'anonymous'
                    }
                });
            }
        });

        const authenticatedUser = await authenticatedSdk.api.users.get({ address: TEST_ADDRESS });
        const anonymousUser = await anonymousSdk.api.users.get({ address: TEST_ADDRESS });

        expect(authenticatedAuthorizationHeader).toBe('Bearer viewer-token');
        expect(anonymousAuthorizationHeader).toBeNull();
        expect(authenticatedUser.nickname).toBe('viewer-aware');
        expect(anonymousUser.nickname).toBe('anonymous');
    });

    it('fails locally when an auth-required endpoint is called without a token', async () => {
        let fetchCalls = 0;
        const sdk = createWebdomSdk({
            tokenStorage: createInMemoryTokenStorage(),
            fetch: async () => {
                fetchCalls += 1;
                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'unexpected',
                        api_version: '2026-03-22'
                    },
                    data: {
                        incoming: [],
                        outgoing: [],
                        generated_at: '2026-03-22T00:00:00Z'
                    }
                });
            }
        });

        await expect(sdk.api.offers.listMine()).rejects.toMatchObject<WebdomApiError>({
            name: 'WebdomApiError',
            code: 'AUTH_TOKEN_MISSING',
            status: 401,
            retryable: false
        });
        expect(fetchCalls).toBe(0);
    });

    it('wraps fetch transport failures in WebdomApiError with cause', async () => {
        const rootCause = new TypeError('fetch failed');
        const sdk = createWebdomSdk({
            fetch: async () => {
                throw rootCause;
            }
        });

        try {
            await sdk.api.catalog.listDomains({ limit: 1 });
            throw new Error('Expected request to fail');
        } catch (error: unknown) {
            expect(error).toBeInstanceOf(WebdomApiError);
            expect(error).toMatchObject({
                code: 'NETWORK_ERROR',
                status: 0,
                retryable: true
            });
            expect((error as WebdomApiError).cause).toBe(rootCause);
        }
    });

    it('supports request timeouts and surfaces them as sdk errors', async () => {
        const sdk = createWebdomSdk({
            requestTimeoutMs: 10,
            fetch: async (_input, init) =>
                await new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener(
                        'abort',
                        () => reject(new DOMException('The operation was aborted.', 'AbortError')),
                        { once: true }
                    );
                })
        });

        await expect(sdk.api.catalog.listDomains({ limit: 1 })).rejects.toMatchObject({
            name: 'WebdomApiError',
            code: 'REQUEST_TIMEOUT',
            status: 408,
            retryable: true
        });
    });

    it('supports external abort signals and preserves the underlying cause', async () => {
        const controller = new AbortController();
        let seenSignal: AbortSignal | undefined;
        const rootCause = new DOMException('The operation was aborted.', 'AbortError');
        const sdk = createWebdomSdk({
            requestSignal: controller.signal,
            fetch: async (_input, init) =>
                await new Promise<Response>((_resolve, reject) => {
                    seenSignal = init?.signal;
                    init?.signal?.addEventListener('abort', () => reject(rootCause), { once: true });
                })
        });

        const request = sdk.api.catalog.listDomains({ limit: 1 });
        controller.abort(new Error('caller aborted'));

        try {
            await request;
            throw new Error('Expected request to abort');
        } catch (error: unknown) {
            expect(seenSignal).toBeDefined();
            expect(error).toBeInstanceOf(WebdomApiError);
            expect(error).toMatchObject({
                code: 'REQUEST_ABORTED',
                status: 0,
                retryable: true
            });
            expect((error as WebdomApiError).cause).toBe(rootCause);
        }
    });
});
