import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/cli';
import { resolveSdkOptions } from '../src/cli-lib/runtime/config';
import { TEST_ADDRESS, TEST_PRIVATE_KEY, TEST_PUBLIC_KEY, jsonResponse, trackTempPath } from './helpers';

const ANALYTICS_AND_MARKETPLACE_COMMAND_CASES = [
    {
        name: 'analytics.market-overview',
        args: ['analytics.market-overview', '--domain-zone', 'ton'],
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/market/overview?domain_zone=ton',
        response: {
            success: true,
            meta: { request_id: 'req-market-overview', api_version: '2026-03-22' },
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
        assertOutput(output: any) {
            expect(output.domains_count).toBe(1200);
            expect(output.domains_statuses.on_sale).toBe(315);
        }
    },
    {
        name: 'analytics.market-charts',
        args: ['analytics.market-charts', '--domain-zone', 'ton'],
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/market/charts?domain_zone=ton',
        response: {
            success: true,
            meta: { request_id: 'req-market-charts', api_version: '2026-03-22' },
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
        assertOutput(output: any) {
            expect(output.domains_length['3'].floor_price_ton).toBe(150);
            expect(output.total_sales_count.TON).toBe(15);
        }
    },
    {
        name: 'analytics.top-sales',
        args: ['analytics.top-sales', '--domain-zone', 'ton', '--sale-segment', 'secondary', '--limit', '2'],
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/market/top-sales?domain_zone=ton&sale_segment=secondary&limit=2',
        response: {
            success: true,
            meta: { request_id: 'req-top-sales', api_version: '2026-03-22' },
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
        assertOutput(output: any) {
            expect(output.items[0].domain_name).toBe('gold.ton');
            expect(output.total_results).toBe(1);
        }
    },
    {
        name: 'analytics.user-rankings',
        args: ['analytics.user-rankings', '--rating', 'total_purchases_volume', '--limit', '2'],
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/users/rankings?rating=total_purchases_volume&limit=2',
        response: {
            success: true,
            meta: { request_id: 'req-user-rankings', api_version: '2026-03-22' },
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
        assertOutput(output: any) {
            expect(output.items[0].rating_value).toBe(420);
            expect(output.items[0].user.nickname).toBe('gold-holder');
        }
    },
    {
        name: 'analytics.jetton-prices',
        args: ['analytics.jetton-prices'],
        expectedUrl: 'https://webdom.market/api/agent/v1/analytics/prices/jettons',
        response: {
            success: true,
            meta: { request_id: 'req-jetton-prices', api_version: '2026-03-22' },
            data: {
                generated_at: '2026-03-22T00:00:00Z',
                source_timestamp: '2026-03-21T23:59:00Z',
                usdt_price_ton: 0.32,
                web3_price_ton: 1.75
            }
        },
        assertOutput(output: any) {
            expect(output.usdt_price_ton).toBe(0.32);
            expect(output.web3_price_ton).toBe(1.75);
        }
    },
    {
        name: 'marketplace.config',
        args: ['marketplace.config'],
        expectedUrl: 'https://webdom.market/api/agent/v1/marketplace/config',
        response: {
            success: true,
            meta: { request_id: 'req-marketplace-config', api_version: '2026-03-22' },
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
                }
            }
        },
        assertOutput(output: any) {
            expect(output.name).toBe('webdom');
            expect(output.deploy_configs.ton_simple_sale.deploy_fee.amount).toBe('1500000000');
        }
    }
] as const;

describe('cli', () => {
    it('runs namespaced commands against token storage', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'webdom-sdk-'));
        const tokenFile = path.join(tempDir, 'token.txt');
        trackTempPath(tempDir);
        await fs.writeFile(tokenFile, 'cli-token', 'utf8');

        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(
            ['auth.token.get', '--token-file', tokenFile],
            {
                stdout: (value) => stdout.push(value),
                stderr: (value) => stderr.push(value)
            }
        );

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);
        expect(stdout.join('')).toContain('"cli-token"');
    });

    it.each(ANALYTICS_AND_MARKETPLACE_COMMAND_CASES)('covers %s command routing and output', async (testCase) => {
        const seenUrls: string[] = [];
        globalThis.fetch = async (input) => {
            seenUrls.push(String(input));
            return jsonResponse(testCase.response);
        };

        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(testCase.args as string[], {
            stdout: (value) => stdout.push(value),
            stderr: (value) => stderr.push(value)
        });

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);
        expect(seenUrls).toEqual([testCase.expectedUrl]);
        testCase.assertOutput(JSON.parse(stdout.join('')));
    });

    it('supports scalar json payloads for token helpers', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'webdom-sdk-'));
        const tokenFile = path.join(tempDir, 'token.txt');
        trackTempPath(tempDir);

        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(
            ['auth.token.set', '--token-file', tokenFile, '--json', '"cli-token"'],
            {
                stdout: (value) => stdout.push(value),
                stderr: (value) => stderr.push(value)
            }
        );

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);
        expect(stdout.join('')).toContain('null');
        expect(await fs.readFile(tokenFile, 'utf8')).toBe('cli-token');
    });

    it('resolves sdk option precedence as CLI > config > env > defaults', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'webdom-sdk-'));
        const configFile = path.join(tempDir, 'sdk-config.json');
        trackTempPath(tempDir);
        await fs.writeFile(
            configFile,
            JSON.stringify({
                apiBaseUrl: 'https://config.example/api',
                toncenterEndpoint: 'https://config-toncenter.example'
            }),
            'utf8'
        );

        process.env.WEBDOM_API_BASE_URL = 'https://env.example/api';
        process.env.WEBDOM_TONCENTER_ENDPOINT = 'https://env-toncenter.example';

        const options = await resolveSdkOptions({
            config: configFile,
            'api-base-url': 'https://cli.example/api'
        });

        expect(options.apiBaseUrl).toBe('https://cli.example/api');
        expect(options.toncenterEndpoint).toBe('https://config-toncenter.example');
    });

    it('authenticates from ENV and reuses the persisted token file for protected commands', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'webdom-sdk-'));
        const tokenFile = path.join(tempDir, 'token.txt');
        trackTempPath(tempDir);

        process.env.WEBDOM_AGENT_TOKEN_FILE = tokenFile;
        process.env.WEBDOM_WALLET_PRIVATE_KEY = TEST_PRIVATE_KEY;
        process.env.WEBDOM_WALLET_PUBLIC_KEY = TEST_PUBLIC_KEY;
        process.env.WEBDOM_WALLET_ADDRESS = TEST_ADDRESS;

        let authorizationHeader: string | null = null;
        globalThis.fetch = async (input, init) => {
            const url = String(input);
            authorizationHeader = init?.headers instanceof Headers ? init.headers.get('Authorization') : null;

            if (url.includes('/auth/ton-proof/payload')) {
                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-challenge'
                    },
                    data: {
                        challenge_id: 'challenge-1',
                        payload: 'payload-1',
                        issued_at: '2026-03-22T00:00:00Z',
                        expires_at: '2026-03-22T00:05:00Z'
                    }
                });
            }

            if (url.includes('/auth/ton-proof/tokens')) {
                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-token'
                    },
                    data: {
                        access_token: 'cli-auth-token',
                        expires_at: '2026-03-22T01:00:00Z'
                    }
                });
            }

            if (url.includes('/offers/my')) {
                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-offers'
                    },
                    data: {
                        incoming: [],
                        outgoing: [],
                        generated_at: '2026-03-22T01:00:00Z'
                    }
                });
            }

            throw new Error(`Unexpected fetch url: ${url}`);
        };

        const authStdout: string[] = [];
        const authStderr: string[] = [];
        const authExitCode = await runCli(['auth.authenticate'], {
            stdout: (value) => authStdout.push(value),
            stderr: (value) => authStderr.push(value)
        });

        expect(authExitCode).toBe(0);
        expect(authStderr).toEqual([]);
        expect(authStdout.join('')).toContain('"access_token":"cli-auth-token"');
        expect(await fs.readFile(tokenFile, 'utf8')).toBe('cli-auth-token');

        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(['offers.list-mine'], {
            stdout: (value) => stdout.push(value),
            stderr: (value) => stderr.push(value)
        });

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);
        expect(stdout.join('')).toContain('"incoming":[]');
        expect(authorizationHeader).toBe('Bearer cli-auth-token');
    });


    it('fails locally for auth-required commands when no token is configured', async () => {
        let fetchCalls = 0;
        globalThis.fetch = async () => {
            fetchCalls += 1;
            return jsonResponse({
                success: true,
                meta: {
                    request_id: 'unexpected'
                },
                data: {
                    incoming: [],
                    outgoing: [],
                    generated_at: '2026-03-22T01:00:00Z'
                }
            });
        };

        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(['offers.list-mine'], {
            stdout: (value) => stdout.push(value),
            stderr: (value) => stderr.push(value)
        });

        expect(exitCode).toBe(1);
        expect(stdout).toEqual([]);
        expect(fetchCalls).toBe(0);
        expect(JSON.parse(stderr.join(''))).toMatchObject({
            code: 'AUTH_TOKEN_MISSING',
            status: 401,
            retryable: false
        });
    });

    it('lists workflow and api commands for discovery', async () => {
        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(['commands'], {
            stdout: (value) => stdout.push(value),
            stderr: (value) => stderr.push(value)
        });

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);

        const commands = JSON.parse(stdout.join('')) as Array<{ name: string; layer: string }>;
        expect(commands.some((command) => command.name === 'find-domain' && command.layer === 'workflow')).toBe(true);
        expect(commands.some((command) => command.name === 'domains.get' && command.layer === 'api')).toBe(true);
    });

    it('returns machine-readable schema metadata', async () => {
        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(['schema', 'find-domain'], {
            stdout: (value) => stdout.push(value),
            stderr: (value) => stderr.push(value)
        });

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);

        const schema = JSON.parse(stdout.join('')) as {
            name: string;
            input_schema: { properties: Record<string, unknown> };
        };
        expect(schema.name).toBe('find-domain');
        expect(schema.input_schema.properties.query).toBeDefined();
    });

    it('renders human help for one command', async () => {
        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(['help', 'find-domain'], {
            stdout: (value) => stdout.push(value),
            stderr: (value) => stderr.push(value)
        });

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);
        expect(stdout.join('')).toContain('find-domain');
        expect(stdout.join('')).toContain('--query <string>');
    });

    it('supports stdin JSON plus --select for workflow commands', async () => {
        globalThis.fetch = async (input) => {
            if (String(input).includes('/domains/gold.ton')) {
                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-domain'
                    },
                    data: {
                        name: 'gold.ton',
                        owner: TEST_ADDRESS
                    }
                });
            }

            throw new Error(`Unexpected fetch url: ${String(input)}`);
        };

        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(['get-domain', '--input', '-', '--select', 'owner'], {
            stdout: (value) => stdout.push(value),
            stderr: (value) => stderr.push(value),
            stdin: async () => '{"domain":"gold.ton"}'
        });

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);
        expect(stdout.join('')).toBe(`"${TEST_ADDRESS}"\n`);
    });

    it('supports jsonl output for selected arrays', async () => {
        globalThis.fetch = async (input) => {
            if (String(input).includes('/catalog/domains')) {
                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-domains'
                    },
                    page_info: {
                        next_cursor: null,
                        has_more: false
                    },
                    data: {
                        items: [
                            { name: 'gold.ton' },
                            { name: 'silver.ton' }
                        ]
                    }
                });
            }

            throw new Error(`Unexpected fetch url: ${String(input)}`);
        };

        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(['find-domain', '--query', 'ton', '--select', 'items', '--jsonl'], {
            stdout: (value) => stdout.push(value),
            stderr: (value) => stderr.push(value)
        });

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);
        expect(stdout).toEqual(['{"name":"gold.ton"}\n', '{"name":"silver.ton"}\n']);
    });

    it('preserves string numeric query params without lossy coercion', async () => {
        const seenUrls: string[] = [];
        globalThis.fetch = async (input) => {
            seenUrls.push(String(input));

            return jsonResponse({
                success: true,
                meta: {
                    request_id: 'req-domains'
                },
                page_info: {
                    next_cursor: null,
                    has_more: false
                },
                data: {
                    items: []
                }
            });
        };

        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(
            ['catalog.list-domains', '--price-ton-min', '9007199254740993', '--limit', '5'],
            {
                stdout: (value) => stdout.push(value),
                stderr: (value) => stderr.push(value)
            }
        );

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);
        expect(stdout.join('')).toContain('"items":[]');
        expect(seenUrls[0]).toContain('price_ton_min=9007199254740993');
        expect(seenUrls[0]).toContain('limit=5');
    });

    it('builds workflow tx messages without sending them', async () => {
        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(
            ['build-purchase-tx', '--sale-address', TEST_ADDRESS, '--price', '1500000000'],
            {
                stdout: (value) => stdout.push(value),
                stderr: (value) => stderr.push(value)
            }
        );

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);

        const tx = JSON.parse(stdout.join('')) as {
            messages: Array<{ address: string }>;
            meta?: { kind?: string };
        };
        expect(tx.messages[0]?.address).toBe(TEST_ADDRESS);
        expect(tx.meta?.kind).toBe('PurchaseTonSimpleSale');
    });
});
