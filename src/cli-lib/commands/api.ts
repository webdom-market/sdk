import {
    ADDRESS_PARAM,
    CHARACTER_FILTERS,
    CLUBS,
    COMMAND_LAYERS,
    CURRENCIES,
    CURSOR_PARAM,
    DEAL_STATES,
    DEAL_TYPES,
    DNS_RECORD_TYPES,
    DOMAIN_ACTION_TYPES,
    DOMAIN_NAME_PARAM,
    DOMAIN_STATES,
    DOMAIN_ZONE_PARAM,
    LIMIT_PARAM,
    LIST_DEAL_SORTS,
    LIST_DOMAIN_SORTS,
    MARKETPLACES,
    OBJECT_OUTPUT_SCHEMA,
    OFFSET_PARAM,
    PAGINATED_OUTPUT_SCHEMA,
    SALE_SEGMENTS,
    TRANSACTION_SORTS,
    USER_RATINGS
} from '../constants';
import { buildCommandSchema, cloneParam, findCliCommand, renderCommandHelp, sdkCommand } from '../command-builder';
import type { CliCommandDefinition } from '../types';

export const API_COMMANDS: CliCommandDefinition[] = [
    sdkCommand({
        name: 'catalog.list-domains',
        layer: 'api',
        summary: 'List domains catalog.',
        description: 'Fetch the domains catalog with all supported filters.',
        params: [
            { name: 'search', type: 'string', description: 'Free-text search query.' },
            cloneParam(DOMAIN_ZONE_PARAM),
            { name: 'name_length_min', type: 'number', description: 'Minimum domain name length.' },
            { name: 'name_length_max', type: 'number', description: 'Maximum domain name length.' },
            { name: 'states', type: 'string', array: true, enum: DOMAIN_STATES, description: 'Deal and status filters.' },
            { name: 'categories', type: 'string', array: true, description: 'Domain categories.' },
            { name: 'characters', type: 'string', array: true, enum: CHARACTER_FILTERS, description: 'Character filters.' },
            { name: 'dns_record_types', type: 'string', array: true, enum: DNS_RECORD_TYPES, description: 'Required DNS record types.' },
            { name: 'clubs', type: 'string', array: true, enum: CLUBS, description: 'Club membership filters.' },
            { name: 'marketplaces', type: 'string', array: true, enum: MARKETPLACES, description: 'Marketplace filters.' },
            { name: 'price_ton_min', type: 'string', description: 'Minimum current price in nanotons, encoded as a string.' },
            { name: 'price_ton_max', type: 'string', description: 'Maximum current price in nanotons, encoded as a string.' },
            { name: 'expiration_before', type: 'string', description: 'ISO timestamp upper bound for expiration.' },
            { name: 'expiration_after', type: 'string', description: 'ISO timestamp lower bound for expiration.' },
            { name: 'linked_wallet_address', type: 'string', description: 'Filter by linked wallet address.' },
            { name: 'owner_address', type: 'string', description: 'Filter by owner address.' },
            { name: 'is_banned', type: 'boolean', description: 'Whether to include only banned/non-banned domains.' },
            { name: 'sort', type: 'string', enum: LIST_DOMAIN_SORTS, description: 'Sort order.' },
            cloneParam(CURSOR_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: [
            'webdom catalog.list-domains --search gold --limit 5',
            'webdom catalog.list-domains --states for_sale --states for_secondary_auction --limit 10'
        ],
        outputDescription: 'Paginated domains catalog response.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'catalog', 'listDomains']
    }),
    sdkCommand({
        name: 'catalog.list-deals',
        layer: 'api',
        summary: 'List deals catalog.',
        description: 'Fetch deals with filters across sales, auctions, and swaps.',
        params: [
            { name: 'types', type: 'string', array: true, enum: DEAL_TYPES, description: 'Deal types to include.' },
            { name: 'states', type: 'string', array: true, enum: DEAL_STATES, description: 'Deal states to include.' },
            cloneParam(DOMAIN_NAME_PARAM),
            cloneParam(DOMAIN_ZONE_PARAM),
            { name: 'seller_address', type: 'string', description: 'Filter by seller address.' },
            { name: 'buyer_address', type: 'string', description: 'Filter by buyer address.' },
            { name: 'marketplace_address', type: 'string', description: 'Filter by marketplace contract address.' },
            { name: 'currency', type: 'string', enum: CURRENCIES, description: 'Pricing currency filter.' },
            { name: 'price_ton_min', type: 'string', description: 'Minimum execution price in nanotons.' },
            { name: 'price_ton_max', type: 'string', description: 'Maximum execution price in nanotons.' },
            { name: 'created_after', type: 'string', description: 'ISO timestamp lower bound for creation time.' },
            { name: 'created_before', type: 'string', description: 'ISO timestamp upper bound for creation time.' },
            { name: 'expiration_after', type: 'string', description: 'ISO timestamp lower bound for expiration.' },
            { name: 'expiration_before', type: 'string', description: 'ISO timestamp upper bound for expiration.' },
            { name: 'is_collection', type: 'boolean', description: 'Whether the deal is a collection sale.' },
            { name: 'sort', type: 'string', enum: LIST_DEAL_SORTS, description: 'Sort order.' },
            cloneParam(CURSOR_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: [
            'webdom catalog.list-deals --types auction --states active --limit 10',
            'webdom catalog.list-deals --domain_zone ton --sort price_ton.desc --limit 5'
        ],
        outputDescription: 'Paginated deals catalog response.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'catalog', 'listDeals']
    }),
    sdkCommand({
        name: 'domains.resolve',
        layer: 'api',
        summary: 'Resolve domain to address.',
        description: 'Resolve a domain name to the linked wallet or owner address.',
        params: [cloneParam(DOMAIN_NAME_PARAM, { required: true })],
        examples: ['webdom domains.resolve --domain-name example.ton'],
        outputDescription: 'Resolved domain record.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'domains', 'resolve']
    }),
    sdkCommand({
        name: 'domains.back-resolve',
        layer: 'api',
        summary: 'Resolve address to domain.',
        description: 'Resolve a TON address back to its matching domain name.',
        params: [cloneParam(ADDRESS_PARAM, { required: true })],
        examples: ['webdom domains.back-resolve --address UQ...'],
        outputDescription: 'Resolved reverse lookup record.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'domains', 'backResolve']
    }),
    sdkCommand({
        name: 'domains.get',
        layer: 'api',
        summary: 'Get domain details.',
        description: 'Fetch a single domain with status, sale, DNS, and ownership info.',
        params: [cloneParam(DOMAIN_NAME_PARAM, { required: true })],
        examples: ['webdom domains.get --domain-name example.ton'],
        outputDescription: 'Single domain details.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'domains', 'get']
    }),
    sdkCommand({
        name: 'domains.list-transactions',
        layer: 'api',
        summary: 'List transactions for one domain.',
        description: 'Fetch paginated history for one domain.',
        params: [
            cloneParam(DOMAIN_NAME_PARAM, { required: true }),
            { name: 'action_types', type: 'string', array: true, enum: DOMAIN_ACTION_TYPES, description: 'Transaction action filters.' },
            { name: 'after_time', type: 'string', description: 'ISO timestamp lower bound.' },
            { name: 'before_time', type: 'string', description: 'ISO timestamp upper bound.' },
            { name: 'after_lt', type: 'string', description: 'Logical-time cursor lower bound.' },
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom domains.list-transactions --domain-name example.ton --limit 20'],
        outputDescription: 'Paginated domain transaction history.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'domains', 'listTransactions']
    }),
    sdkCommand({
        name: 'deals.get',
        layer: 'api',
        summary: 'Get deal details.',
        description: 'Fetch a single deal by contract address.',
        params: [{ name: 'deal_address', type: 'string', required: true, description: 'Deal contract address.' }],
        examples: ['webdom deals.get --deal-address EQ...'],
        outputDescription: 'Single deal details.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'deals', 'get']
    }),
    sdkCommand({
        name: 'deals.list-bids',
        layer: 'api',
        summary: 'List bids for one deal.',
        description: 'Fetch paginated bid history for a deal.',
        params: [
            { name: 'deal_address', type: 'string', required: true, description: 'Deal contract address.' },
            cloneParam(CURSOR_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom deals.list-bids --deal-address EQ... --limit 20'],
        outputDescription: 'Paginated deal bids.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'deals', 'listBids']
    }),
    sdkCommand({
        name: 'offers.get',
        layer: 'api',
        summary: 'Get offer details.',
        description: 'Fetch a single offer by contract address.',
        params: [{ name: 'offer_address', type: 'string', required: true, description: 'Offer contract address.' }],
        examples: ['webdom offers.get --offer-address EQ...'],
        outputDescription: 'Single offer details.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'offers', 'get']
    }),
    sdkCommand({
        name: 'offers.get-best',
        layer: 'api',
        summary: 'Get best offer for a domain.',
        description: 'Fetch the current best offer for a domain name.',
        params: [cloneParam(DOMAIN_NAME_PARAM, { required: true })],
        examples: ['webdom offers.get-best --domain-name example.ton'],
        outputDescription: 'Best offer summary.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'offers', 'getBest']
    }),
    sdkCommand({
        name: 'offers.list-mine',
        layer: 'api',
        summary: 'List the current user offers.',
        description: 'Fetch incoming and outgoing offers for the authenticated user.',
        auth: true,
        acceptsInput: 'none',
        params: [],
        examples: ['webdom offers.list-mine'],
        outputDescription: 'Authenticated user offer lists.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'offers', 'listMine']
    }),
    sdkCommand({
        name: 'users.search',
        layer: 'api',
        summary: 'Search users.',
        description: 'Search users by text query.',
        params: [
            { name: 'search', type: 'string', required: true, description: 'Free-text user search query.' },
            cloneParam(CURSOR_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom users.search --search webdom --limit 10'],
        outputDescription: 'Paginated user search results.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'users', 'search']
    }),
    sdkCommand({
        name: 'users.get',
        layer: 'api',
        summary: 'Get user profile.',
        description: 'Fetch a user profile by TON address.',
        params: [cloneParam(ADDRESS_PARAM, { required: true })],
        examples: ['webdom users.get --address UQ...'],
        outputDescription: 'Single user profile.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'users', 'get']
    }),
    sdkCommand({
        name: 'users.list-activity',
        layer: 'api',
        summary: 'List user activity.',
        description: 'Fetch paginated marketplace activity for one user.',
        params: [
            cloneParam(ADDRESS_PARAM, { required: true }),
            cloneParam(CURSOR_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom users.list-activity --address UQ... --limit 20'],
        outputDescription: 'Paginated user activity.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'users', 'listActivity']
    }),
    sdkCommand({
        name: 'analytics.market-overview',
        layer: 'api',
        summary: 'Get market overview.',
        description: 'Fetch market-wide summary metrics for one domain zone.',
        params: [cloneParam(DOMAIN_ZONE_PARAM, { required: true })],
        examples: ['webdom analytics.market-overview --domain-zone ton'],
        outputDescription: 'Market overview metrics.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'analytics', 'getMarketOverview']
    }),
    sdkCommand({
        name: 'analytics.market-charts',
        layer: 'api',
        summary: 'Get market charts.',
        description: 'Fetch market-wide chart series for one domain zone.',
        params: [cloneParam(DOMAIN_ZONE_PARAM, { required: true })],
        examples: ['webdom analytics.market-charts --domain-zone ton'],
        outputDescription: 'Market chart series.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'analytics', 'getMarketCharts']
    }),
    sdkCommand({
        name: 'analytics.top-sales',
        layer: 'api',
        summary: 'List top sales.',
        description: 'Fetch top sales ranked by volume.',
        params: [
            cloneParam(DOMAIN_ZONE_PARAM, { required: true }),
            { name: 'sale_segment', type: 'string', enum: SALE_SEGMENTS, required: true, description: 'Primary or secondary sales.' },
            { name: 'currency', type: 'string', enum: CURRENCIES, description: 'Optional currency filter.' },
            cloneParam(OFFSET_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom analytics.top-sales --domain-zone ton --sale-segment secondary --limit 10'],
        outputDescription: 'Top sales list.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'analytics', 'listTopSales']
    }),
    sdkCommand({
        name: 'analytics.user-rankings',
        layer: 'api',
        summary: 'List user rankings.',
        description: 'Fetch leaderboard rankings for one user metric.',
        params: [
            { name: 'rating', type: 'string', enum: USER_RATINGS, required: true, description: 'Ranking metric.' },
            cloneParam(DOMAIN_ZONE_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom analytics.user-rankings --rating total_purchases_volume --limit 10'],
        outputDescription: 'User ranking leaderboard.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'analytics', 'listUserRankings']
    }),
    sdkCommand({
        name: 'analytics.jetton-prices',
        layer: 'api',
        summary: 'Get jetton prices.',
        description: 'Fetch marketplace-configured jetton prices.',
        acceptsInput: 'none',
        params: [],
        examples: ['webdom analytics.jetton-prices'],
        outputDescription: 'Jetton price configuration.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'analytics', 'getJettonPrices']
    }),
    sdkCommand({
        name: 'marketplace.config',
        layer: 'api',
        summary: 'Get marketplace config.',
        description: 'Fetch marketplace deploy and fee configuration.',
        acceptsInput: 'none',
        params: [],
        examples: ['webdom marketplace.config'],
        outputDescription: 'Marketplace configuration object.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['api', 'marketplace', 'getConfig']
    }),
    sdkCommand({
        name: 'history.transactions',
        layer: 'api',
        summary: 'List global transaction history.',
        description: 'Fetch paginated marketplace transaction history.',
        params: [
            { name: 'types', type: 'string', array: true, enum: DOMAIN_ACTION_TYPES, description: 'Transaction action filters.' },
            cloneParam(DOMAIN_NAME_PARAM),
            cloneParam(DOMAIN_ZONE_PARAM),
            { name: 'deal_address', type: 'string', description: 'Filter by deal address.' },
            { name: 'user_address', type: 'string', description: 'Filter by user address.' },
            { name: 'only_webdom', type: 'boolean', description: 'Restrict to Webdom marketplace actions.' },
            { name: 'price_ton_min', type: 'string', description: 'Minimum TON price filter.' },
            { name: 'price_ton_max', type: 'string', description: 'Maximum TON price filter.' },
            { name: 'after_time', type: 'string', description: 'ISO timestamp lower bound.' },
            { name: 'before_time', type: 'string', description: 'ISO timestamp upper bound.' },
            { name: 'sort', type: 'string', enum: TRANSACTION_SORTS, description: 'Sort order.' },
            cloneParam(CURSOR_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom history.transactions --limit 20'],
        outputDescription: 'Paginated global transaction history.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'history', 'listTransactions']
    }),
    sdkCommand({
        name: 'history.auction-bids',
        layer: 'api',
        summary: 'List auction bid history.',
        description: 'Fetch paginated bid history across auctions.',
        params: [
            { name: 'after_time', type: 'string', description: 'ISO timestamp lower bound.' },
            { name: 'before_time', type: 'string', description: 'ISO timestamp upper bound.' },
            cloneParam(CURSOR_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom history.auction-bids --limit 20'],
        outputDescription: 'Paginated auction bid history.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'history', 'listAuctionBids']
    }),
    sdkCommand({
        name: 'history.sales',
        layer: 'api',
        summary: 'List sales history.',
        description: 'Fetch paginated marketplace sales history.',
        params: [
            { name: 'after_time', type: 'string', description: 'ISO timestamp lower bound.' },
            { name: 'before_time', type: 'string', description: 'ISO timestamp upper bound.' },
            cloneParam(DOMAIN_ZONE_PARAM),
            cloneParam(CURSOR_PARAM),
            cloneParam(LIMIT_PARAM)
        ],
        examples: ['webdom history.sales --domain-zone ton --limit 20'],
        outputDescription: 'Paginated sales history.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'history', 'listSales']
    }),
    sdkCommand({
        name: 'auth.get-ton-proof-payload',
        layer: 'api',
        summary: 'Get TON Proof payload.',
        description: 'Fetch the current auth challenge payload for TON Proof signing.',
        acceptsInput: 'none',
        params: [],
        examples: ['webdom auth.get-ton-proof-payload'],
        outputDescription: 'TON Proof challenge payload.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['auth', 'getTonProofPayload']
    }),
    sdkCommand({
        name: 'auth.authenticate',
        layer: 'api',
        summary: 'Authenticate with wallet credentials.',
        description: 'Build and sign TON Proof using mnemonic/private key from flags, JSON input, or ENV, then persist the bearer token.',
        params: [
            { name: 'mnemonic', type: 'string', description: 'Wallet mnemonic phrase.' },
            { name: 'private_key', type: 'string', aliases: ['privateKey'], description: 'Wallet private key or seed as hex/base64.' },
            { name: 'public_key', type: 'string', aliases: ['publicKey'], description: 'Optional wallet public key as hex/base64.' },
            { name: 'wallet_address', type: 'string', aliases: ['walletAddress'], description: 'Wallet address for explicit address-based signing.' },
            { name: 'wallet_version', type: 'string', aliases: ['walletVersion'], description: 'Wallet version or `auto`.' },
            { name: 'wallet_id', type: 'number', aliases: ['walletId'], description: 'Optional wallet/subwallet id.' },
            { name: 'network_global_id', type: 'number', aliases: ['networkGlobalId'], description: 'Optional global network id.' },
            { name: 'workchain', type: 'number', description: 'Workchain to use for wallet resolution.' },
            { name: 'timestamp', type: 'number', description: 'Override proof timestamp.' },
            { name: 'expires_in_seconds', type: 'number', description: 'Requested auth token lifetime.' }
        ],
        examples: [
            'WEBDOM_WALLET_MNEMONIC="word1 word2 ..." webdom auth.authenticate',
            'webdom auth.authenticate --private-key deadbeef --wallet-address UQ...'
        ],
        outputDescription: 'Persisted bearer token envelope.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['auth', 'authenticate'],
        mapInput(input) {
            return {
                mnemonic: input.mnemonic,
                privateKey: input.private_key ?? input.privateKey,
                publicKey: input.public_key ?? input.publicKey,
                walletAddress: input.wallet_address ?? input.walletAddress,
                walletVersion: input.wallet_version ?? input.walletVersion,
                walletId: input.wallet_id ?? input.walletId,
                networkGlobalId: input.network_global_id ?? input.networkGlobalId,
                workchain: input.workchain,
                timestamp: input.timestamp,
                expires_in_seconds: input.expires_in_seconds
            };
        }
    }),
    sdkCommand({
        name: 'auth.exchange-ton-proof-for-token',
        layer: 'api',
        summary: 'Exchange TON Proof for a token.',
        description: 'Exchange an externally produced TON Proof payload for a bearer token.',
        params: [
            { name: 'challenge_id', type: 'string', required: true, description: 'Challenge id returned by auth.get-ton-proof-payload.' },
            { name: 'wallet_address', type: 'string', required: true, description: 'Wallet address used for signing.' },
            { name: 'wallet_public_key', type: 'string', required: true, description: 'Wallet public key used for signing.' },
            { name: 'proof', type: 'json', required: true, description: 'TON Proof object.' }
        ],
        examples: ['webdom auth.exchange-ton-proof-for-token --json \'{"challenge_id":"...","wallet_address":"...","wallet_public_key":"...","proof":{...}}\'' ],
        outputDescription: 'Persisted bearer token envelope.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['auth', 'exchangeTonProofForToken']
    }),
    sdkCommand({
        name: 'auth.revoke-current-token',
        layer: 'api',
        summary: 'Revoke the current token.',
        description: 'Revoke the currently persisted bearer token.',
        auth: true,
        acceptsInput: 'none',
        params: [],
        examples: ['webdom auth.revoke-current-token'],
        outputDescription: 'Token revocation result.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        sdkPath: ['auth', 'revokeCurrentToken']
    }),
    sdkCommand({
        name: 'auth.token.get',
        layer: 'api',
        summary: 'Read the persisted token.',
        description: 'Read the current bearer token from the configured token storage.',
        acceptsInput: 'none',
        params: [],
        examples: ['webdom auth.token.get'],
        outputDescription: 'Persisted bearer token or null.',
        outputSchema: {
            oneOf: [
                { type: 'string' },
                { type: 'null' }
            ]
        },
        sdkPath: ['auth', 'getToken']
    }),
    sdkCommand({
        name: 'auth.token.set',
        layer: 'api',
        summary: 'Persist a bearer token.',
        description: 'Write a bearer token into the configured token storage.',
        acceptsInput: 'scalar',
        params: [{ name: 'value', type: 'string', aliases: ['token'], required: true, description: 'Bearer token value.' }],
        examples: [
            'webdom auth.token.set --value demo-token',
            'echo \'"demo-token"\' | webdom auth.token.set --input -'
        ],
        outputDescription: 'Null on success.',
        outputSchema: {
            type: 'null'
        },
        sdkPath: ['auth', 'setToken'],
        mapInput(input) {
            return input.value ?? input.token;
        }
    }),
    sdkCommand({
        name: 'auth.token.clear',
        layer: 'api',
        summary: 'Clear the persisted token.',
        description: 'Remove the current bearer token from token storage.',
        acceptsInput: 'none',
        params: [],
        examples: ['webdom auth.token.clear'],
        outputDescription: 'Null on success.',
        outputSchema: {
            type: 'null'
        },
        sdkPath: ['auth', 'clearToken']
    })
];

export const INTROSPECTION_COMMANDS: CliCommandDefinition[] = [
    {
        name: 'commands',
        layer: 'introspection',
        summary: 'List supported commands.',
        description: 'Return machine-readable command metadata for discovery and agent planning.',
        aliases: [],
        acceptsInput: 'none',
        params: [
            { name: 'layer', type: 'string', enum: COMMAND_LAYERS, description: 'Optional layer filter.' },
            { name: 'search', type: 'string', description: 'Optional substring filter over names and summaries.' }
        ],
        examples: [
            'webdom commands',
            'webdom commands --layer workflow'
        ],
        outputDescription: 'Command catalog entries.',
        outputSchema: {
            type: 'array',
            items: {
                type: 'object'
            }
        },
        handler(_sdk, input, context) {
            const params = (input ?? {}) as { layer?: string; search?: string };
            const query = params.search?.toLowerCase();

            return context.registry
                .filter((command) => (params.layer ? command.layer === params.layer : true))
                .filter((command) => {
                    if (!query) {
                        return true;
                    }

                    return (
                        command.name.toLowerCase().includes(query) ||
                        command.summary.toLowerCase().includes(query) ||
                        command.aliases.some((alias) => alias.toLowerCase().includes(query))
                    );
                })
                .map((command) => ({
                    name: command.name,
                    layer: command.layer,
                    summary: command.summary,
                    aliases: command.aliases,
                    auth_required: command.auth ?? false,
                    accepts_input: command.acceptsInput ?? 'object'
                }));
        }
    },
    {
        name: 'schema',
        layer: 'introspection',
        summary: 'Return machine-readable schema for one command.',
        description: 'Return command metadata, JSON-shaped input schema, output schema, and examples.',
        aliases: [],
        acceptsInput: 'none',
        params: [
            { name: 'command', type: 'string', required: true, positionalIndex: 0, description: 'Command name or alias.' }
        ],
        examples: ['webdom schema find-domain', 'webdom schema domains.get'],
        outputDescription: 'Command schema object.',
        outputSchema: OBJECT_OUTPUT_SCHEMA,
        handler(_sdk, input, context) {
            const params = input as { command: string };
            const command = findCliCommand(context.registry, params.command);
            if (!command) {
                throw new Error(`Unknown command: ${params.command}`);
            }

            return buildCommandSchema(command);
        }
    },
    {
        name: 'help',
        layer: 'introspection',
        summary: 'Render human help for one command.',
        description: 'Render detailed human-readable help for one command.',
        aliases: [],
        acceptsInput: 'none',
        textOutput: true,
        params: [
            { name: 'command', type: 'string', required: true, positionalIndex: 0, description: 'Command name or alias.' }
        ],
        examples: ['webdom help find-domain', 'webdom help domains.get'],
        outputDescription: 'Human-readable help text.',
        outputSchema: {
            type: 'string'
        },
        handler(_sdk, input, context) {
            const params = input as { command: string };
            const command = findCliCommand(context.registry, params.command);
            if (!command) {
                throw new Error(`Unknown command: ${params.command}`);
            }

            return renderCommandHelp(command);
        }
    }
];
