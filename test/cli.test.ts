import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { TonClient4 } from '@ton/ton';
import { describe, expect, it } from 'vitest';

import { runCli } from '../src/cli';
import { resolveSdkOptions } from '../src/cli-lib/runtime/config';
import { prepareCommandInput } from '../src/cli-lib/runtime/input';
import { resolveCliCommand } from '../src/cli-lib/registry';
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
        assertOutput(output: any) {
            expect(output.name).toBe('webdom');
            expect(output.deploy_configs.ton_simple_sale.deploy_fee.amount).toBe('1500000000');
            expect(output.promotion_prices.move_up_price.currency).toBe('WEB3');
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

    it('reads wallet balances through workflow commands', async () => {
        const originalGetLastBlock = TonClient4.prototype.getLastBlock;
        const originalGetAccount = TonClient4.prototype.getAccount;
        const originalRunMethod = TonClient4.prototype.runMethod;

        TonClient4.prototype.getLastBlock = async function () {
            return { last: { seqno: 777 } } as any;
        };
        TonClient4.prototype.getAccount = async function (_seqno, address) {
            const normalized = address.toString();

            if (normalized === TEST_ADDRESS) {
                return {
                    account: {
                        balance: { coins: '2500000000' },
                        state: { type: 'active' }
                    }
                } as any;
            }

            return {
                account: {
                    balance: { coins: '0' },
                    state: { type: 'active' }
                }
            } as any;
        };
        TonClient4.prototype.runMethod = async function (_seqno, address, method) {
            const normalized = address.toString();

            if (method === 'get_wallet_address') {
                if (normalized === 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs') {
                    return {
                        reader: {
                            readAddress() {
                                return { toString: () => 'EQAYqo4u7VF0fa4DPAebk4g9lBytj2VFny7pzXR0trjtXQaO' };
                            }
                        }
                    } as any;
                }

                if (normalized === 'EQBtcL4JA-PdPiUkB8utHcqdaftmUSTqdL8Z1EeXePLti_nK') {
                    return {
                        reader: {
                            readAddress() {
                                return { toString: () => 'EQA_Au61onx7O5q1C2Q92S2bMaEL5v96HAYH4fjms1NIERVE' };
                            }
                        }
                    } as any;
                }
            }

            if (method === 'get_wallet_data') {
                if (normalized === 'EQAYqo4u7VF0fa4DPAebk4g9lBytj2VFny7pzXR0trjtXQaO') {
                    return {
                        reader: {
                            readBigNumber() {
                                return 1230000n;
                            }
                        }
                    } as any;
                }

                if (normalized === 'EQA_Au61onx7O5q1C2Q92S2bMaEL5v96HAYH4fjms1NIERVE') {
                    return {
                        reader: {
                            readBigNumber() {
                                return 9876n;
                            }
                        }
                    } as any;
                }
            }

            throw new Error(`Unexpected runMethod ${method} for ${normalized}`);
        };

        try {
            const stdout: string[] = [];
            const stderr: string[] = [];
            const exitCode = await runCli(['get-wallet-balances', '--address', TEST_ADDRESS], {
                stdout: (value) => stdout.push(value),
                stderr: (value) => stderr.push(value)
            });

            expect(exitCode).toBe(0);
            expect(stderr).toEqual([]);

            const output = JSON.parse(stdout.join(''));
            expect(output.owner_address).toBe(TEST_ADDRESS);
            expect(output.ton.amount).toBe('2500000000');
            expect(output.ton.amount_decimal).toBe('2.5');
            expect(output.ton.owner_address).toBeUndefined();
            expect(output.usdt.amount_decimal).toBe('1.23');
            expect(output.web3.amount_decimal).toBe('9.876');
        } finally {
            TonClient4.prototype.getLastBlock = originalGetLastBlock;
            TonClient4.prototype.getAccount = originalGetAccount;
            TonClient4.prototype.runMethod = originalRunMethod;
        }
    });

    it('routes build-sale-tx to the TON sale deploy builder', async () => {
        const command = resolveCliCommand('build-sale-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                user_address: TEST_ADDRESS,
                domain_address: TEST_ADDRESS,
                domain_name: 'gold.ton',
                currency: 'TON',
                price: '1000000000',
                valid_until: '1700000000'
            },
            undefined,
            {}
        );

        const deployTonSimple = async (args: unknown) => ({ route: 'ton-sale', args });
        const deployJettonSimple = async (_args: unknown) => ({ route: 'jetton-sale' });
        const result = await command!.handler({
            tx: {
                sales: {
                    deployTonSimple,
                    deployJettonSimple
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'ton-sale',
            args: {
                userAddress: TEST_ADDRESS,
                domainAddress: TEST_ADDRESS,
                domainName: 'gold.ton',
                price: 1000000000n,
                validUntil: 1700000000,
                autoRenewCooldown: undefined,
                autoRenewIterations: undefined,
                queryId: undefined
            }
        });
    });

    it('routes build-sale-tx to the jetton sale deploy builder for USDT', async () => {
        const command = resolveCliCommand('build-sale-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                user_address: TEST_ADDRESS,
                domain_address: TEST_ADDRESS,
                domain_name: 'gold.ton',
                currency: 'USDT',
                price: '1000000',
                valid_until: '1700000000'
            },
            undefined,
            {}
        );

        const deployJettonSimple = async (args: unknown) => ({ route: 'jetton-sale', args });
        const result = await command!.handler({
            tx: {
                sales: {
                    deployTonSimple: async (_args: unknown) => ({ route: 'ton-sale' }),
                    deployJettonSimple
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'jetton-sale',
            args: {
                userAddress: TEST_ADDRESS,
                domainAddress: TEST_ADDRESS,
                domainName: 'gold.ton',
                price: 1000000n,
                validUntil: 1700000000,
                autoRenewCooldown: undefined,
                autoRenewIterations: undefined,
                queryId: undefined,
                isWeb3: false
            }
        });
    });

    it('routes build-offer-tx to the TON offer deploy builder', async () => {
        const command = resolveCliCommand('build-offer-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                domain_name: 'gold.ton',
                seller_address: TEST_ADDRESS,
                currency: 'TON',
                price: '1000000000',
                valid_until: '1700000000'
            },
            undefined,
            {}
        );

        const deployTonSimple = async (args: unknown) => ({ route: 'ton-offer', args });
        const result = await command!.handler({
            tx: {
                offers: {
                    deployTonSimple,
                    deployJettonSimple: async (_args: unknown) => ({ route: 'jetton-offer' })
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'ton-offer',
            args: {
                domainName: 'gold.ton',
                sellerAddress: TEST_ADDRESS,
                price: 1000000000n,
                validUntil: 1700000000,
                commission: undefined,
                queryId: undefined,
                notifySeller: undefined
            }
        });
    });

    it('requires user_address for jetton offer deployment', async () => {
        const command = resolveCliCommand('build-offer-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                domain_name: 'gold.ton',
                seller_address: TEST_ADDRESS,
                currency: 'USDT',
                price: '1000000',
                valid_until: '1700000000'
            },
            undefined,
            {}
        );

        await expect(command!.handler({
            tx: {
                offers: {
                    deployTonSimple: async (_args: unknown) => ({ route: 'ton-offer' }),
                    deployJettonSimple: async (_args: unknown) => ({ route: 'jetton-offer' })
                }
            }
        } as any, input, { registry: [] })).rejects.toThrow('Missing required parameter "user_address" for command build-offer-tx');
    });

    it('routes build-auction-tx to the jetton auction deploy builder for WEB3', async () => {
        const command = resolveCliCommand('build-auction-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                user_address: TEST_ADDRESS,
                domain_address: TEST_ADDRESS,
                domain_name: 'gold.ton',
                currency: 'WEB3',
                start_time: '1700000000',
                end_time: '1700600000',
                min_bid_value: '1000',
                max_bid_value: '100000',
                min_bid_increment: '5',
                time_increment: '300'
            },
            undefined,
            {}
        );

        const deployJettonSimple = async (args: unknown) => ({ route: 'jetton-auction', args });
        const result = await command!.handler({
            tx: {
                auctions: {
                    deployTonSimple: async (_args: unknown) => ({ route: 'ton-auction' }),
                    deployJettonSimple
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'jetton-auction',
            args: {
                userAddress: TEST_ADDRESS,
                domainAddress: TEST_ADDRESS,
                domainName: 'gold.ton',
                startTime: 1700000000,
                endTime: 1700600000,
                minBidValue: 1000n,
                maxBidValue: 100000n,
                minBidIncrement: 5,
                timeIncrement: 300,
                isDeferred: undefined,
                queryId: undefined,
                isWeb3: true
            }
        });
    });

    it('routes build-cancel-deal-tx to simple sale cancellation by default', async () => {
        const command = resolveCliCommand('build-cancel-deal-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                deal_type: 'sale',
                deal_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        const cancel = async (args: unknown) => ({ route: 'cancel-sale', args });
        const result = await command!.handler({
            api: {
                deals: {
                    get: async () => ({
                        domain_names: ['gold.ton'],
                        marketplace: {
                            name: 'webdom'
                        }
                    })
                }
            },
            tx: {
                sales: {
                    cancel,
                    cancelTonMultiple: async (_args: unknown) => ({ route: 'cancel-multiple-sale' })
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'cancel-sale',
            args: {
                saleAddress: TEST_ADDRESS,
                isGetgems: false
            }
        });
    });

    it('routes build-cancel-deal-tx to external sale cancellation for non-webdom marketplaces', async () => {
        const command = resolveCliCommand('build-cancel-deal-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                deal_type: 'sale',
                deal_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        const cancel = async (args: unknown) => ({ route: 'cancel-sale', args });
        const result = await command!.handler({
            api: {
                deals: {
                    get: async () => ({
                        domain_names: ['gold.ton'],
                        marketplace: {
                            name: 'fragment'
                        }
                    })
                }
            },
            tx: {
                sales: {
                    cancel,
                    cancelTonMultiple: async (_args: unknown) => ({ route: 'cancel-multiple-sale' })
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'cancel-sale',
            args: {
                saleAddress: TEST_ADDRESS,
                isGetgems: true
            }
        });
    });

    it('routes build-cancel-deal-tx to multiple sale cancellation when deal contains multiple domains', async () => {
        const command = resolveCliCommand('build-cancel-deal-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                deal_type: 'sale',
                deal_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        const cancelTonMultiple = async (args: unknown) => ({ route: 'cancel-multiple-sale', args });
        const result = await command!.handler({
            api: {
                deals: {
                    get: async () => ({
                        domain_names: ['gold.ton', 'web3.ton', 'rare.ton'],
                        marketplace: {
                            name: 'webdom'
                        }
                    })
                }
            },
            tx: {
                sales: {
                    cancel: async (_args: unknown) => ({ route: 'cancel-sale' }),
                    cancelTonMultiple
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'cancel-multiple-sale',
            args: {
                saleAddress: TEST_ADDRESS,
                domainsNumber: 3
            }
        });
    });

    it('routes build-cancel-deal-tx to TON offer cancellation', async () => {
        const command = resolveCliCommand('build-cancel-deal-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                deal_type: 'offer',
                deal_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        const cancelTonSimple = async (args: unknown) => ({ route: 'cancel-ton-offer', args });
        const result = await command!.handler({
            api: {
                offers: {
                    get: async () => ({
                        pricing: {
                            price: {
                                currency: 'TON'
                            }
                        }
                    })
                }
            },
            tx: {
                offers: {
                    cancelTonSimple,
                    cancelJettonSimple: async (_args: unknown) => ({ route: 'cancel-jetton-offer' })
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'cancel-ton-offer',
            args: {
                offerAddress: TEST_ADDRESS,
                cancellationComment: undefined,
                queryId: undefined
            }
        });
    });

    it('routes build-cancel-deal-tx to jetton offer cancellation for USDT', async () => {
        const command = resolveCliCommand('build-cancel-deal-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                deal_type: 'offer',
                deal_address: TEST_ADDRESS,
                cancellation_comment: 'cancel'
            },
            undefined,
            {}
        );

        const cancelJettonSimple = async (args: unknown) => ({ route: 'cancel-jetton-offer', args });
        const result = await command!.handler({
            api: {
                offers: {
                    get: async () => ({
                        pricing: {
                            price: {
                                currency: 'USDT'
                            }
                        }
                    })
                }
            },
            tx: {
                offers: {
                    cancelTonSimple: async (_args: unknown) => ({ route: 'cancel-ton-offer' }),
                    cancelJettonSimple
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'cancel-jetton-offer',
            args: {
                offerAddress: TEST_ADDRESS,
                cancellationComment: 'cancel',
                queryId: undefined
            }
        });
    });

    it('routes build-cancel-deal-tx to webdom auction stop without getgems flags', async () => {
        const command = resolveCliCommand('build-cancel-deal-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                deal_type: 'auction',
                deal_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        const stop = async (args: unknown) => ({ route: 'cancel-auction', args });
        const result = await command!.handler({
            api: {
                deals: {
                    get: async () => ({
                        marketplace: {
                            name: 'webdom'
                        }
                    })
                }
            },
            tx: {
                auctions: {
                    stop
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'cancel-auction',
            args: {
                auctionAddress: TEST_ADDRESS,
                isGetgems: false,
                isV4: false
            }
        });
    });

    it('routes build-cancel-deal-tx to external v4 auction stop after on-chain detection', async () => {
        const command = resolveCliCommand('build-cancel-deal-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                deal_type: 'auction',
                deal_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        const stop = async (args: unknown) => ({ route: 'cancel-auction', args });
        const result = await command!.handler({
            api: {
                deals: {
                    get: async () => ({
                        marketplace: {
                            name: 'fragment'
                        }
                    })
                }
            },
            context: {
                getTonClient: () => ({
                    getLastBlock: async () => ({
                        last: {
                            seqno: 1
                        }
                    }),
                    runMethod: async (_seqno: number, _address: unknown, method: string) => {
                        if (method === 'get_auction_data_v4') {
                            return { exitCode: 0 };
                        }
                        throw new Error(`unexpected method ${method}`);
                    }
                })
            },
            tx: {
                auctions: {
                    stop
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'cancel-auction',
            args: {
                auctionAddress: TEST_ADDRESS,
                isGetgems: true,
                isV4: true
            }
        });
    });

    it('falls back to legacy external auction stop when v4 method returns a non-zero exit code', async () => {
        const command = resolveCliCommand('build-cancel-deal-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                deal_type: 'auction',
                deal_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        const stop = async (args: unknown) => ({ route: 'cancel-auction', args });
        const result = await command!.handler({
            api: {
                deals: {
                    get: async () => ({
                        marketplace: {
                            name: 'fragment'
                        }
                    })
                }
            },
            context: {
                getTonClient: () => ({
                    getLastBlock: async () => ({
                        last: {
                            seqno: 1
                        }
                    }),
                    runMethod: async (_seqno: number, _address: unknown, method: string) => {
                        if (method === 'get_auction_data_v4') {
                            return { exitCode: 2 };
                        }
                        if (method === 'get_auction_data') {
                            return { exitCode: 0 };
                        }
                        throw new Error(`unexpected method ${method}`);
                    }
                })
            },
            tx: {
                auctions: {
                    stop
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'cancel-auction',
            args: {
                auctionAddress: TEST_ADDRESS,
                isGetgems: true,
                isV4: false
            }
        });
    });

    it('routes build-accept-offer-tx without Telegram username flag', async () => {
        const command = resolveCliCommand('build-accept-offer-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                domain_address: TEST_ADDRESS,
                offer_address: TEST_ADDRESS,
                user_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        const acceptPurchase = async (args: unknown) => ({ route: 'accept-offer', args });
        const result = await command!.handler({
            tx: {
                offers: {
                    acceptPurchase
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'accept-offer',
            args: {
                domainAddress: TEST_ADDRESS,
                offerAddress: TEST_ADDRESS,
                userAddress: TEST_ADDRESS,
                queryId: undefined
            }
        });
    });

    it('routes build-change-offer-price-tx to TON offer price change', async () => {
        const command = resolveCliCommand('build-change-offer-price-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                offer_address: TEST_ADDRESS,
                commission_rate: '0.05',
                new_price: '2000000000',
                new_valid_until: '1700600000'
            },
            undefined,
            {}
        );

        const changeTonSimplePrice = async (args: unknown) => ({ route: 'change-ton-offer-price', args });
        const result = await command!.handler({
            api: {
                offers: {
                    get: async () => ({
                        pricing: {
                            price: {
                                amount: '1000000000',
                                currency: 'TON'
                            }
                        }
                    })
                }
            },
            tx: {
                offers: {
                    changeTonSimplePrice,
                    changeJettonSimplePrice: async (_args: unknown) => ({ route: 'change-jetton-offer-price' })
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'change-ton-offer-price',
            args: {
                offerAddress: TEST_ADDRESS,
                oldPrice: 1000000000n,
                commissionRate: 0.05,
                newPrice: 2000000000n,
                newValidUntil: 1700600000,
                notifySeller: true,
                queryId: undefined,
                afterCounterproposal: undefined
            }
        });
    });

    it('routes build-change-offer-price-tx to jetton offer price change for USDT', async () => {
        const command = resolveCliCommand('build-change-offer-price-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                offer_address: TEST_ADDRESS,
                user_address: TEST_ADDRESS,
                commission_rate: '0.05',
                new_price: '2000000',
                new_valid_until: '1700600000',
                notify_seller: 'false'
            },
            undefined,
            {}
        );

        const changeJettonSimplePrice = async (args: unknown) => ({ route: 'change-jetton-offer-price', args });
        const result = await command!.handler({
            api: {
                offers: {
                    get: async () => ({
                        pricing: {
                            price: {
                                amount: '1000000',
                                currency: 'USDT'
                            }
                        }
                    })
                }
            },
            tx: {
                offers: {
                    changeTonSimplePrice: async (_args: unknown) => ({ route: 'change-ton-offer-price' }),
                    changeJettonSimplePrice
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'change-jetton-offer-price',
            args: {
                offerAddress: TEST_ADDRESS,
                oldPrice: 1000000n,
                commissionRate: 0.05,
                newPrice: 2000000n,
                newValidUntil: 1700600000,
                notifySeller: false,
                queryId: undefined,
                afterCounterproposal: undefined,
                userAddress: TEST_ADDRESS,
                jettonWalletAddress: undefined
            }
        });
    });

    it('rejects out-of-range commission_rate values for build-change-offer-price-tx', async () => {
        const command = resolveCliCommand('build-change-offer-price-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                offer_address: TEST_ADDRESS,
                commission_rate: '500',
                new_price: '2000000000',
                new_valid_until: '1700600000'
            },
            undefined,
            {}
        );

        await expect(command!.handler({
            api: {
                offers: {
                    get: async () => ({
                        pricing: {
                            price: {
                                amount: '1000000000',
                                currency: 'TON'
                            }
                        }
                    })
                }
            },
            tx: {
                offers: {
                    changeTonSimplePrice: async (_args: unknown) => ({ route: 'change-ton-offer-price' }),
                    changeJettonSimplePrice: async (_args: unknown) => ({ route: 'change-jetton-offer-price' })
                }
            }
        } as any, input, { registry: [] })).rejects.toThrow(
            'commission_rate must be a fraction between 0 and 1 for command build-change-offer-price-tx (for example 0.05 for 5%)'
        );
    });

    it('runs build-change-offer-price-tx end-to-end through runCli', async () => {
        const seenUrls: string[] = [];
        globalThis.fetch = async (input) => {
            const url = String(input);
            seenUrls.push(url);

            if (url.endsWith(`/offers/${TEST_ADDRESS}`)) {
                return jsonResponse({
                    success: true,
                    meta: {
                        request_id: 'req-offer'
                    },
                    data: {
                        pricing: {
                            price: {
                                amount: '1000000000',
                                currency: 'TON'
                            }
                        }
                    }
                });
            }

            throw new Error(`Unexpected fetch url: ${url}`);
        };

        const stdout: string[] = [];
        const stderr: string[] = [];
        const exitCode = await runCli(
            [
                'build-change-offer-price-tx',
                '--offer-address', TEST_ADDRESS,
                '--commission-rate', '0.05',
                '--new-price', '2000000000',
                '--new-valid-until', '1700600000'
            ],
            {
                stdout: (value) => stdout.push(value),
                stderr: (value) => stderr.push(value)
            }
        );

        expect(exitCode).toBe(0);
        expect(stderr).toEqual([]);
        expect(seenUrls).toEqual([`https://webdom.market/api/agent/v1/offers/${encodeURIComponent(TEST_ADDRESS)}`]);

        const output = JSON.parse(stdout.join(''));
        expect(output.meta.kind).toBe('ChangeTonSimpleOfferPrice');
        expect(output.messages[0].address).toBe(TEST_ADDRESS);
    });

    it('routes build-promote-sale-tx to marketplace move-up', async () => {
        const command = resolveCliCommand('build-promote-sale-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                promotion_type: 'move_up',
                user_address: TEST_ADDRESS,
                sale_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        const moveUpSale = async (args: unknown) => ({ route: 'move-up-sale', args });
        const result = await command!.handler({
            api: {
                marketplace: {
                    getConfig: async () => ({
                        promotion_prices: {
                            move_up_price: {
                                amount: '1000'
                            },
                            period_prices: {}
                        }
                    })
                }
            },
            tx: {
                marketplace: {
                    moveUpSale
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'move-up-sale',
            args: {
                userAddress: TEST_ADDRESS,
                saleAddress: TEST_ADDRESS,
                price: 1000n,
                web3WalletAddress: undefined,
                queryId: undefined
            }
        });
    });

    it('routes build-promote-sale-tx to marketplace hot promotion', async () => {
        const command = resolveCliCommand('build-promote-sale-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                promotion_type: 'hot',
                user_address: TEST_ADDRESS,
                sale_address: TEST_ADDRESS,
                period: '86400'
            },
            undefined,
            {}
        );

        const makeHotSale = async (args: unknown) => ({ route: 'make-hot-sale', args });
        const result = await command!.handler({
            api: {
                marketplace: {
                    getConfig: async () => ({
                        promotion_prices: {
                            move_up_price: {
                                amount: '1000'
                            },
                            period_prices: {
                                '86400': {
                                    hot_price: {
                                        amount: '2500'
                                    },
                                    colored_price: {
                                        amount: '4000'
                                    }
                                }
                            }
                        }
                    })
                }
            },
            tx: {
                marketplace: {
                    makeHotSale
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'make-hot-sale',
            args: {
                userAddress: TEST_ADDRESS,
                saleAddress: TEST_ADDRESS,
                price: 2500n,
                period: 86400,
                web3WalletAddress: undefined,
                queryId: undefined
            }
        });
    });

    it('routes build-promote-sale-tx to marketplace colored promotion', async () => {
        const command = resolveCliCommand('build-promote-sale-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                promotion_type: 'colored',
                user_address: TEST_ADDRESS,
                sale_address: TEST_ADDRESS,
                period: '86400'
            },
            undefined,
            {}
        );

        const makeColoredSale = async (args: unknown) => ({ route: 'make-colored-sale', args });
        const result = await command!.handler({
            api: {
                marketplace: {
                    getConfig: async () => ({
                        promotion_prices: {
                            move_up_price: {
                                amount: '1000'
                            },
                            period_prices: {
                                '86400': {
                                    hot_price: {
                                        amount: '2500'
                                    },
                                    colored_price: {
                                        amount: '4000'
                                    }
                                }
                            }
                        }
                    })
                }
            },
            tx: {
                marketplace: {
                    makeColoredSale
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'make-colored-sale',
            args: {
                userAddress: TEST_ADDRESS,
                saleAddress: TEST_ADDRESS,
                price: 4000n,
                period: 86400,
                web3WalletAddress: undefined,
                queryId: undefined
            }
        });
    });

    it('requires period for hot and colored sale promotions', async () => {
        const command = resolveCliCommand('build-promote-sale-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                promotion_type: 'hot',
                user_address: TEST_ADDRESS,
                sale_address: TEST_ADDRESS
            },
            undefined,
            {}
        );

        await expect(command!.handler({
            api: {
                marketplace: {
                    getConfig: async () => ({
                        promotion_prices: {
                            move_up_price: {
                                amount: '1000'
                            },
                            period_prices: {}
                        }
                    })
                }
            },
            tx: {
                marketplace: {
                    moveUpSale: async (_args: unknown) => ({}),
                    makeHotSale: async (_args: unknown) => ({}),
                    makeColoredSale: async (_args: unknown) => ({})
                }
            }
        } as any, input, { registry: [] })).rejects.toThrow('Missing required parameter "period" for command build-promote-sale-tx');
    });

    it('rejects build-promote-sale-tx when marketplace config lacks the requested promotion price', async () => {
        const command = resolveCliCommand('build-promote-sale-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                promotion_type: 'colored',
                user_address: TEST_ADDRESS,
                sale_address: TEST_ADDRESS,
                period: '86400'
            },
            undefined,
            {}
        );

        await expect(command!.handler({
            api: {
                marketplace: {
                    getConfig: async () => ({
                        promotion_prices: {
                            move_up_price: {
                                amount: '1000'
                            },
                            period_prices: {
                                '86400': {
                                    hot_price: {
                                        amount: '2500'
                                    }
                                }
                            }
                        }
                    })
                }
            },
            tx: {
                marketplace: {
                    moveUpSale: async (_args: unknown) => ({}),
                    makeHotSale: async (_args: unknown) => ({}),
                    makeColoredSale: async (_args: unknown) => ({})
                }
            }
        } as any, input, { registry: [] })).rejects.toThrow('Unable to determine promotion price for colored:86400');
    });

    it('routes build-buy-subscription-tx to marketplace subscription purchase', async () => {
        const command = resolveCliCommand('build-buy-subscription-tx');
        expect(command).not.toBeNull();

        const input = prepareCommandInput(
            command!,
            [],
            {
                subscription_level: '2',
                subscription_period: '30',
                subscription_price: '1000000000'
            },
            undefined,
            {}
        );

        const buySubscription = async (args: unknown) => ({ route: 'buy-subscription', args });
        const result = await command!.handler({
            tx: {
                marketplace: {
                    buySubscription
                }
            }
        } as any, input, { registry: [] });

        expect(result).toEqual({
            route: 'buy-subscription',
            args: {
                subscriptionLevel: 2,
                subscriptionPeriod: 30,
                subscriptionPrice: 1000000000n,
                queryId: undefined
            }
        });
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
