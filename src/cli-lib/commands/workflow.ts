import type { TonClient4 } from '@ton/ton';

import {
    ADDRESS_PARAM,
    CURRENCIES,
    CURSOR_PARAM,
    DEAL_STATES,
    DEAL_TYPES,
    DOMAIN_ZONES,
    LIMIT_PARAM,
    LIST_DEAL_SORTS,
    LIST_DOMAIN_SORTS,
    OBJECT_OUTPUT_SCHEMA,
    OFFSET_PARAM,
    PAGINATED_OUTPUT_SCHEMA,
    SALE_SEGMENTS,
    USER_RATINGS
} from '../constants';
import { cloneParam, sdkCommand } from '../command-builder';
import type { CliCommandDefinition } from '../types';
import { parseAddress } from '../../tx/shared';

type WorkflowInput = Record<string, unknown>;
type WorkflowSdk = {
    api: {
        domains: {
            get(args: { domain_name: string }): Promise<{
                address?: string | null;
                current_sale?: {
                    address?: string | null;
                    deal_type?: 'fix_price_sale' | 'auction' | 'domains_swap' | null;
                } | null;
                status?: {
                    is_for_sale?: boolean;
                    is_on_primary_auction?: boolean;
                    is_on_secondary_auction?: boolean;
                    is_on_swap_contract?: boolean;
                } | null;
            }>;
        };
        deals: {
            get(args: { deal_address: string }): Promise<{
                domain_names?: string[] | null;
                marketplace?: {
                    name?: string | null;
                } | null;
                version_index?: number | null;
            }>;
        };
        offers: {
            get(args: { offer_address: string }): Promise<{
                pricing?: {
                    price?: {
                        amount?: string | null;
                        currency?: string | null;
                    } | null;
                } | null;
            }>;
        };
        marketplace: {
            getConfig(): Promise<{
                promotion_prices?: {
                    move_up_price?: {
                        amount?: string | null;
                    } | null;
                    period_prices?: Record<string, {
                        hot_price?: {
                            amount?: string | null;
                        } | null;
                        colored_price?: {
                            amount?: string | null;
                        } | null;
                    }> | null;
                } | null;
            }>;
        };
    };
    context: {
        getTonClient(): TonClient4;
    };
};

function requireString(input: WorkflowInput, key: string, commandName: string) {
    const value = input[key];
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`Missing required parameter "${key}" for command ${commandName}`);
    }
    return value;
}

function requireNumber(input: WorkflowInput, key: string, commandName: string) {
    const value = input[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Missing required parameter "${key}" for command ${commandName}`);
    }
    return value;
}

function requireFraction(input: WorkflowInput, key: string, commandName: string) {
    const value = requireNumber(input, key, commandName);
    if (value < 0 || value > 1) {
        throw new Error(`${key} must be a fraction between 0 and 1 for command ${commandName} (for example 0.05 for 5%)`);
    }
    return value;
}

function requireBigInt(input: WorkflowInput, key: string, commandName: string) {
    const value = input[key];
    if (typeof value !== 'bigint') {
        throw new Error(`Missing required parameter "${key}" for command ${commandName}`);
    }
    return value;
}

function optionalNumber(input: WorkflowInput, key: string) {
    const value = input[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function optionalBigInt(input: WorkflowInput, key: string) {
    const value = input[key];
    return typeof value === 'bigint' ? value : undefined;
}

function optionalBoolean(input: WorkflowInput, key: string) {
    const value = input[key];
    return typeof value === 'boolean' ? value : undefined;
}

function requireCurrency(input: WorkflowInput, key: string, commandName: string) {
    const value = requireString(input, key, commandName);
    if (!CURRENCIES.includes(value as typeof CURRENCIES[number])) {
        throw new Error(`${key} must be one of: ${CURRENCIES.join(', ')}`);
    }
    return value as typeof CURRENCIES[number];
}

async function getDealMarketplaceName(sdk: WorkflowSdk, dealAddress: string) {
    const deal = await sdk.api.deals.get({ deal_address: dealAddress });
    const marketplaceName = deal.marketplace?.name?.trim().toLowerCase();

    if (!marketplaceName) {
        throw new Error(`Unable to determine marketplace for deal ${dealAddress}`);
    }

    return marketplaceName;
}

function isExternalMarketplace(marketplaceName: string) {
    return marketplaceName !== 'webdom';
}

async function inferOfferCurrency(sdk: WorkflowSdk, offerAddress: string) {
    const offer = await sdk.api.offers.get({ offer_address: offerAddress });
    const currency = offer.pricing?.price?.currency;

    if (!currency || !CURRENCIES.includes(currency as typeof CURRENCIES[number])) {
        throw new Error(`Unable to determine offer currency for ${offerAddress}`);
    }

    return currency as typeof CURRENCIES[number];
}

async function getOfferPricing(sdk: WorkflowSdk, offerAddress: string) {
    const offer = await sdk.api.offers.get({ offer_address: offerAddress });
    const price = offer.pricing?.price;

    if (!price || !price.currency || !CURRENCIES.includes(price.currency as typeof CURRENCIES[number]) || typeof price.amount !== 'string' || price.amount.length === 0) {
        throw new Error(`Unable to determine offer pricing for ${offerAddress}`);
    }

    return {
        currency: price.currency as typeof CURRENCIES[number],
        amount: BigInt(price.amount)
    };
}

async function inferGetgemsAuctionVersion(sdk: WorkflowSdk, auctionAddress: string) {
    const tonClient = sdk.context.getTonClient();
    const { last } = await tonClient.getLastBlock();
    const address = parseAddress(auctionAddress);

    try {
        const result = await tonClient.runMethod(last.seqno, address, 'get_auction_data_v4', []);
        if (result.exitCode !== 0) {
            throw new Error(`get_auction_data_v4 exited with code ${result.exitCode}`);
        }
        return true;
    } catch (v4Error) {
        try {
            const result = await tonClient.runMethod(last.seqno, address, 'get_auction_data', []);
            if (result.exitCode !== 0) {
                throw new Error(`get_auction_data exited with code ${result.exitCode}`);
            }
            return false;
        } catch (legacyError) {
            const v4Message = v4Error instanceof Error ? v4Error.message : String(v4Error);
            const legacyMessage = legacyError instanceof Error ? legacyError.message : String(legacyError);
            throw new Error(`Unable to determine getgems auction version for ${auctionAddress}: ${v4Message}; ${legacyMessage}`);
        }
    }
}

export const WORKFLOW_COMMANDS: CliCommandDefinition[] = [
    sdkCommand({
        name: 'find-domain',
        layer: 'workflow',
        summary: 'Search domains with common filters.',
        description: 'Wrapper around catalog.list-domains.',
        aliases: ['find-domains'],
        params: [
            { name: 'query', type: 'string', aliases: ['search'], description: 'Free-text search query.' },
            { name: 'regex', type: 'string', description: 'Case-insensitive regex matched against the full domain name.' },
            { name: 'zone', type: 'string', aliases: ['domain_zone'], enum: DOMAIN_ZONES, description: 'Domain zone.' },
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM),
            { name: 'sort', type: 'string', enum: LIST_DOMAIN_SORTS, description: 'Sort order.' },
            { name: 'owner_address', type: 'string', description: 'Filter by owner address.' },
            { name: 'linked_wallet_address', type: 'string', description: 'Filter by linked wallet address.' }
        ],
        examples: [
            'webdom find-domain --query gold --zone ton --limit 5',
            'webdom find-domain --regex \'^gold.*\\\\.ton$\' --limit 5',
            'webdom find-domain --owner-address UQ... --limit 20'
        ],
        outputDescription: 'Paginated domain search results.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'catalog', 'listDomains'],
        mapInput(input) {
            return {
                search: input.query ?? input.search,
                regex: input.regex,
                domain_zone: input.zone ?? input.domain_zone,
                limit: input.limit,
                cursor: input.cursor,
                sort: input.sort,
                owner_address: input.owner_address,
                linked_wallet_address: input.linked_wallet_address
            };
        }
    }),
    sdkCommand({
        name: 'find-available-labels',
        layer: 'workflow',
        summary: 'Search available .ton labels.',
        description: 'Workflow wrapper around the mint availability search endpoint.',
        aliases: ['find-available-domain-labels', 'find-mint-labels'],
        params: [
            { name: 'regex', type: 'string', required: true, description: 'Regex pattern for the label only, without the `.ton` suffix.' },
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM),
            { name: 'sort_order', type: 'string', enum: ['asc', 'desc'], description: 'Lexicographic sort direction.' },
            { name: 'min_len', type: 'number', description: 'Minimum label length.' },
            { name: 'max_len', type: 'number', description: 'Maximum label length.' },
            { name: 'has_digit', type: 'boolean', description: 'Filter by whether the label contains at least one digit.' },
            { name: 'has_letter', type: 'boolean', description: 'Filter by whether the label contains at least one ASCII letter.' },
            { name: 'has_hyphen', type: 'boolean', description: 'Filter by whether the label contains a hyphen.' },
            { name: 'is_idn', type: 'boolean', description: 'Filter by whether the label is punycode-encoded.' },
            { name: 'is_palindrome', type: 'boolean', description: 'Filter by whether the label reads the same forward and backward.' },
            { name: 'first_char', type: 'string', description: 'Optional first-character filter.' }
        ],
        examples: [
            'webdom find-available-labels --regex \'^[a-z]{4}$\' --limit 10',
            'webdom find-available-labels --regex \'^ton\' --has-letter true --first-char t'
        ],
        outputDescription: 'Paginated available label search results.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'catalog', 'listAvailableDomainLabels'],
        mapInput(input) {
            return {
                regex: input.regex,
                limit: input.limit,
                cursor: input.cursor,
                sort_order: input.sort_order,
                min_len: input.min_len,
                max_len: input.max_len,
                has_digit: input.has_digit,
                has_letter: input.has_letter,
                has_hyphen: input.has_hyphen,
                is_idn: input.is_idn,
                is_palindrome: input.is_palindrome,
                first_char: input.first_char
            };
        }
    }),
    sdkCommand({
        name: 'find-deal',
        layer: 'workflow',
        summary: 'Search deals with common filters.',
        description: 'Agent-first wrapper around catalog.list-deals.',
        aliases: ['find-deals'],
        params: [
            { name: 'domain', type: 'string', aliases: ['domain_name'], description: 'Filter by domain name.' },
            { name: 'zone', type: 'string', aliases: ['domain_zone'], enum: DOMAIN_ZONES, description: 'Domain zone.' },
            { name: 'type', type: 'string', aliases: ['types'], enum: DEAL_TYPES, array: true, description: 'Deal types.' },
            { name: 'state', type: 'string', aliases: ['states'], enum: DEAL_STATES, array: true, description: 'Deal states.' },
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM),
            { name: 'sort', type: 'string', enum: LIST_DEAL_SORTS, description: 'Sort order.' }
        ],
        examples: ['webdom find-deal --type auction --state active --limit 10'],
        outputDescription: 'Paginated deal search results.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'catalog', 'listDeals'],
        mapInput(input) {
            return {
                domain_name: input.domain ?? input.domain_name,
                domain_zone: input.zone ?? input.domain_zone,
                types: input.type ?? input.types,
                states: input.state ?? input.states,
                limit: input.limit,
                cursor: input.cursor,
                sort: input.sort
            };
        }
    }),
    sdkCommand({
        name: 'get-domain',
        layer: 'workflow',
        summary: 'Get one domain.',
        description: 'Fetch full details for one domain.',
        params: [{ name: 'domain', type: 'string', aliases: ['domain_name'], required: true, description: 'Domain name.' }],
        examples: ['webdom get-domain --domain example.ton'],
        outputDescription: 'Single domain details.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'domains', 'get'],
        mapInput(input) {
            return {
                domain_name: input.domain ?? input.domain_name
            };
        }
    }),
    sdkCommand({
        name: 'resolve-domain',
        layer: 'workflow',
        summary: 'Resolve a domain name.',
        description: 'Resolve a domain name into wallet data.',
        params: [{ name: 'domain', type: 'string', aliases: ['domain_name'], required: true, description: 'Domain name.' }],
        examples: ['webdom resolve-domain --domain example.ton'],
        outputDescription: 'Resolved domain record.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'domains', 'resolve'],
        mapInput(input) {
            return {
                domain_name: input.domain ?? input.domain_name
            };
        }
    }),
    sdkCommand({
        name: 'reverse-resolve-domain',
        layer: 'workflow',
        summary: 'Resolve an address back to a domain.',
        description: 'Reverse resolve an address into the matching domain.',
        aliases: ['back-resolve-domain'],
        params: [cloneParam(ADDRESS_PARAM, { required: true })],
        examples: ['webdom reverse-resolve-domain --address UQ...'],
        outputDescription: 'Reverse lookup result.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'domains', 'backResolve']
    }),
    sdkCommand({
        name: 'list-domain-transactions',
        layer: 'workflow',
        summary: 'List one domain transaction history.',
        description: 'Fetch domain history with a compact workflow-oriented command.',
        params: [
            { name: 'domain', type: 'string', aliases: ['domain_name'], required: true, description: 'Domain name.' },
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM, { aliases: ['after_lt'], description: 'Cursor or logical-time boundary.' })
        ],
        examples: ['webdom list-domain-transactions --domain example.ton --limit 20'],
        outputDescription: 'Paginated domain transaction history.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'domains', 'listTransactions'],
        mapInput(input) {
            return {
                domain_name: input.domain ?? input.domain_name,
                limit: input.limit,
                after_lt: input.cursor ?? input.after_lt
            };
        }
    }),
    sdkCommand({
        name: 'get-deal',
        layer: 'workflow',
        summary: 'Get one deal.',
        description: 'Fetch one deal by address.',
        params: [{ name: 'deal', type: 'string', aliases: ['deal_address'], required: true, description: 'Deal address.' }],
        examples: ['webdom get-deal --deal EQ...'],
        outputDescription: 'Single deal details.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'deals', 'get'],
        mapInput(input) {
            return {
                deal_address: input.deal ?? input.deal_address
            };
        }
    }),
    sdkCommand({
        name: 'list-deal-bids',
        layer: 'workflow',
        summary: 'List bids for one deal.',
        description: 'Fetch paginated bids for a deal.',
        params: [
            { name: 'deal', type: 'string', aliases: ['deal_address'], required: true, description: 'Deal address.' },
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM)
        ],
        examples: ['webdom list-deal-bids --deal EQ... --limit 20'],
        outputDescription: 'Paginated deal bids.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'deals', 'listBids'],
        mapInput(input) {
            return {
                deal_address: input.deal ?? input.deal_address,
                limit: input.limit,
                cursor: input.cursor
            };
        }
    }),
    sdkCommand({
        name: 'get-offer',
        layer: 'workflow',
        summary: 'Get one offer.',
        description: 'Fetch one offer by address.',
        params: [{ name: 'offer', type: 'string', aliases: ['offer_address'], required: true, description: 'Offer address.' }],
        examples: ['webdom get-offer --offer EQ...'],
        outputDescription: 'Single offer details.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'offers', 'get'],
        mapInput(input) {
            return {
                offer_address: input.offer ?? input.offer_address
            };
        }
    }),
    sdkCommand({
        name: 'get-best-offer',
        layer: 'workflow',
        summary: 'Get the best offer for a domain.',
        description: 'Fetch the best current offer for a domain.',
        params: [{ name: 'domain', type: 'string', aliases: ['domain_name'], required: true, description: 'Domain name.' }],
        examples: ['webdom get-best-offer --domain example.ton'],
        outputDescription: 'Best offer summary.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'offers', 'getBest'],
        mapInput(input) {
            return {
                domain_name: input.domain ?? input.domain_name
            };
        }
    }),
    sdkCommand({
        name: 'list-my-offers',
        layer: 'workflow',
        summary: 'List authenticated offers.',
        description: 'Fetch incoming and outgoing offers for the current token.',
        auth: true,
        acceptsInput: 'none',
        params: [],
        examples: ['webdom list-my-offers'],
        outputDescription: 'Authenticated user offers.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'offers', 'listMine']
    }),
    sdkCommand({
        name: 'find-user',
        layer: 'workflow',
        summary: 'Search users.',
        description: 'Workflow wrapper around users.search.',
        aliases: ['find-users'],
        params: [
            { name: 'query', type: 'string', aliases: ['search'], required: true, description: 'Search query.' },
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM)
        ],
        examples: ['webdom find-user --query webdom --limit 10'],
        outputDescription: 'Paginated user search results.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'users', 'search'],
        mapInput(input) {
            return {
                search: input.query ?? input.search,
                limit: input.limit,
                cursor: input.cursor
            };
        }
    }),
    sdkCommand({
        name: 'get-user',
        layer: 'workflow',
        summary: 'Get one user.',
        description: 'Fetch one user profile by address.',
        params: [cloneParam(ADDRESS_PARAM, { required: true })],
        examples: ['webdom get-user --address UQ...'],
        outputDescription: 'Single user profile.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'users', 'get']
    }),
    sdkCommand({
        name: 'list-user-activity',
        layer: 'workflow',
        summary: 'List activity for one user.',
        description: 'Fetch paginated marketplace activity for a user.',
        params: [
            cloneParam(ADDRESS_PARAM, { required: true }),
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM)
        ],
        examples: ['webdom list-user-activity --address UQ... --limit 20'],
        outputDescription: 'Paginated user activity.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'users', 'listActivity']
    }),
    sdkCommand({
        name: 'get-market-overview',
        layer: 'workflow',
        summary: 'Get market overview.',
        description: 'Fetch high-level market metrics for a zone.',
        params: [{ name: 'zone', type: 'string', aliases: ['domain_zone'], enum: DOMAIN_ZONES, required: true, description: 'Domain zone.' }],
        examples: ['webdom get-market-overview --zone ton'],
        outputDescription: 'Market overview metrics.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'analytics', 'getMarketOverview'],
        mapInput(input) {
            return {
                domain_zone: input.zone ?? input.domain_zone
            };
        }
    }),
    sdkCommand({
        name: 'get-market-charts',
        layer: 'workflow',
        summary: 'Get market charts.',
        description: 'Fetch time-series chart data for a zone.',
        params: [{ name: 'zone', type: 'string', aliases: ['domain_zone'], enum: DOMAIN_ZONES, required: true, description: 'Domain zone.' }],
        examples: ['webdom get-market-charts --zone ton'],
        outputDescription: 'Market chart series.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'analytics', 'getMarketCharts'],
        mapInput(input) {
            return {
                domain_zone: input.zone ?? input.domain_zone
            };
        }
    }),
    sdkCommand({
        name: 'list-top-sales',
        layer: 'workflow',
        summary: 'List top sales.',
        description: 'Fetch top sales with a workflow-oriented interface.',
        params: [
            { name: 'zone', type: 'string', aliases: ['domain_zone'], enum: DOMAIN_ZONES, required: true, description: 'Domain zone.' },
            { name: 'segment', type: 'string', aliases: ['sale_segment'], enum: SALE_SEGMENTS, required: true, description: 'Primary or secondary sale segment.' },
            { name: 'currency', type: 'string', enum: CURRENCIES, description: 'Optional currency filter.' },
            cloneParam(LIMIT_PARAM),
            cloneParam(OFFSET_PARAM)
        ],
        examples: ['webdom list-top-sales --zone ton --segment secondary --limit 10'],
        outputDescription: 'Top sales list.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'analytics', 'listTopSales'],
        mapInput(input) {
            return {
                domain_zone: input.zone ?? input.domain_zone,
                sale_segment: input.segment ?? input.sale_segment,
                currency: input.currency,
                limit: input.limit,
                offset: input.offset
            };
        }
    }),
    sdkCommand({
        name: 'list-user-rankings',
        layer: 'workflow',
        summary: 'List user rankings.',
        description: 'Fetch user leaderboard rankings.',
        params: [
            { name: 'rating', type: 'string', enum: USER_RATINGS, required: true, description: 'Leaderboard metric.' },
            { name: 'zone', type: 'string', aliases: ['domain_zone'], enum: DOMAIN_ZONES, description: 'Optional domain zone.' },
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom list-user-rankings --rating total_purchases_volume --limit 10'],
        outputDescription: 'User leaderboard rankings.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'analytics', 'listUserRankings'],
        mapInput(input) {
            return {
                rating: input.rating,
                domain_zone: input.zone ?? input.domain_zone,
                limit: input.limit
            };
        }
    }),
    sdkCommand({
        name: 'list-transactions-history',
        layer: 'workflow',
        summary: 'List global transaction history.',
        description: 'Workflow wrapper around history.transactions.',
        params: [
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM),
            { name: 'zone', type: 'string', aliases: ['domain_zone'], enum: DOMAIN_ZONES, description: 'Optional domain zone.' },
            { name: 'domain', type: 'string', aliases: ['domain_name'], description: 'Optional domain name filter.' }
        ],
        examples: ['webdom list-transactions-history --limit 20'],
        outputDescription: 'Paginated transaction history.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'history', 'listTransactions'],
        mapInput(input) {
            return {
                limit: input.limit,
                cursor: input.cursor,
                domain_zone: input.zone ?? input.domain_zone,
                domain_name: input.domain ?? input.domain_name
            };
        }
    }),
    sdkCommand({
        name: 'list-auction-bids-history',
        layer: 'workflow',
        summary: 'List auction bid history.',
        description: 'Workflow wrapper around history.auction-bids.',
        params: [cloneParam(LIMIT_PARAM), cloneParam(CURSOR_PARAM)],
        examples: ['webdom list-auction-bids-history --limit 20'],
        outputDescription: 'Paginated auction bid history.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'history', 'listAuctionBids'],
        mapInput(input) {
            return {
                limit: input.limit,
                cursor: input.cursor
            };
        }
    }),
    sdkCommand({
        name: 'list-sales-history',
        layer: 'workflow',
        summary: 'List sales history.',
        description: 'Workflow wrapper around history.sales.',
        params: [
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM),
            { name: 'zone', type: 'string', aliases: ['domain_zone'], enum: DOMAIN_ZONES, description: 'Optional domain zone.' }
        ],
        examples: ['webdom list-sales-history --zone ton --limit 20'],
        outputDescription: 'Paginated sales history.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'history', 'listSales'],
        mapInput(input) {
            return {
                limit: input.limit,
                cursor: input.cursor,
                domain_zone: input.zone ?? input.domain_zone
            };
        }
    }),
    sdkCommand({
        name: 'get-wallet-balances',
        layer: 'workflow',
        summary: 'Get TON, USDT, and WEB3 balances.',
        description: 'Read TON balance and the owner jetton balances for USDT and WEB3.',
        aliases: ['wallet-balances', 'get-balances'],
        params: [cloneParam(ADDRESS_PARAM, { required: true })],
        examples: ['webdom get-wallet-balances --address UQ...'],
        outputDescription: 'Wallet balances grouped by asset.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['balances', 'getAll']
    }),
    sdkCommand({
        name: 'get-ton-balance',
        layer: 'workflow',
        summary: 'Get TON balance.',
        description: 'Read the TON balance for one wallet address.',
        params: [cloneParam(ADDRESS_PARAM, { required: true })],
        examples: ['webdom get-ton-balance --address UQ...'],
        outputDescription: 'TON balance.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['balances', 'getTon']
    }),
    sdkCommand({
        name: 'get-usdt-balance',
        layer: 'workflow',
        summary: 'Get USDT jetton balance.',
        description: 'Resolve the owner USDT jetton wallet and read its balance.',
        params: [cloneParam(ADDRESS_PARAM, { required: true })],
        examples: ['webdom get-usdt-balance --address UQ...'],
        outputDescription: 'USDT balance.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['balances', 'getUsdt']
    }),
    sdkCommand({
        name: 'get-web3-balance',
        layer: 'workflow',
        summary: 'Get WEB3 jetton balance.',
        description: 'Resolve the owner WEB3 jetton wallet and read its balance.',
        params: [cloneParam(ADDRESS_PARAM, { required: true })],
        examples: ['webdom get-web3-balance --address UQ...'],
        outputDescription: 'WEB3 balance.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['balances', 'getWeb3']
    }),
    sdkCommand({
        name: 'build-purchase-tx',
        layer: 'workflow',
        summary: 'Build a TON simple-sale purchase transaction.',
        description: 'Prepare a TonConnect-ready message for purchasing a TON-priced simple sale.',
        params: [
            { name: 'sale_address', type: 'string', required: true, description: 'Sale contract address.' },
            { name: 'price', type: 'bigint', description: 'Optional explicit TON price in nanotons.' }
        ],
        examples: ['webdom build-purchase-tx --sale-address EQ...'],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['tx', 'sales', 'purchaseTonSimple'],
        mapInput(input) {
            return {
                saleAddress: input.sale_address,
                price: input.price
            };
        }
    }),
    sdkCommand({
        name: 'build-auction-bid-tx',
        layer: 'workflow',
        summary: 'Build a TON simple-auction bid transaction.',
        description: 'Prepare a TonConnect-ready message for bidding on a TON simple auction.',
        params: [
            { name: 'auction_address', type: 'string', required: true, description: 'Auction contract address.' },
            { name: 'bid_value', type: 'bigint', required: true, description: 'Bid value in nanotons.' }
        ],
        examples: ['webdom build-auction-bid-tx --auction-address EQ... --bid-value 1000000000'],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['tx', 'auctions', 'placeTonSimpleBid'],
        mapInput(input) {
            return {
                auctionAddress: input.auction_address,
                bidValue: input.bid_value
            };
        }
    }),
    sdkCommand({
        name: 'build-primary-auction-bid-tx',
        layer: 'workflow',
        summary: 'Build a primary DNS auction bid transaction.',
        description: 'Prepare a TonConnect-ready message for a primary DNS auction bid.',
        params: [
            { name: 'domain_address', type: 'string', required: true, description: 'Domain contract address.' },
            { name: 'bid_value', type: 'bigint', required: true, description: 'Bid value in nanotons.' }
        ],
        examples: ['webdom build-primary-auction-bid-tx --domain-address EQ... --bid-value 1000000000'],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['tx', 'domains', 'placePrimaryAuctionBid'],
        mapInput(input) {
            return {
                domainAddress: input.domain_address,
                bidValue: input.bid_value
            };
        }
    }),
    sdkCommand({
        name: 'build-link-wallet-tx',
        layer: 'workflow',
        summary: 'Build a link-wallet transaction.',
        description: 'Prepare a TonConnect-ready message that links or clears a domain wallet record.',
        params: [
            { name: 'domain_address', type: 'string', required: true, description: 'Domain contract address.' },
            { name: 'wallet_address', type: 'string', description: 'Wallet address to link. Omit to clear the wallet record.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' }
        ],
        examples: ['webdom build-link-wallet-tx --domain-address EQ... --wallet-address UQ...'],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['tx', 'domains', 'linkWallet'],
        mapInput(input) {
            return {
                domainAddress: input.domain_address,
                walletAddress: input.wallet_address,
                queryId: input.query_id
            };
        }
    }),
    {
        name: 'build-renew-domain-tx',
        layer: 'workflow',
        summary: 'Build a domain renewal transaction.',
        description: 'Prepare a TonConnect-ready renewal transaction and automatically choose the direct, sale, or auction renewal path.',
        aliases: ['build-renew-tx'],
        acceptsInput: 'object',
        params: [
            { name: 'domain_name', type: 'string', required: true, description: 'Domain name.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' }
        ],
        examples: [
            'webdom build-renew-domain-tx --domain-name example.ton',
            'webdom build-renew-domain-tx --domain-name listed.ton --query-id 7'
        ],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        async handler(sdk, rawInput) {
            const input = rawInput as WorkflowInput;
            const commandName = 'build-renew-domain-tx';
            const domainName = requireString(input, 'domain_name', commandName);
            const queryId = optionalNumber(input, 'query_id');
            const domain = await (sdk as WorkflowSdk).api.domains.get({ domain_name: domainName });

            if (typeof domain.address !== 'string' || domain.address.length === 0) {
                throw new Error(`Unable to determine domain address for ${domainName}`);
            }

            const currentSale = domain.current_sale;
            const isOnDeal = Boolean(currentSale?.address && currentSale.deal_type);

            if (!isOnDeal) {
                return await sdk.tx.domains.renew({
                    domainAddress: domain.address,
                    queryId
                });
            }

            if (domain.status?.is_on_primary_auction) {
                throw new Error(`Unable to renew ${domainName} while it is on a primary auction`);
            }

            if (!currentSale) {
                throw new Error(`Unable to determine active deal details for ${domainName}`);
            }

            if (currentSale.deal_type === 'domains_swap' || domain.status?.is_on_swap_contract) {
                throw new Error(`Unable to renew ${domainName} while it is on a domain swap contract`);
            }

            const dealAddress = currentSale.address;
            if (typeof dealAddress !== 'string' || dealAddress.length === 0) {
                throw new Error(`Unable to determine active deal address for ${domainName}`);
            }

            const deal = await (sdk as WorkflowSdk).api.deals.get({ deal_address: dealAddress });
            const marketplaceName = deal.marketplace?.name?.trim().toLowerCase();
            if (!marketplaceName) {
                throw new Error(`Unable to determine marketplace for deal ${dealAddress}`);
            }
            if (marketplaceName !== 'webdom') {
                throw new Error(`Unable to renew ${domainName} while it is listed on ${marketplaceName}`);
            }

            const domainsNumber = deal.domain_names?.length ?? 1;
            const versionIndex = deal.version_index ?? 0;

            if (currentSale.deal_type === 'fix_price_sale') {
                return await sdk.tx.sales.renewDomains({
                    saleAddress: dealAddress,
                    domainsNumber,
                    queryId,
                    isOldContract: versionIndex < 5
                });
            }

            if (currentSale.deal_type === 'auction') {
                return await sdk.tx.auctions.renewDomains({
                    auctionAddress: dealAddress,
                    domainsNumber,
                    queryId,
                    isOldContract: versionIndex < 5
                });
            }

            throw new Error(`Unable to determine renewal path for ${domainName}`);
        }
    },
    sdkCommand({
        name: 'build-accept-offer-tx',
        layer: 'workflow',
        summary: 'Build a purchase-offer acceptance transaction.',
        description: 'Prepare a TonConnect-ready message for accepting a purchase offer.',
        params: [
            { name: 'domain_address', type: 'string', required: true, description: 'Domain contract address.' },
            { name: 'offer_address', type: 'string', required: true, description: 'Offer contract address.' },
            { name: 'user_address', type: 'string', required: true, description: 'Seller wallet address.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' }
        ],
        examples: ['webdom build-accept-offer-tx --domain-address EQ... --offer-address EQ... --user-address UQ...'],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['tx', 'offers', 'acceptPurchase'],
        mapInput(input) {
            return {
                domainAddress: input.domain_address,
                offerAddress: input.offer_address,
                userAddress: input.user_address,
                queryId: input.query_id
            };
        }
    }),
    {
        name: 'build-sale-tx',
        layer: 'workflow',
        summary: 'Build a fixed-price sale deployment transaction.',
        description: 'Prepare a TonConnect-ready message for listing one domain for sale in TON, USDT, or WEB3.',
        aliases: ['build-listing-tx'],
        acceptsInput: 'object',
        params: [
            { name: 'user_address', type: 'string', required: true, description: 'Seller wallet address.' },
            { name: 'domain_address', type: 'string', required: true, description: 'Domain contract address.' },
            { name: 'domain_name', type: 'string', required: true, description: 'Domain name.' },
            { name: 'currency', type: 'string', required: true, enum: CURRENCIES, description: 'Listing currency.' },
            { name: 'price', type: 'bigint', required: true, description: 'Listing price in minor units for the selected currency.' },
            { name: 'valid_until', type: 'number', required: true, description: 'Unix timestamp when the sale expires.' },
            { name: 'auto_renew_cooldown', type: 'number', description: 'Optional auto-renew cooldown in seconds.' },
            { name: 'auto_renew_iterations', type: 'number', description: 'Optional auto-renew iteration count.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' }
        ],
        examples: [
            'webdom build-sale-tx --user-address UQ... --domain-address EQ... --domain-name example.ton --currency TON --price 1000000000 --valid-until 1767225600',
            'webdom build-sale-tx --user-address UQ... --domain-address EQ... --domain-name example.ton --currency USDT --price 1000000000 --valid-until 1767225600'
        ],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        async handler(sdk, rawInput) {
            const input = rawInput as WorkflowInput;
            const commandName = 'build-sale-tx';
            const currency = requireCurrency(input, 'currency', commandName);
            const commonArgs = {
                userAddress: requireString(input, 'user_address', commandName),
                domainAddress: requireString(input, 'domain_address', commandName),
                domainName: requireString(input, 'domain_name', commandName),
                price: requireBigInt(input, 'price', commandName),
                validUntil: requireNumber(input, 'valid_until', commandName),
                autoRenewCooldown: optionalNumber(input, 'auto_renew_cooldown'),
                autoRenewIterations: optionalNumber(input, 'auto_renew_iterations'),
                queryId: optionalNumber(input, 'query_id')
            };

            if (currency === 'TON') {
                return await sdk.tx.sales.deployTonSimple(commonArgs);
            }

            return await sdk.tx.sales.deployJettonSimple({
                ...commonArgs,
                isWeb3: currency === 'WEB3'
            });
        }
    },
    {
        name: 'build-offer-tx',
        layer: 'workflow',
        summary: 'Build a purchase-offer deployment transaction.',
        description: 'Prepare a TonConnect-ready message for placing a purchase offer in TON, USDT, or WEB3.',
        aliases: ['build-purchase-offer-tx'],
        acceptsInput: 'object',
        params: [
            { name: 'domain_name', type: 'string', required: true, description: 'Domain name.' },
            { name: 'seller_address', type: 'string', required: true, description: 'Current owner wallet address.' },
            { name: 'currency', type: 'string', required: true, enum: CURRENCIES, description: 'Offer currency.' },
            { name: 'price', type: 'bigint', required: true, description: 'Offer price in minor units for the selected currency.' },
            { name: 'valid_until', type: 'number', required: true, description: 'Unix timestamp when the offer expires.' },
            { name: 'user_address', type: 'string', description: 'Buyer wallet address. Required for USDT and WEB3 offers.' },
            { name: 'jetton_wallet_address', type: 'string', description: 'Optional buyer jetton wallet address override.' },
            { name: 'commission', type: 'bigint', description: 'Optional completion commission in nanotons/minor units. When omitted, marketplace config is used.' },
            { name: 'notify_seller', type: 'boolean', description: 'Whether to notify the seller.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' }
        ],
        examples: [
            'webdom build-offer-tx --domain-name example.ton --seller-address UQ... --currency TON --price 1000000000 --valid-until 1767225600',
            'webdom build-offer-tx --domain-name example.ton --seller-address UQ... --currency USDT --price 1000000000 --valid-until 1767225600 --user-address UQ...'
        ],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        async handler(sdk, rawInput) {
            const input = rawInput as WorkflowInput;
            const commandName = 'build-offer-tx';
            const currency = requireCurrency(input, 'currency', commandName);
            const commonArgs = {
                domainName: requireString(input, 'domain_name', commandName),
                sellerAddress: requireString(input, 'seller_address', commandName),
                price: requireBigInt(input, 'price', commandName),
                validUntil: requireNumber(input, 'valid_until', commandName),
                commission: optionalBigInt(input, 'commission'),
                queryId: optionalNumber(input, 'query_id')
            };

            if (currency === 'TON') {
                return await sdk.tx.offers.deployTonSimple({
                    ...commonArgs,
                    notifySeller: optionalBoolean(input, 'notify_seller')
                });
            }

            const userAddress = requireString(input, 'user_address', commandName);
            return await sdk.tx.offers.deployJettonSimple({
                ...commonArgs,
                userAddress,
                jettonWalletAddress: input.jetton_wallet_address as string | undefined,
                jettonSymbol: currency,
                notifySeller: optionalBoolean(input, 'notify_seller') ?? true
            });
        }
    },
    {
        name: 'build-auction-tx',
        layer: 'workflow',
        summary: 'Build an auction deployment transaction.',
        description: 'Prepare a TonConnect-ready message for listing one domain on auction in TON, USDT, or WEB3.',
        aliases: ['build-start-auction-tx'],
        acceptsInput: 'object',
        params: [
            { name: 'user_address', type: 'string', required: true, description: 'Seller wallet address.' },
            { name: 'domain_address', type: 'string', required: true, description: 'Domain contract address.' },
            { name: 'domain_name', type: 'string', required: true, description: 'Domain name.' },
            { name: 'currency', type: 'string', required: true, enum: CURRENCIES, description: 'Auction currency.' },
            { name: 'start_time', type: 'number', required: true, description: 'Auction start time as a Unix timestamp.' },
            { name: 'end_time', type: 'number', required: true, description: 'Auction end time as a Unix timestamp.' },
            { name: 'min_bid_value', type: 'bigint', required: true, description: 'Minimum bid in minor units for the selected currency.' },
            { name: 'max_bid_value', type: 'bigint', required: true, description: 'Maximum bid in minor units for the selected currency.' },
            { name: 'min_bid_increment', type: 'number', required: true, description: 'Minimum bid increment percentage.' },
            { name: 'time_increment', type: 'number', required: true, description: 'Time extension in seconds for late bids.' },
            { name: 'is_deferred', type: 'boolean', description: 'Whether the auction is deferred.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' }
        ],
        examples: [
            'webdom build-auction-tx --user-address UQ... --domain-address EQ... --domain-name example.ton --currency TON --start-time 1766620800 --end-time 1767225600 --min-bid-value 1000000000 --max-bid-value 100000000000 --min-bid-increment 5 --time-increment 300',
            'webdom build-auction-tx --user-address UQ... --domain-address EQ... --domain-name example.ton --currency USDT --start-time 1766620800 --end-time 1767225600 --min-bid-value 1000000 --max-bid-value 1000000000 --min-bid-increment 5 --time-increment 300'
        ],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        async handler(sdk, rawInput) {
            const input = rawInput as WorkflowInput;
            const commandName = 'build-auction-tx';
            const currency = requireCurrency(input, 'currency', commandName);
            const commonArgs = {
                userAddress: requireString(input, 'user_address', commandName),
                domainAddress: requireString(input, 'domain_address', commandName),
                domainName: requireString(input, 'domain_name', commandName),
                startTime: requireNumber(input, 'start_time', commandName),
                endTime: requireNumber(input, 'end_time', commandName),
                minBidValue: requireBigInt(input, 'min_bid_value', commandName),
                maxBidValue: requireBigInt(input, 'max_bid_value', commandName),
                minBidIncrement: requireNumber(input, 'min_bid_increment', commandName),
                timeIncrement: requireNumber(input, 'time_increment', commandName),
                isDeferred: optionalBoolean(input, 'is_deferred'),
                queryId: optionalNumber(input, 'query_id')
            };

            if (currency === 'TON') {
                return await sdk.tx.auctions.deployTonSimple(commonArgs);
            }

            return await sdk.tx.auctions.deployJettonSimple({
                ...commonArgs,
                isWeb3: currency === 'WEB3'
            });
        }
    },
    {
        name: 'build-cancel-deal-tx',
        layer: 'workflow',
        summary: 'Build a deal cancellation transaction.',
        description: 'Prepare a TonConnect-ready message for cancelling a sale, offer, or auction. Marketplace-specific mode is inferred automatically.',
        aliases: [
            'build-cancel-sale-tx',
            'build-sale-cancel-tx',
            'build-cancel-offer-tx',
            'build-offer-cancel-tx',
            'build-cancel-auction-tx',
            'build-stop-auction-tx'
        ],
        acceptsInput: 'object',
        params: [
            { name: 'deal_type', type: 'string', required: true, enum: ['sale', 'offer', 'auction'], description: 'Deal type to cancel.' },
            { name: 'deal_address', type: 'string', required: true, description: 'Sale, offer, or auction contract address.' },
            { name: 'cancellation_comment', type: 'string', description: 'Optional offer cancellation comment.' },
            { name: 'query_id', type: 'number', description: 'Optional query id for offer cancellation.' }
        ],
        examples: [
            'webdom build-cancel-deal-tx --deal-type sale --deal-address EQ...',
            'webdom build-cancel-deal-tx --deal-type offer --deal-address EQ...',
            'webdom build-cancel-deal-tx --deal-type auction --deal-address EQ...'
        ],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        async handler(sdk, rawInput) {
            const input = rawInput as WorkflowInput;
            const commandName = 'build-cancel-deal-tx';
            const dealType = requireString(input, 'deal_type', commandName);
            const dealAddress = requireString(input, 'deal_address', commandName);

            if (dealType === 'sale') {
                const deal = await (sdk as WorkflowSdk).api.deals.get({ deal_address: dealAddress });
                const domainsNumber = deal.domain_names?.length;
                const marketplaceName = deal.marketplace?.name?.trim().toLowerCase();

                if (!marketplaceName) {
                    throw new Error(`Unable to determine marketplace for deal ${dealAddress}`);
                }

                if (typeof domainsNumber === 'number' && domainsNumber > 1) {
                    return await sdk.tx.sales.cancelTonMultiple({
                        saleAddress: dealAddress,
                        domainsNumber
                    });
                }

                return await sdk.tx.sales.cancel({
                    saleAddress: dealAddress,
                    isGetgems: isExternalMarketplace(marketplaceName)
                });
            }

            if (dealType === 'offer') {
                const currency = await inferOfferCurrency(sdk as WorkflowSdk, dealAddress);
                const commonArgs = {
                    offerAddress: dealAddress,
                    cancellationComment: input.cancellation_comment as string | undefined,
                    queryId: optionalNumber(input, 'query_id')
                };

                if (currency === 'TON') {
                    return await sdk.tx.offers.cancelTonSimple(commonArgs);
                }

                return await sdk.tx.offers.cancelJettonSimple(commonArgs);
            }

            if (dealType === 'auction') {
                const isGetgems = isExternalMarketplace(await getDealMarketplaceName(sdk as WorkflowSdk, dealAddress));
                return await sdk.tx.auctions.stop({
                    auctionAddress: dealAddress,
                    isGetgems,
                    isV4: isGetgems ? await inferGetgemsAuctionVersion(sdk as WorkflowSdk, dealAddress) : false
                });
            }

            throw new Error('deal_type must be one of: sale, offer, auction');
        }
    },
    {
        name: 'build-change-offer-price-tx',
        layer: 'workflow',
        summary: 'Build an offer price change transaction.',
        description: 'Prepare a TonConnect-ready message for changing the price and validity of a purchase offer.',
        aliases: ['build-offer-price-change-tx'],
        acceptsInput: 'object',
        params: [
            { name: 'offer_address', type: 'string', required: true, description: 'Offer contract address.' },
            { name: 'commission_rate', type: 'number', required: true, description: 'Commission rate as a fraction, for example `0.05` for 5%.' },
            { name: 'new_price', type: 'bigint', required: true, description: 'New offer price in minor units.' },
            { name: 'new_valid_until', type: 'number', required: true, description: 'New Unix expiry timestamp.' },
            { name: 'notify_seller', type: 'boolean', description: 'Whether to notify the seller.' },
            { name: 'after_counterproposal', type: 'boolean', description: 'Whether this update happens after a counterproposal.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' },
            { name: 'user_address', type: 'string', description: 'Buyer wallet address. Required for USDT and WEB3 offers.' },
            { name: 'jetton_wallet_address', type: 'string', description: 'Optional buyer jetton wallet address override.' }
        ],
        examples: [
            'webdom build-change-offer-price-tx --offer-address EQ... --commission-rate 0.05 --new-price 2000000000 --new-valid-until 1767225600',
            'webdom build-change-offer-price-tx --offer-address EQ... --user-address UQ... --commission-rate 0.05 --new-price 2000000 --new-valid-until 1767225600'
        ],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        async handler(sdk, rawInput) {
            const input = rawInput as WorkflowInput;
            const commandName = 'build-change-offer-price-tx';
            const offerAddress = requireString(input, 'offer_address', commandName);
            const offerPricing = await getOfferPricing(sdk as WorkflowSdk, offerAddress);
            const commonArgs = {
                offerAddress,
                oldPrice: offerPricing.amount,
                commissionRate: requireFraction(input, 'commission_rate', commandName),
                newPrice: requireBigInt(input, 'new_price', commandName),
                newValidUntil: requireNumber(input, 'new_valid_until', commandName),
                notifySeller: optionalBoolean(input, 'notify_seller') ?? true,
                queryId: optionalNumber(input, 'query_id'),
                afterCounterproposal: optionalBoolean(input, 'after_counterproposal')
            };

            if (offerPricing.currency === 'TON') {
                return await sdk.tx.offers.changeTonSimplePrice(commonArgs);
            }

            return await sdk.tx.offers.changeJettonSimplePrice({
                ...commonArgs,
                userAddress: requireString(input, 'user_address', commandName),
                jettonWalletAddress: input.jetton_wallet_address as string | undefined
            });
        }
    },
    {
        name: 'build-promote-sale-tx',
        layer: 'workflow',
        summary: 'Build a sale promotion transaction.',
        description: 'Prepare a TonConnect-ready message for promoting a sale with move-up, hot, or colored placement using WEB3.',
        aliases: ['build-sale-promotion-tx'],
        acceptsInput: 'object',
        params: [
            { name: 'promotion_type', type: 'string', required: true, enum: ['move_up', 'hot', 'colored'], description: 'Promotion type.' },
            { name: 'user_address', type: 'string', required: true, description: 'Seller wallet address.' },
            { name: 'sale_address', type: 'string', required: true, description: 'Sale contract address.' },
            { name: 'period', type: 'number', description: 'Promotion period in seconds. Required for hot and colored promotions. Price is resolved from marketplace config.' },
            { name: 'web3_wallet_address', type: 'string', description: 'Optional WEB3 jetton wallet override.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' }
        ],
        examples: [
            'webdom build-promote-sale-tx --promotion-type move_up --user-address UQ... --sale-address EQ...',
            'webdom build-promote-sale-tx --promotion-type hot --user-address UQ... --sale-address EQ... --period 86400',
            'webdom build-promote-sale-tx --promotion-type colored --user-address UQ... --sale-address EQ... --period 86400'
        ],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        async handler(sdk, rawInput) {
            const input = rawInput as WorkflowInput;
            const commandName = 'build-promote-sale-tx';
            const promotionType = requireString(input, 'promotion_type', commandName);
            const config = await (sdk as WorkflowSdk).api.marketplace.getConfig();
            const promotionPrices = config.promotion_prices;

            let priceAmount: string | null | undefined;
            let period: number | undefined;

            if (promotionType === 'move_up') {
                priceAmount = promotionPrices?.move_up_price?.amount;
            } else {
                period = optionalNumber(input, 'period');
                if (period === undefined) {
                    throw new Error(`Missing required parameter "period" for command ${commandName}`);
                }

                const periodPrices = promotionPrices?.period_prices?.[String(period)];
                priceAmount = promotionType === 'hot'
                    ? periodPrices?.hot_price?.amount
                    : periodPrices?.colored_price?.amount;
            }

            if (typeof priceAmount !== 'string' || priceAmount.length === 0) {
                const promotionTarget = promotionType === 'move_up' ? promotionType : `${promotionType}:${period}`;
                throw new Error(`Unable to determine promotion price for ${promotionTarget}`);
            }

            const commonArgs = {
                userAddress: requireString(input, 'user_address', commandName),
                saleAddress: requireString(input, 'sale_address', commandName),
                price: BigInt(priceAmount),
                web3WalletAddress: input.web3_wallet_address as string | undefined,
                queryId: optionalNumber(input, 'query_id')
            };

            if (promotionType === 'move_up') {
                return await sdk.tx.marketplace.moveUpSale(commonArgs);
            }

            if (promotionType === 'hot') {
                return await sdk.tx.marketplace.makeHotSale({
                    ...commonArgs,
                    period: period as number
                });
            }

            if (promotionType === 'colored') {
                return await sdk.tx.marketplace.makeColoredSale({
                    ...commonArgs,
                    period: period as number
                });
            }

            throw new Error(`promotion_type must be one of: move_up, hot, colored`);
        }
    },
    sdkCommand({
        name: 'build-buy-subscription-tx',
        layer: 'workflow',
        summary: 'Build a marketplace subscription purchase transaction.',
        description: 'Prepare a TonConnect-ready message for buying a marketplace subscription.',
        params: [
            { name: 'subscription_level', type: 'number', required: true, description: 'Subscription level.' },
            { name: 'subscription_period', type: 'number', required: true, description: 'Subscription period in days or marketplace-defined units.' },
            { name: 'subscription_price', type: 'bigint', required: true, description: 'Subscription price in nanotons.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' }
        ],
        examples: ['webdom build-buy-subscription-tx --subscription-level 2 --subscription-period 30 --subscription-price 1000000000'],
        outputDescription: 'Prepared TonConnect transaction.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['tx', 'marketplace', 'buySubscription'],
        mapInput(input) {
            return {
                subscriptionLevel: input.subscription_level,
                subscriptionPeriod: input.subscription_period,
                subscriptionPrice: input.subscription_price,
                queryId: input.query_id
            };
        }
    })
];
