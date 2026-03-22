import type { CliGlobalOptionDefinition, CliParamDefinition } from './types';

export const DOMAIN_ZONES = ['ton', 't.me'] as const;
export const DOMAIN_STATES = [
    'for_primary_auction',
    'for_sale',
    'for_secondary_auction',
    'not_for_sale',
    'collection',
    'expired',
    'for_auction_with_bids'
] as const;
export const CHARACTER_FILTERS = [
    'exclude_hyphens',
    'exclude_digits',
    'idn_domains',
    'exclude_punycode',
    'digits_only',
    'letters_only',
    'with_hyphens',
    'hyphen_separated'
] as const;
export const DNS_RECORD_TYPES = ['wallet', 'ton_storage', 'ton_site'] as const;
export const CLUBS = ['club_10k', 'club_100k'] as const;
export const MARKETPLACES = ['webdom', 'getgems', 'fragment', 'marketapp'] as const;
export const DEAL_TYPES = ['fix_price_sale', 'auction', 'domains_swap'] as const;
export const DEAL_STATES = ['uninitialized', 'active', 'completed', 'cancelled'] as const;
export const CURRENCIES = ['TON', 'USDT', 'WEB3'] as const;
export const DOMAIN_ACTION_TYPES = [
    'primary_purchase',
    'secondary_purchase',
    'put_on_sale',
    'cancel_sale',
    'put_on_auction',
    'dns_auction_bid',
    'cancel_auction',
    'transfer',
    'renew',
    'change_records',
    'change_sale_price'
] as const;
export const LIST_DOMAIN_SORTS = [
    'relevance.desc',
    'name.asc',
    'name.desc',
    'name_length.asc',
    'name_length.desc',
    'last_renewal_time.desc',
    'last_renewal_time.asc',
    'registration_time.desc',
    'registration_time.asc',
    'current_price_ton.desc',
    'current_price_ton.asc',
    'last_price_ton.desc',
    'last_price_ton.asc',
    'last_sale_time.desc',
    'last_sale_time.asc',
    'last_price_difference_ton.desc',
    'last_price_difference_ton.asc',
    'sale_created_at.asc',
    'sale_created_at.desc',
    'deal_ending_time.asc',
    'watchlists_count.desc'
] as const;
export const LIST_DEAL_SORTS = [
    'created_at.desc',
    'created_at.asc',
    'expiration.desc',
    'expiration.asc',
    'price_ton.desc',
    'price_ton.asc',
    'execution_price.desc',
    'execution_price.asc'
] as const;
export const SALE_SEGMENTS = ['primary', 'secondary'] as const;
export const USER_RATINGS = [
    'domains_count',
    'sales_count',
    'sales_volume',
    'primary_purchases_count',
    'primary_purchases_volume',
    'secondary_purchases_count',
    'secondary_purchases_volume',
    'total_purchases_volume'
] as const;
export const TRANSACTION_SORTS = ['time.desc', 'time.asc', 'price_ton.desc', 'price_ton.asc', 'domain.asc', 'domain.desc'] as const;
export const COMMAND_LAYERS = ['introspection', 'workflow', 'api'] as const;

export const LIMIT_PARAM: CliParamDefinition = {
    name: 'limit',
    type: 'number',
    description: 'Maximum number of items to return.'
};

export const CURSOR_PARAM: CliParamDefinition = {
    name: 'cursor',
    type: 'string',
    description: 'Opaque cursor returned by the previous page.'
};

export const OFFSET_PARAM: CliParamDefinition = {
    name: 'offset',
    type: 'number',
    description: 'Numeric offset for endpoints that use offset pagination.'
};

export const DOMAIN_ZONE_PARAM: CliParamDefinition = {
    name: 'domain_zone',
    type: 'string',
    enum: DOMAIN_ZONES,
    description: 'Domain zone.'
};

export const ADDRESS_PARAM: CliParamDefinition = {
    name: 'address',
    type: 'string',
    description: 'TON address.'
};

export const DOMAIN_NAME_PARAM: CliParamDefinition = {
    name: 'domain_name',
    type: 'string',
    description: 'Domain name.'
};

export const PAGINATED_OUTPUT_SCHEMA = {
    type: 'object',
    properties: {
        items: {
            type: 'array',
            items: {}
        },
        pageInfo: {
            type: 'object'
        },
        meta: {
            type: 'object'
        }
    }
} satisfies Record<string, unknown>;

export const OBJECT_OUTPUT_SCHEMA = {
    type: 'object'
} satisfies Record<string, unknown>;

export const CLI_GLOBAL_OPTIONS: CliGlobalOptionDefinition[] = [
    { name: 'api-base-url', type: 'string', description: 'Override the Agent API base URL.' },
    { name: 'token', type: 'string', description: 'Use the provided bearer token for this invocation only.' },
    { name: 'token-file', type: 'string', description: 'Read and persist tokens in a shared file across invocations.' },
    { name: 'toncenter-endpoint', type: 'string', description: 'Override the TON client endpoint for tx helpers.' },
    { name: 'config', type: 'string', description: 'Load JSON createWebdomSdk(...) options from a file.' },
    { name: 'json', type: 'string', description: 'Inline JSON payload merged like --input.' },
    { name: 'input', type: 'string', description: 'Load JSON params from stdin (`-`) or a file path.' },
    { name: 'select', type: 'string', description: 'Select a nested field from the command result before printing.' },
    { name: 'jsonl', type: 'boolean', description: 'Print arrays as one JSON object per line.' },
    { name: 'pretty', type: 'boolean', description: 'Pretty-print JSON output instead of compact JSON.' }
];
