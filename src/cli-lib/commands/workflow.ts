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

export const WORKFLOW_COMMANDS: CliCommandDefinition[] = [
    sdkCommand({
        name: 'find-domain',
        layer: 'workflow',
        summary: 'Search domains with common filters.',
        description: 'Wrapper around catalog.list-domains.',
        aliases: ['find-domains'],
        params: [
            { name: 'query', type: 'string', aliases: ['search'], description: 'Free-text search query.' },
            { name: 'zone', type: 'string', aliases: ['domain_zone'], enum: DOMAIN_ZONES, description: 'Domain zone.' },
            cloneParam(LIMIT_PARAM),
            cloneParam(CURSOR_PARAM),
            { name: 'sort', type: 'string', enum: LIST_DOMAIN_SORTS, description: 'Sort order.' },
            { name: 'owner_address', type: 'string', description: 'Filter by owner address.' },
            { name: 'linked_wallet_address', type: 'string', description: 'Filter by linked wallet address.' }
        ],
        examples: [
            'webdom find-domain --query gold --zone ton --limit 5',
            'webdom find-domain --owner-address UQ... --limit 20'
        ],
        outputDescription: 'Paginated domain search results.',
        outputSchema: PAGINATED_OUTPUT_SCHEMA,
        sdkPath: ['api', 'catalog', 'listDomains'],
        mapInput(input) {
            return {
                search: input.query ?? input.search,
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
    sdkCommand({
        name: 'build-accept-offer-tx',
        layer: 'workflow',
        summary: 'Build a purchase-offer acceptance transaction.',
        description: 'Prepare a TonConnect-ready message for accepting a purchase offer.',
        params: [
            { name: 'domain_address', type: 'string', required: true, description: 'Domain contract address.' },
            { name: 'offer_address', type: 'string', required: true, description: 'Offer contract address.' },
            { name: 'user_address', type: 'string', required: true, description: 'Seller wallet address.' },
            { name: 'query_id', type: 'number', description: 'Optional query id.' },
            { name: 'is_tg_username', type: 'boolean', description: 'Whether the asset is a Telegram username.' }
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
                queryId: input.query_id,
                isTgUsername: input.is_tg_username
            };
        }
    })
];
