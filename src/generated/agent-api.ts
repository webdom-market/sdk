/**
 * This file is auto-generated from openapi/agent-api-openapi.yaml.
 * Run `npm run openapi:generate` after updating the OpenAPI spec snapshot.
 */

export interface paths {
    "/analytics/market/charts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get market chart data
         * @description Returns analytics derived from a precomputed snapshot.
         *     The response is not transactionally real-time.
         *     `snapshot_updated_at` is the snapshot generation timestamp exposed by the API.
         */
        get: operations["getMarketCharts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/analytics/market/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get market overview analytics
         * @description Returns analytics derived from a precomputed snapshot.
         *     The response is not transactionally real-time.
         *     `snapshot_updated_at` is the snapshot generation timestamp exposed by the API.
         */
        get: operations["getMarketOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/analytics/market/top-sales": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get top sales list
         * @description Returns analytics derived from a precomputed snapshot.
         *     The response is not transactionally real-time.
         *     `snapshot_updated_at` is the snapshot generation timestamp exposed by the API.
         */
        get: operations["listTopSales"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/analytics/prices/jettons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get jetton price baselines
         * @description Returns the latest jetton price snapshot exposed by the API.
         *     `source_timestamp` is the timestamp of the upstream price source snapshot used for these values.
         *     `generated_at` is the timestamp when this response payload was generated.
         */
        get: operations["getJettonPrices"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/analytics/users/rankings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get user rankings */
        get: operations["listUserRankings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/tokens/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke the current agent API token */
        delete: operations["revokeCurrentToken"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/ton-proof/payload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get TON Proof challenge for agent authentication
         * @description Returns a single-use payload that the agent must sign via TON Proof.
         *     The payload is short-lived and is later exchanged for a bearer API token.
         */
        get: operations["getTonProofPayload"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/ton-proof/tokens": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Exchange TON Proof for an agent API token
         * @description Verifies wallet ownership via TON Proof and issues a bearer API token bound to
         *     the authenticated wallet. The plaintext token is returned only once at creation time.
         */
        post: operations["exchangeTonProofForToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/deals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search deals
         * @description Cursor contract:
         *     - `cursor` is an opaque server-generated continuation token.
         *     - The token is offset-based over the current ordered result set, not snapshot-based.
         *     - Reuse `next_cursor` only with the same `sort` and the same filter set.
         *     - Reusing a cursor with a different `sort` returns `400`.
         *     - If matching rows are inserted, removed, or reordered between requests, duplicates or skips are possible.
         *     - The end of the feed is indicated by `page_info.has_more = false` and `page_info.next_cursor = null`.
         *     Price-sort handling:
         *     - For `price_ton.*` and `execution_price.*`, deals without the corresponding sort key are always placed at the end of the result set (`nulls_last`).
         *     - `domains_swap` rows do not interleave with priced deals for price-based sorts; they remain in the tail portion of the result set.
         */
        get: operations["listDeals"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/domains": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search domains
         * @description Machine-oriented domain discovery endpoint with cursor pagination.
         *     All query parameters are optional unless explicitly marked as required.
         *     Response shaping rules:
         *     - The endpoint returns only domains produced by the requested filtering and sorting.
         *     - No pinned or promoted domains are injected into the first page or any later page.
         *     - No `pinned_count` or similar out-of-band pinned-domain metadata is returned.
         *     Cursor contract:
         *     - `cursor` is an opaque server-generated continuation token.
         *     - The token is offset-based over the current ordered result set, not snapshot-based.
         *     - Reuse `next_cursor` only with the same `sort` and the same filter set.
         *     - Reusing a cursor with a different `sort` returns `400`.
         *     - If matching rows are inserted, removed, or reordered between requests, duplicates or skips are possible.
         *     - The end of the feed is indicated by `page_info.has_more = false` and `page_info.next_cursor = null`.
         *     Sort-key null handling:
         *     - For `current_price_ton.*`, `last_price_ton.*`, `last_sale_time.*`, `sale_created_at.*`, and `deal_ending_time.*`, rows without the sort key are always placed at the end of the result set (`nulls_last`), regardless of sort direction.
         *     Multi-value filter semantics:
         *     - `states`: OR
         *     - `categories`: OR
         *     - `marketplaces`: OR
         *     - `clubs`: OR
         *     - `dns_record_types`: AND
         *     - `search` + `regex`: AND when both are provided.
         *     - `characters`: AND. The following combinations are invalid and return `400`:
         *       `idn_domains` + `exclude_punycode`,
         *       `digits_only` + `exclude_digits`,
         *       `letters_only` + `digits_only`,
         *       `with_hyphens` + `exclude_hyphens`,
         *       `hyphen_separated` + `exclude_hyphens`.
         */
        get: operations["listDomains"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/domains/available-labels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search available .ton labels
         * @description Searches the prepared availability snapshot for currently unminted `.ton` labels.
         *     Cursor contract:
         *     - `cursor` is an opaque server-generated continuation token.
         *     - The token binds to the normalized regex, sort order, length filters, boolean filters, first-character filter, dataset tags, dataset categories, and the current snapshot token.
         *     - Reusing a cursor with different filters or after the snapshot is rebuilt returns `400`.
         *     - The end of the feed is indicated by `page_info.has_more = false` and `page_info.next_cursor = null`.
         */
        get: operations["listAvailableDomainLabels"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/deals/{deal_address}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get deal details */
        get: operations["getDeal"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/deals/{deal_address}/bids": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get auction bid history
         * @description Results are ordered by chain position descending: `lt DESC`, then `tx_hash DESC`.
         *     Cursor contract:
         *     - `cursor` is an opaque server-generated continuation token.
         *     - The token is offset-based over the current ordered result set, not snapshot-based.
         *     - Reuse `next_cursor` only with the same request parameters.
         *     - If matching rows are inserted, removed, or reordered between requests, duplicates or skips are possible.
         *     - The end of the feed is indicated by `page_info.has_more = false` and `page_info.next_cursor = null`.
         */
        get: operations["listDealBids"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/domains/{domain_name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get domain details */
        get: operations["getDomain"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/domains/{domain_name}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get domain transaction history
         * @description Ordered by descending blockchain position. Pagination is seek-based via `after_lt`
         *     and stable tie-breaking is done with transaction hash on equal `lt`.
         */
        get: operations["listDomainTransactions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/domains/back-resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Back resolve wallet address to domain
         * @description Reverse-resolution semantics:
         *     - `200` with `domain_name = null` means no reverse mapping was found for the provided wallet address.
         *     - `404` is not used by this endpoint for reverse-resolution misses.
         */
        get: operations["backResolveDomain"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/domains/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Resolve domain name to wallet-related data
         * @description Resolution semantics:
         *     - `404` means the domain does not exist.
         *     - `200` with `resolved_wallet_address = null` means the domain exists, but no linked wallet or wallet DNS record is available.
         */
        get: operations["resolveDomain"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/history/auctions/bids": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get global auction bid feed
         * @description Results are ordered by chain position descending: `lt DESC`, then `tx_hash DESC`.
         *     Cursor contract:
         *     - `cursor` is an opaque server-generated continuation token.
         *     - The token is offset-based over the current ordered result set, not snapshot-based.
         *     - Reuse `next_cursor` only with the same request parameters.
         *     - If matching rows are inserted, removed, or reordered between requests, duplicates or skips are possible.
         *     - The end of the feed is indicated by `page_info.has_more = false` and `page_info.next_cursor = null`.
         */
        get: operations["listAuctionBids"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/history/sales": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get global completed sale feed
         * @description Results are ordered by chain position descending: `lt DESC`, then `tx_hash DESC`.
         *     Cursor contract:
         *     - `cursor` is an opaque server-generated continuation token.
         *     - The token is offset-based over the current ordered result set, not snapshot-based.
         *     - Reuse `next_cursor` only with the same filter set.
         *     - If matching rows are inserted, removed, or reordered between requests, duplicates or skips are possible.
         *     - The end of the feed is indicated by `page_info.has_more = false` and `page_info.next_cursor = null`.
         */
        get: operations["listSales"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/history/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get global transaction feed
         * @description Cursor contract:
         *     - `cursor` is an opaque server-generated continuation token.
         *     - The token is offset-based over the current ordered result set, not snapshot-based.
         *     - Reuse `next_cursor` only with the same `sort` and the same filter set.
         *     - Reusing a cursor with a different `sort` returns `400`.
         *     - If matching rows are inserted, removed, or reordered between requests, duplicates or skips are possible.
         *     - The end of the feed is indicated by `page_info.has_more = false` and `page_info.next_cursor = null`.
         *     Ordering details:
         *     - `time.*` sorts are ordered by chain position using `lt` and `tx_hash`.
         *     - `domain.*` sorts use `domain_name` with `lt` and `tx_hash` as deterministic tie-breakers.
         *     - `price_ton.*` sorts use normalized TON value rather than a raw response field, with `lt` and `tx_hash` as deterministic tie-breakers.
         *     - `price_ton.asc|desc` excludes rows that do not have a normalized TON price before sorting is applied; this is filtering, not `nulls_last`.
         */
        get: operations["listTransactions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/marketplace/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get marketplace deploy configuration
         * @description Returns the current marketplace deploy configuration, including deploy fees,
         *     commission rates, and per-contract deployment constraints.
         */
        get: operations["getMarketplaceConfig"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/offers/{offer_address}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get offer details */
        get: operations["getOffer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/offers/best": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get best offer for a domain
         * @description Best-offer lookup semantics:
         *     - `404` means the domain does not exist.
         *     - `200` with `offer = null` means the domain exists, but there are no active offers.
         */
        get: operations["getBestOffer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/offers/my": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get incoming and outgoing offers for current authenticated user
         * @description `incoming` includes offers targeting domains currently controlled by the authenticated user,
         *     including domain-level quick-sale style multiple offers.
         *     Both `incoming` and `outgoing` contain only active, not-expired offers or offer rows.
         */
        get: operations["listMyOffers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{address}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get public user profile and stats
         * @description This endpoint accepts optional bearer authentication.
         *     When the caller is authenticated, viewer-dependent fields are resolved relative to that viewer.
         *     For unauthenticated requests:
         *     - `viewer_context.is_owner = false`
         *     - `viewer_context.is_watching = false`
         *     - `subscription = null`
         */
        get: operations["getUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{address}/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get user-related transaction history
         * @description Results are ordered by chain position descending: `lt DESC`, then `tx_hash DESC`.
         *     Cursor contract:
         *     - `cursor` is an opaque server-generated continuation token.
         *     - The token is offset-based over the current ordered result set, not snapshot-based.
         *     - Reuse `next_cursor` only with the same request parameters.
         *     - If matching rows are inserted, removed, or reordered between requests, duplicates or skips are possible.
         *     - The end of the feed is indicated by `page_info.has_more = false` and `page_info.next_cursor = null`.
         */
        get: operations["listUserActivity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search users
         * @description Searches users by a generic search string across supported identity fields.
         *     Results use the endpoint-defined deterministic search ranking for the current `search` value.
         *     Cursor contract:
         *     - `cursor` is an opaque server-generated continuation token.
         *     - The token is offset-based over the current ordered result set, not snapshot-based.
         *     - Reuse `next_cursor` only with the same `search` value.
         *     - If matching rows or ranking inputs change between requests, duplicates or skips are possible.
         *     - The end of the feed is indicated by `page_info.has_more = false` and `page_info.next_cursor = null`.
         */
        get: operations["searchUsers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description Canonical user-friendly TON address string used across the public API. */
        AddressObject: string;
        AgentApiToken: {
            /** @description Returned only at token creation time. */
            access_token: string;
            /** Format: date-time */
            expires_at: string | null;
            /** @enum {string} */
            token_type: "Bearer";
            wallet_address: components["schemas"]["AddressObject"];
        };
        AgentApiTokenEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["AgentApiToken"];
        };
        AvailableLabelFilterOptions: {
            categories: string[];
            tags: components["schemas"]["AvailableLabelFilterTag"][];
        };
        AvailableLabelFilterTag: {
            label: string;
            /** @enum {string} */
            value: "eth_minted" | "sol_minted" | "top_100_web2" | "top_200_web2" | "top_500_web2" | "top_1k_web2" | "top_2k_web2" | "top_5k_web2" | "top_10k_web2" | "top_50k_web2" | "top_100k_web2" | "top_200k_web2" | "top_500k_web2" | "top_1m_web2";
        };
        AvailableLabelItem: {
            /** @description Category from `available_domains.csv` when present. */
            category: string | null;
            /** @description Available `.ton` label without the suffix. */
            label: string;
            tags: ("eth_minted" | "sol_minted" | "top_100_web2" | "top_200_web2" | "top_500_web2" | "top_1k_web2" | "top_2k_web2" | "top_5k_web2" | "top_10k_web2" | "top_50k_web2" | "top_100k_web2" | "top_200k_web2" | "top_500k_web2" | "top_1m_web2")[];
        };
        AvailableLabelListEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: {
                filter_options: components["schemas"]["AvailableLabelFilterOptions"];
                /** @description Available `.ton` labels with dataset metadata. */
                items: components["schemas"]["AvailableLabelItem"][];
            };
            page_info: components["schemas"]["PageInfo"];
        };
        BackResolveEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["BackResolveResult"];
        };
        BackResolveResult: {
            /** @description Domain name resolved from the wallet address. `null` when no reverse mapping is found. */
            domain_name: string | null;
            /** Format: date-time */
            last_updated_at: string | null;
        };
        BaseEnvelope: {
            meta: components["schemas"]["Meta"];
            /** @enum {boolean} */
            success: true;
        };
        BestOfferEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: {
                domain_name: string;
                /** @description Best active offer for the domain. `null` when the domain exists but has no active offers. */
                offer: components["schemas"]["BestOfferSummary"] | null;
            };
        };
        BestOfferSummary: {
            offer_address: components["schemas"]["AddressObject"];
            offer_type: components["schemas"]["OfferType"];
            price: components["schemas"]["Money"];
            /** Format: date-time */
            valid_until: string;
        };
        Bid: {
            auction_address: components["schemas"]["AddressObject"];
            bid_value: components["schemas"]["Money"];
            bidder_address: components["schemas"]["AddressObject"];
            domains_list: string[];
            /** Format: date-time */
            timestamp: string;
            tx_hash: string;
        };
        BidListEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: {
                items: components["schemas"]["Bid"][];
            };
            page_info: components["schemas"]["PageInfo"];
        };
        /**
         * @description Character-set filter for the domain label. Invalid combinations are `idn_domains` + `exclude_punycode`, `digits_only` + `exclude_digits`, `letters_only` + `digits_only`, `with_hyphens` + `exclude_hyphens`, and `hyphen_separated` + `exclude_hyphens`.
         * @enum {string}
         */
        CharacterFilter: "exclude_hyphens" | "exclude_digits" | "idn_domains" | "exclude_punycode" | "digits_only" | "letters_only" | "with_hyphens" | "hyphen_separated";
        CurrencyAmountTotals: {
            TON: components["schemas"]["Money"];
            USDT: components["schemas"]["Money"];
            WEB3: components["schemas"]["Money"];
        };
        /** @enum {string} */
        CurrencyCode: "TON" | "USDT" | "WEB3";
        CurrencyCountTotals: {
            TON: number;
            USDT: number;
            WEB3: number;
        };
        CurrentSaleSummary: {
            address: components["schemas"]["AddressObject"];
            /** Format: date-time */
            created_at: string;
            deal_type: components["schemas"]["DealType"];
            price: components["schemas"]["Money"] | null;
            /** Format: date-time */
            valid_until: string;
        };
        Deal: components["schemas"]["MarketRecordBase"] & {
            capabilities: components["schemas"]["DealCapabilities"];
            marketplace: {
                address: components["schemas"]["AddressObject"];
                name: string;
            };
            pricing: components["schemas"]["DealPricing"];
            state: components["schemas"]["DealState"];
            timing: components["schemas"]["DealTiming"];
            type: components["schemas"]["DealType"];
        };
        DealCapabilities: {
            bid_available: boolean;
            cancellation_available: boolean;
            purchase_available: boolean;
        };
        DealEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["Deal"];
        };
        DealListEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: {
                items: components["schemas"]["Deal"][];
            };
            page_info: components["schemas"]["PageInfo"];
        };
        DealPricing: {
            execution_price_ton: components["schemas"]["Money"] | null;
            max_bid_value: components["schemas"]["Money"] | null;
            min_bid_value: components["schemas"]["Money"] | null;
            next_min_bid: components["schemas"]["Money"] | null;
            price: components["schemas"]["Money"] | null;
        };
        /** @enum {string} */
        DealState: "uninitialized" | "active" | "completed" | "cancelled";
        DealTiming: {
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            last_bid_time: string | null;
            /** Format: date-time */
            start_time: string | null;
            /** Format: date-time */
            valid_until: string;
        };
        /** @enum {string} */
        DealType: "fix_price_sale" | "auction" | "domains_swap";
        DnsRecords: {
            raw: {
                [key: string]: unknown;
            };
            ton_site: string | null;
            ton_storage: string | null;
            wallet: string | null;
        };
        /** @enum {string} */
        DnsRecordType: "wallet" | "ton_storage" | "ton_site";
        Domain: {
            address: components["schemas"]["AddressObject"];
            categories: string[];
            current_sale: components["schemas"]["CurrentSaleSummary"] | null;
            description: string | null;
            dns_records: components["schemas"]["DnsRecords"];
            domain_zone: components["schemas"]["DomainZoneValue"];
            /** Format: date-time */
            last_renewal_time: string;
            last_sale: components["schemas"]["LastSaleSummary"] | null;
            /** Format: date-time */
            last_updated_at: string;
            linked_wallet_address: (string & components["schemas"]["AddressObject"]) | null;
            name: string;
            name_length: number;
            owner: (string & components["schemas"]["AddressObject"]) | null;
            owner_inited: boolean;
            /** Format: date-time */
            registration_time: string | null;
            /** @description Packed relevance score serialized as a string because the value can exceed JavaScript's safe integer range. */
            relevance_score: string;
            sale_address: (string & components["schemas"]["AddressObject"]) | null;
            /** @enum {string|null} */
            sale_type: "fix_price" | "auction" | "domain_swap" | null;
            status: components["schemas"]["DomainStatus"];
            /** @enum {string} */
            type: "domain";
            watchlists_count: number;
        };
        /** @enum {string} */
        DomainActionType: "primary_purchase" | "secondary_purchase" | "put_on_sale" | "cancel_sale" | "put_on_auction" | "dns_auction_bid" | "cancel_auction" | "transfer" | "renew" | "change_records" | "change_sale_price";
        DomainEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["Domain"];
        };
        DomainLengthAnalyticsEntry: {
            /** Format: double */
            average_price_ton?: number | null;
            /** Format: double */
            floor_price_ton: number;
            on_sale_count: number;
            total_count: number;
        };
        DomainListEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: {
                items: components["schemas"]["Domain"][];
            };
            page_info: components["schemas"]["PageInfo"];
        };
        /** @enum {string} */
        DomainStateFilter: "for_primary_auction" | "for_sale" | "for_secondary_auction" | "not_for_sale" | "collection" | "expired" | "for_auction_with_bids";
        DomainStatus: {
            is_banned: boolean;
            is_expired: boolean;
            is_for_sale: boolean;
            is_on_primary_auction: boolean;
            is_on_secondary_auction: boolean;
            is_on_swap_contract: boolean;
        };
        DomainStatusAnalytics: {
            expired: number;
            expiring_in_1_day: number;
            expiring_in_7_days: number;
            not_for_sale: number;
            on_auction: number;
            on_sale: number;
        };
        /** @enum {string} */
        DomainZoneValue: "ton" | "t.me";
        ErrorEnvelope: {
            error: components["schemas"]["ErrorObject"];
            meta: components["schemas"]["Meta"];
            /** @enum {boolean} */
            success: false;
        };
        ErrorObject: {
            blocking_issues?: string[];
            /** @enum {string} */
            code: "INVALID_ARGUMENT" | "UNAUTHORIZED" | "NOT_FOUND" | "TOO_MANY_REQUESTS" | "INTERNAL_ERROR";
            details?: {
                [key: string]: unknown;
            };
            message: string;
            retryable?: boolean;
            suggested_fixes?: string[];
        };
        JettonPrices: {
            /**
             * Format: date-time
             * @description Timestamp when this response payload was generated.
             */
            generated_at: string;
            /**
             * Format: date-time
             * @description Timestamp of the upstream price-source snapshot used to derive these values.
             */
            source_timestamp: string;
            /** Format: float */
            usdt_price_ton: number;
            /** Format: float */
            web3_price_ton: number;
        };
        JettonPricesEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["JettonPrices"];
        };
        LastSaleSummary: {
            price: components["schemas"]["Money"];
            /** Format: date-time */
            time: string;
        };
        MarketCharts: {
            domains_length: {
                [key: string]: components["schemas"]["DomainLengthAnalyticsEntry"];
            };
            mints_count_in_1_year: components["schemas"]["CurrencyCountTotals"];
            mints_count_in_7_days: components["schemas"]["CurrencyCountTotals"];
            mints_count_in_30_days: components["schemas"]["CurrencyCountTotals"];
            mints_count_in_60_days: components["schemas"]["CurrencyCountTotals"];
            mints_count_in_90_days: components["schemas"]["CurrencyCountTotals"];
            mints_history: {
                TON: components["schemas"]["SalesHistoryPoint"][];
                USDT: components["schemas"]["SalesHistoryPoint"][];
                WEB3: components["schemas"]["SalesHistoryPoint"][];
            };
            mints_volume_in_1_year: components["schemas"]["CurrencyAmountTotals"];
            mints_volume_in_7_days: components["schemas"]["CurrencyAmountTotals"];
            mints_volume_in_30_days: components["schemas"]["CurrencyAmountTotals"];
            mints_volume_in_60_days: components["schemas"]["CurrencyAmountTotals"];
            mints_volume_in_90_days: components["schemas"]["CurrencyAmountTotals"];
            primary_sales_count: components["schemas"]["CurrencyCountTotals"];
            primary_sales_volume: components["schemas"]["CurrencyAmountTotals"];
            sales_count_in_1_year: components["schemas"]["CurrencyCountTotals"];
            sales_count_in_7_days: components["schemas"]["CurrencyCountTotals"];
            sales_count_in_30_days: components["schemas"]["CurrencyCountTotals"];
            sales_count_in_60_days: components["schemas"]["CurrencyCountTotals"];
            sales_count_in_90_days: components["schemas"]["CurrencyCountTotals"];
            sales_history: {
                TON: components["schemas"]["SalesHistoryPoint"][];
                USDT: components["schemas"]["SalesHistoryPoint"][];
                WEB3: components["schemas"]["SalesHistoryPoint"][];
            };
            sales_volume_in_1_year: components["schemas"]["CurrencyAmountTotals"];
            sales_volume_in_7_days: components["schemas"]["CurrencyAmountTotals"];
            sales_volume_in_30_days: components["schemas"]["CurrencyAmountTotals"];
            sales_volume_in_60_days: components["schemas"]["CurrencyAmountTotals"];
            sales_volume_in_90_days: components["schemas"]["CurrencyAmountTotals"];
            secondary_sales_count: components["schemas"]["CurrencyCountTotals"];
            secondary_sales_volume: components["schemas"]["CurrencyAmountTotals"];
            /** Format: date-time */
            snapshot_updated_at: string;
            total_sales_count: components["schemas"]["CurrencyCountTotals"];
            total_sales_volume: components["schemas"]["CurrencyAmountTotals"];
        };
        MarketChartsEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["MarketCharts"];
        };
        MarketOverview: {
            domains_count: number;
            domains_on_sale_count: number;
            domains_owners: number;
            domains_statuses: components["schemas"]["DomainStatusAnalytics"];
            /** Format: date-time */
            snapshot_updated_at: string;
        };
        MarketOverviewEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["MarketOverview"];
        };
        MarketParticipants: {
            buyer_address: (string & components["schemas"]["AddressObject"]) | null;
            last_bidder_address: (string & components["schemas"]["AddressObject"]) | null;
            owner_address: (string & components["schemas"]["AddressObject"]) | null;
            seller_address: (string & components["schemas"]["AddressObject"]) | null;
        };
        MarketplaceConfig: {
            address: components["schemas"]["AddressObject"];
            deploy_configs: {
                [key: string]: components["schemas"]["MarketplaceDeployConfig"];
            };
            /** Format: date-time */
            last_updated_at: string;
            name: string;
            promotion_prices: components["schemas"]["MarketplacePromotionPrices"];
        };
        MarketplaceConfigEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["MarketplaceConfig"];
        };
        MarketplaceDeployConfig: {
            alias: string;
            code_hash: string;
            /** Format: double */
            commission_factor?: number | null;
            /** Format: double */
            commission_factor_usdt?: number | null;
            /** Format: double */
            commission_factor_web3?: number | null;
            completion_commission?: components["schemas"]["Money"] | null;
            deploy_fee: components["schemas"]["Money"];
            deploy_function_code_hash: string;
            deploy_type: string;
            max_commission?: components["schemas"]["Money"] | null;
            max_commission_usdt?: components["schemas"]["Money"] | null;
            max_commission_web3?: components["schemas"]["Money"] | null;
            min_duration?: number | null;
            min_duration_usdt?: number | null;
            min_duration_web3?: number | null;
            min_price?: components["schemas"]["Money"] | null;
            min_price_usdt?: components["schemas"]["Money"] | null;
            min_price_web3?: components["schemas"]["Money"] | null;
            min_time_increment?: number | null;
            min_time_increment_usdt?: number | null;
            min_time_increment_web3?: number | null;
        };
        MarketplacePromotionPeriodPrices: {
            colored_price: components["schemas"]["Money"];
            hot_price: components["schemas"]["Money"];
        };
        MarketplacePromotionPrices: {
            move_up_price: components["schemas"]["Money"];
            period_prices: {
                [key: string]: components["schemas"]["MarketplacePromotionPeriodPrices"];
            };
        };
        MarketRecordBase: {
            address: components["schemas"]["AddressObject"];
            domain_names: string[];
            /** Format: date-time */
            last_updated_at: string;
            participants: components["schemas"]["MarketParticipants"];
            /** @description Parsed contract version index inferred from the on-chain code hash. */
            version_index: number;
        };
        Meta: {
            api_version: string;
            request_id: string;
        };
        Money: {
            amount: string;
            /**
             * Format: double
             * @description Human-readable decimal amount in the currency's major units, for example `10.1`.
             */
            amount_decimal: number;
            currency: components["schemas"]["CurrencyCode"];
            decimals: number;
        };
        MultipleOfferContract: components["schemas"]["OfferContractBase"] & {
            /** @enum {string} */
            offer_type: "multiple_offer";
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            offer_type: "MultipleOfferContract";
        };
        MyOffers: {
            /** Format: date-time */
            generated_at: string;
            incoming: components["schemas"]["Offer"][];
            outgoing: components["schemas"]["Offer"][];
        };
        MyOffersEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["MyOffers"];
        };
        Offer: components["schemas"]["PurchaseOfferContract"] | components["schemas"]["MultipleOfferContract"];
        OfferCapabilities: {
            cancellation_available: boolean;
            sale_available: boolean;
        };
        OfferContractBase: components["schemas"]["MarketRecordBase"] & {
            capabilities: components["schemas"]["OfferCapabilities"];
            pricing: components["schemas"]["OfferPricing"];
            state: components["schemas"]["OfferState"];
            timing: components["schemas"]["OfferTiming"];
        };
        OfferEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["Offer"];
        };
        OfferPricing: {
            price: components["schemas"]["Money"];
        };
        /** @enum {string} */
        OfferState: "active" | "completed" | "cancelled" | "inactive";
        OfferTiming: {
            /** Format: date-time */
            created_at: string | null;
            /** Format: date-time */
            valid_until: string;
        };
        /** @enum {string} */
        OfferType: "purchase_offer" | "multiple_offer";
        PageInfo: {
            /** @description `true` when another page is available for the same query and ordering. */
            has_more: boolean;
            /** @description Opaque continuation token for the next page. `null` when there is no next page. */
            next_cursor: string | null;
        };
        PurchaseOfferContract: components["schemas"]["OfferContractBase"] & {
            /** @enum {string} */
            offer_type: "purchase_offer";
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            offer_type: "PurchaseOfferContract";
        };
        ResolveEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["ResolveResult"];
        };
        ResolveResult: {
            /** Format: date-time */
            last_updated_at: string;
            /** @description TON wallet address in user-friendly format. `null` when the domain exists but no linked wallet or wallet DNS record is available. */
            resolved_wallet_address: (string & components["schemas"]["AddressObject"]) | null;
        };
        SalesHistoryPoint: {
            count: number;
            /** Format: date */
            date: string;
            volume_ton: components["schemas"]["Money"];
            volume_usdt: components["schemas"]["Money"];
            volume_web3: components["schemas"]["Money"];
        };
        TokenRevocationEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["TokenRevocationResult"];
        };
        TokenRevocationResult: {
            revoked: boolean;
            /** Format: date-time */
            revoked_at: string;
        };
        TonProofChallenge: {
            /** Format: uuid */
            challenge_id: string;
            /** Format: date-time */
            expires_at: string;
            /** Format: date-time */
            issued_at: string;
            payload: string;
        };
        TonProofChallengeEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["TonProofChallenge"];
        };
        TonProofDomain: {
            lengthBytes: number;
            value: string;
        };
        TonProofProof: {
            domain: components["schemas"]["TonProofDomain"];
            payload: string;
            /** @description Base64-encoded TON Proof signature. */
            signature: string;
            state_init?: string | null;
            timestamp: number;
        };
        TonProofTokenExchangeRequest: {
            /** Format: uuid */
            challenge_id: string;
            /** @description Optional token TTL. If omitted, the server default is used. */
            expires_in_seconds?: number | null;
            proof: components["schemas"]["TonProofProof"];
            wallet_address: components["schemas"]["AddressObject"];
            /** @description Hex-encoded wallet public key. */
            wallet_public_key: string;
        };
        TopSaleEntry: {
            buyer_address: (string & components["schemas"]["AddressObject"]) | null;
            buyer_nickname: string | null;
            currency: components["schemas"]["CurrencyCode"];
            domain_name: string;
            price_native: components["schemas"]["Money"];
            /** @description Exact normalized TON value in minor units. */
            price_ton_normalized: string;
            /** @description Exact normalized USDT value in minor units. */
            price_usdt_normalized: string | null;
            /** @description Exact normalized WEB3 value in minor units. */
            price_web3_normalized: string | null;
            seller_address: (string & components["schemas"]["AddressObject"]) | null;
            seller_nickname: string | null;
            tx_hash: string;
            /** Format: date-time */
            tx_timestamp: string;
        };
        TopSaleListEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: {
                items: components["schemas"]["TopSaleEntry"][];
                limit: number;
                offset: number;
                /** Format: date-time */
                snapshot_updated_at: string;
                total_results: number;
            };
        };
        Transaction: {
            action_type: components["schemas"]["DomainActionType"];
            actors: components["schemas"]["TransactionActors"];
            block_ref: string | null;
            deal_address: (string & components["schemas"]["AddressObject"]) | null;
            domain_name: string | null;
            is_webdom: boolean;
            lt: string;
            other_info: components["schemas"]["TransactionOtherInfo"];
            price: components["schemas"]["Money"] | null;
            /** Format: date-time */
            timestamp: string;
            tx_hash: string;
            /** @enum {string} */
            type: "transaction";
        };
        TransactionActors: {
            bidder_address: (string & components["schemas"]["AddressObject"]) | null;
            buyer_address: (string & components["schemas"]["AddressObject"]) | null;
            new_owner_address: (string & components["schemas"]["AddressObject"]) | null;
            prev_owner_address: (string & components["schemas"]["AddressObject"]) | null;
            seller_address: (string & components["schemas"]["AddressObject"]) | null;
        };
        TransactionListEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: {
                items: components["schemas"]["Transaction"][];
            };
            page_info: components["schemas"]["PageInfo"];
        };
        TransactionOtherInfo: {
            comment?: string | null;
            domain_names?: string[];
            /** Format: date-time */
            expiration_at?: string | null;
            marketplace_address?: (string & components["schemas"]["AddressObject"]) | null;
            marketplace_name?: string | null;
            next_min_bid?: components["schemas"]["Money"] | null;
            next_price?: components["schemas"]["Money"] | null;
            previous_price?: components["schemas"]["Money"] | null;
            sale_type?: (string & components["schemas"]["DealType"]) | null;
        };
        User: {
            address: components["schemas"]["AddressObject"];
            avatar_url: string | null;
            last_linked_domain: string | null;
            link: string | null;
            nickname: string | null;
            stats: components["schemas"]["UserSearchStats"];
        };
        UserEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: components["schemas"]["UserProfile"];
        };
        UserListEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: {
                items: components["schemas"]["User"][];
            };
            page_info: components["schemas"]["PageInfo"];
        };
        /**
         * @description Public user profile payload.
         *     Viewer-dependent fields are resolved relative to the authenticated caller when bearer auth is provided.
         *     For unauthenticated requests:
         *     - `viewer_context.is_owner = false`
         *     - `viewer_context.is_watching = false`
         *     - `subscription = null`
         */
        UserProfile: {
            address: components["schemas"]["AddressObject"];
            profile: components["schemas"]["UserProfileIdentity"];
            stats_by_zone: components["schemas"]["UserProfileStatsByZone"];
            /** @description Always present in the response. `null` when unavailable or not applicable. */
            subscription: components["schemas"]["UserSubscription"] | null;
            summary: components["schemas"]["UserProfileSummary"];
            viewer_context: components["schemas"]["UserProfileViewerContext"];
            watchlist_hidden: boolean;
        };
        UserProfileIdentity: {
            avatar_url: string | null;
            /** Format: date-time */
            created_at: string;
            last_linked_domain: string | null;
            link: string | null;
            nickname: string | null;
        };
        UserProfileRankings: {
            domains_count: number | null;
            primary_purchases_count: number | null;
            primary_purchases_volume: number | null;
            sales_count: number | null;
            sales_volume: number | null;
            secondary_purchases_count: number | null;
            secondary_purchases_volume: number | null;
            total_purchases_volume: number | null;
        };
        /**
         * @description Zone mapping is fixed and mirrors the persisted `UserStats` keys:
         *     - `all` <- `total`
         *     - `ton` <- `domains`
         *     - `tme` <- `usernames`
         */
        UserProfileStatsByZone: {
            all: components["schemas"]["UserZoneStats"];
            tme: components["schemas"]["UserZoneStats"];
            ton: components["schemas"]["UserZoneStats"];
        };
        UserProfileSummary: {
            domains_count_tme: number;
            domains_count_ton: number;
            domains_count_total: number;
            domains_on_auction_count: number;
            domains_on_sale_count: number;
            estimated_value_ton: number | null;
            most_expensive_purchase: components["schemas"]["UserTopDeal"];
            most_expensive_sale: components["schemas"]["UserTopDeal"];
            primary_purchases_count: number;
            primary_purchases_volume_ton: number;
            rankings: components["schemas"]["UserProfileRankings"];
            sales_count: number;
            sales_volume_ton: number;
            secondary_purchases_count: number;
            secondary_purchases_volume_ton: number;
            total_purchases_count: number;
            total_purchases_volume_ton: number;
        };
        UserProfileViewerContext: {
            is_owner: boolean;
            is_watching: boolean;
        };
        UserRankingEntry: {
            rating_value: number;
            user: components["schemas"]["User"];
        };
        UserRankingEnvelope: components["schemas"]["BaseEnvelope"] & {
            data: {
                /** Format: date-time */
                generated_at: string;
                items: components["schemas"]["UserRankingEntry"][];
            };
        };
        UserSearchStats: {
            domains_count: number;
            primary_purchase_volume: components["schemas"]["Money"] | null;
            primary_purchases_count: number;
            sales_count: number;
            secondary_purchase_volume: components["schemas"]["Money"] | null;
            secondary_purchases_count: number;
            total_purchase_volume: components["schemas"]["Money"] | null;
            total_purchases_count: number;
            total_sale_volume: components["schemas"]["Money"] | null;
        };
        UserSubscription: {
            /** Format: date-time */
            end_at: string | null;
            is_active: boolean;
            /** @enum {string} */
            level: "free" | "premium" | "nft";
        };
        UserTopDeal: {
            domain_name: string;
            price_ton: number;
            tx_hash: string;
        } | null;
        UserZoneStats: {
            domains_count: number;
            domains_count_by_length: {
                [key: string]: number;
            };
            estimated_value_ton: number | null;
            most_expensive_purchase: components["schemas"]["UserTopDeal"];
            most_expensive_sale: components["schemas"]["UserTopDeal"];
            primary_purchases_count: number;
            primary_purchases_volume_ton: number;
            sales_count: number;
            sales_volume_ton: number;
            secondary_purchases_count: number;
            secondary_purchases_volume_ton: number;
            total_purchases_count: number;
            total_purchases_volume_ton: number;
        };
    };
    responses: {
        /** @description Invalid request parameters or payload */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description Internal server error */
        InternalError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description Requested resource does not exist */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description Required backend dependency is temporarily unavailable */
        ServiceUnavailable: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description Rate limit exceeded */
        TooManyRequests: {
            headers: {
                /** @description Seconds until the next request is allowed for the scope that exceeded the rate limit. */
                "Retry-After"?: number;
                /** @description Burst size for the scope that exceeded the rate limit. */
                "X-RateLimit-Limit"?: number;
                /** @description Applied rate-limit policy string, for example `5rps; burst=20`. */
                "X-RateLimit-Policy"?: string;
                /** @description Remaining whole requests currently available in the bucket for the exceeded scope. */
                "X-RateLimit-Remaining"?: number;
                /** @description Seconds until the next request is allowed for the exceeded scope. */
                "X-RateLimit-Reset"?: number;
                /** @description Scope that exceeded the rate limit. */
                "X-RateLimit-Scope"?: "wallet" | "ip";
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description Authentication required or token is invalid */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
    };
    parameters: {
        /** @description Optional inclusive lower bound for event or transaction timestamp. */
        AfterTime: string;
        /** @description Optional inclusive upper bound for event or transaction timestamp. */
        BeforeTime: string;
        /**
         * @description Opaque server-generated continuation token for cursor pagination.
         *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
         */
        Cursor: string;
        /** @description Deal contract address in user-friendly TON address format. */
        DealAddressPath: components["schemas"]["AddressObject"];
        /** @description Canonical domain name, including zone suffix, for example `alice.ton` or `alice.t.me`. */
        DomainNamePath: string;
        /** @description Optional domain zone filter. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
        DomainZone: "ton" | "t.me";
        /** @description Optional page size. Default is `50`; maximum is `100`. */
        Limit: number;
        /** @description Offer contract address in user-friendly TON address format. */
        OfferAddressPath: components["schemas"]["AddressObject"];
        /** @description Optional inclusive upper bound for normalized TON price, in human-readable TON units such as `10.1`. */
        PriceTonMax: string;
        /** @description Optional inclusive lower bound for normalized TON price, in human-readable TON units such as `10.1`. */
        PriceTonMin: string;
        /** @description Optional case-insensitive regular expression matched against the full domain name. When combined with `search`, both filters are applied. */
        Regex: string;
        /** @description Required domain zone selector. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
        RequiredDomainZone: "ton" | "t.me";
        /** @description Free-form search string interpreted by the target endpoint. */
        Search: string;
        /** @description Domain ordering mode. Reuse any returned cursor only with the same sort value. For `current_price_ton.*`, `last_price_ton.*`, `last_sale_time.*`, `sale_created_at.*`, and `deal_ending_time.*`, rows without the sort key are always placed at the end of the result set (`nulls_last`), regardless of sort direction. */
        SortCatalogDomains: "relevance.desc" | "name.asc" | "name.desc" | "name_length.asc" | "name_length.desc" | "last_renewal_time.desc" | "last_renewal_time.asc" | "registration_time.desc" | "registration_time.asc" | "current_price_ton.desc" | "current_price_ton.asc" | "last_price_ton.desc" | "last_price_ton.asc" | "last_sale_time.desc" | "last_sale_time.asc" | "last_price_difference_ton.desc" | "last_price_difference_ton.asc" | "sale_created_at.asc" | "sale_created_at.desc" | "deal_ending_time.asc" | "watchlists_count.desc";
        /** @description User wallet address in user-friendly TON address format. */
        UserAddressPath: components["schemas"]["AddressObject"];
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getMarketCharts: {
        parameters: {
            query: {
                /** @description Required domain zone selector. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
                domain_zone: components["parameters"]["RequiredDomainZone"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Market charts */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MarketChartsEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    getMarketOverview: {
        parameters: {
            query: {
                /** @description Required domain zone selector. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
                domain_zone: components["parameters"]["RequiredDomainZone"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Market overview */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MarketOverviewEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listTopSales: {
        parameters: {
            query: {
                /** @description Optional currency used to rank and normalize top-sale results. */
                currency?: components["schemas"]["CurrencyCode"];
                /** @description Required domain zone selector. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
                domain_zone: components["parameters"]["RequiredDomainZone"];
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
                /** @description Zero-based page offset into the precomputed top-sales snapshot. */
                offset?: number;
                /** @description Required sale segment selector. Use `primary` for mints and `secondary` for resale transactions. */
                sale_segment: "primary" | "secondary";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Top sales */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TopSaleListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    getJettonPrices: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Jetton prices */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JettonPricesEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listUserRankings: {
        parameters: {
            query: {
                /** @description Optional domain zone filter. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
                domain_zone?: components["parameters"]["DomainZone"];
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
                /** @description Required ranking metric used to order users. */
                rating: "domains_count" | "sales_count" | "sales_volume" | "primary_purchases_count" | "primary_purchases_volume" | "secondary_purchases_count" | "secondary_purchases_volume" | "total_purchases_volume";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description User rankings */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserRankingEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    revokeCurrentToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Agent API token revoked */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenRevocationEnvelope"];
                };
            };
            401: components["responses"]["Unauthorized"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    getTonProofPayload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description TON Proof challenge */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TonProofChallengeEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    exchangeTonProofForToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TonProofTokenExchangeRequest"];
            };
        };
        responses: {
            /** @description Agent API token created */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentApiTokenEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listDeals: {
        parameters: {
            query?: {
                /** @description Optional filter by buyer or latest bidder wallet address, depending on deal type. */
                buyer_address?: components["schemas"]["AddressObject"];
                /** @description Optional inclusive lower bound for deal creation time. */
                created_after?: string;
                /** @description Optional inclusive upper bound for deal creation time. */
                created_before?: string;
                /** @description Optional filter by the deal's native pricing currency. */
                currency?: components["schemas"]["CurrencyCode"];
                /**
                 * @description Opaque server-generated continuation token for cursor pagination.
                 *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
                 */
                cursor?: components["parameters"]["Cursor"];
                /** @description Optional exact domain-name filter. Matches deals containing the specified domain. */
                domain_name?: string;
                /** @description Optional domain zone filter. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
                domain_zone?: components["parameters"]["DomainZone"];
                /** @description Optional. Deal expiration lower bound. */
                expiration_after?: string;
                /** @description Optional. Deal expiration upper bound. */
                expiration_before?: string;
                /** @description Optional filter for multi-domain deals. `true` keeps collection-like deals; `false` keeps single-domain deals. */
                is_collection?: boolean;
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
                /** @description Optional filter by marketplace contract address. */
                marketplace_address?: components["schemas"]["AddressObject"];
                /** @description Optional inclusive upper bound for normalized TON price, in human-readable TON units such as `10.1`. */
                price_ton_max?: components["parameters"]["PriceTonMax"];
                /** @description Optional inclusive lower bound for normalized TON price, in human-readable TON units such as `10.1`. */
                price_ton_min?: components["parameters"]["PriceTonMin"];
                /** @description Optional filter by seller wallet address. */
                seller_address?: components["schemas"]["AddressObject"];
                /** @description Deal ordering mode. Reuse any returned cursor only with the same sort value. `execution_price.*` sorts by TON-normalized execution price. */
                sort?: "created_at.desc" | "created_at.asc" | "expiration.desc" | "expiration.asc" | "price_ton.desc" | "price_ton.asc" | "execution_price.desc" | "execution_price.asc";
                /** @description Optional deal state filters. Multiple values are combined with OR semantics. */
                states?: components["schemas"]["DealState"][];
                /** @description Optional deal type filters. Multiple values are combined with OR semantics. */
                types?: components["schemas"]["DealType"][];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deal search results */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DealListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listDomains: {
        parameters: {
            query?: {
                /** @description Optional category filters. Multiple values are combined with OR semantics. */
                categories?: string[];
                /**
                 * @description Optional character-set filters for the label part of the domain. Multiple values are combined with AND semantics.
                 *     The following combinations are invalid and return `400`: `idn_domains` + `exclude_punycode`, `digits_only` + `exclude_digits`, `letters_only` + `digits_only`, `with_hyphens` + `exclude_hyphens`, `hyphen_separated` + `exclude_hyphens`.
                 */
                characters?: components["schemas"]["CharacterFilter"][];
                /** @description Optional club-membership filters. Multiple values are combined with OR semantics. */
                clubs?: ("club_10k" | "club_100k")[];
                /**
                 * @description Opaque server-generated continuation token for cursor pagination.
                 *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
                 */
                cursor?: components["parameters"]["Cursor"];
                /** @description Optional DNS record presence filters. Multiple values are combined with AND semantics. */
                dns_record_types?: components["schemas"]["DnsRecordType"][];
                /** @description Optional domain zone filter. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
                domain_zone?: components["parameters"]["DomainZone"];
                /** @description Optional inclusive lower bound for domain expiration time. */
                expiration_after?: string;
                /** @description Optional inclusive upper bound for domain expiration time. */
                expiration_before?: string;
                /** @description Optional filter by the domain moderation flag. */
                is_banned?: boolean;
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
                /** @description Optional filter by the linked wallet address resolved from the domain wallet record. */
                linked_wallet_address?: components["schemas"]["AddressObject"];
                /** @description Marketplace names. Supported values are `webdom`, `getgems`, `fragment`, `marketapp`. */
                marketplaces?: ("webdom" | "getgems" | "fragment" | "marketapp")[];
                /** @description Optional inclusive upper bound for the domain label length, excluding the zone suffix. */
                name_length_max?: number;
                /** @description Optional inclusive lower bound for the domain label length, excluding the zone suffix. */
                name_length_min?: number;
                /** @description Optional filter by the current owner wallet address. */
                owner_address?: components["schemas"]["AddressObject"];
                /** @description Optional inclusive upper bound for normalized TON price, in human-readable TON units such as `10.1`. */
                price_ton_max?: components["parameters"]["PriceTonMax"];
                /** @description Optional inclusive lower bound for normalized TON price, in human-readable TON units such as `10.1`. */
                price_ton_min?: components["parameters"]["PriceTonMin"];
                /** @description Optional case-insensitive regular expression matched against the full domain name. When combined with `search`, both filters are applied. */
                regex?: components["parameters"]["Regex"];
                /** @description Free-form search string interpreted by the target endpoint. */
                search?: components["parameters"]["Search"];
                /** @description Domain ordering mode. Reuse any returned cursor only with the same sort value. For `current_price_ton.*`, `last_price_ton.*`, `last_sale_time.*`, `sale_created_at.*`, and `deal_ending_time.*`, rows without the sort key are always placed at the end of the result set (`nulls_last`), regardless of sort direction. */
                sort?: components["parameters"]["SortCatalogDomains"];
                /** @description Optional domain state filters. Multiple values are combined with OR semantics. */
                states?: components["schemas"]["DomainStateFilter"][];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Domain search results */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DomainListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listAvailableDomainLabels: {
        parameters: {
            query: {
                /** @description Optional exact-match category filters from `available_domains.csv`. Multiple values are combined with OR semantics. */
                categories?: string[];
                /**
                 * @description Opaque server-generated continuation token for cursor pagination.
                 *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
                 */
                cursor?: components["parameters"]["Cursor"];
                /** @description Optional first-character filter. Must be a single lowercase ASCII letter or digit. */
                first_char?: string;
                /** @description Filter by whether the label contains at least one digit. */
                has_digit?: boolean;
                /** @description Filter by whether the label contains a hyphen. */
                has_hyphen?: boolean;
                /** @description Filter by whether the label contains at least one ASCII letter. */
                has_letter?: boolean;
                /** @description Filter by whether the label is punycode-encoded (`xn--` prefix). */
                is_idn?: boolean;
                /** @description Filter by whether the label reads the same forward and backward. */
                is_palindrome?: boolean;
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
                /** @description Maximum label length. */
                max_len?: number;
                /** @description Minimum label length. */
                min_len?: number;
                /** @description Regex pattern for the label only, without the `.ton` suffix. Slash delimiters are accepted and normalized before execution. */
                regex: string;
                /** @description Lexicographic sort direction for the returned labels. */
                sort_order?: "asc" | "desc";
                /**
                 * @description Optional dataset-backed tag filters. Repeat the parameter or send a comma-separated list.
                 *     Minted tags are OR-ed together, WEB2 rank tags are OR-ed together, and different tag groups are combined with AND semantics.
                 */
                tags?: ("eth_minted" | "sol_minted" | "top_100_web2" | "top_200_web2" | "top_500_web2" | "top_1k_web2" | "top_2k_web2" | "top_5k_web2" | "top_10k_web2" | "top_50k_web2" | "top_100k_web2" | "top_200k_web2" | "top_500k_web2" | "top_1m_web2")[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Available label search results */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvailableLabelListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
            503: components["responses"]["ServiceUnavailable"];
        };
    };
    getDeal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Deal contract address in user-friendly TON address format. */
                deal_address: components["parameters"]["DealAddressPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deal details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DealEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listDealBids: {
        parameters: {
            query?: {
                /**
                 * @description Opaque server-generated continuation token for cursor pagination.
                 *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
                 */
                cursor?: components["parameters"]["Cursor"];
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path: {
                /** @description Deal contract address in user-friendly TON address format. */
                deal_address: components["parameters"]["DealAddressPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Auction bid history */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BidListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    getDomain: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Canonical domain name, including zone suffix, for example `alice.ton` or `alice.t.me`. */
                domain_name: components["parameters"]["DomainNamePath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Domain details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DomainEnvelope"];
                };
            };
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listDomainTransactions: {
        parameters: {
            query?: {
                /** @description Optional transaction action-type filters. Multiple values are combined with OR semantics. */
                action_types?: components["schemas"]["DomainActionType"][];
                /** @description Optional exclusive seek cursor based on blockchain logical time (`lt`) for descending domain-history pagination. */
                after_lt?: string;
                /** @description Optional inclusive lower bound for event or transaction timestamp. */
                after_time?: components["parameters"]["AfterTime"];
                /** @description Optional inclusive upper bound for event or transaction timestamp. */
                before_time?: components["parameters"]["BeforeTime"];
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path: {
                /** @description Canonical domain name, including zone suffix, for example `alice.ton` or `alice.t.me`. */
                domain_name: components["parameters"]["DomainNamePath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Domain history */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransactionListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    backResolveDomain: {
        parameters: {
            query: {
                /** @description Required. Wallet address to back resolve. */
                address: components["schemas"]["AddressObject"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Back resolve result */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BackResolveEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    resolveDomain: {
        parameters: {
            query: {
                /** @description Required. Domain name to resolve. */
                domain_name: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Resolve result */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResolveEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listAuctionBids: {
        parameters: {
            query?: {
                /** @description Optional inclusive lower bound for event or transaction timestamp. */
                after_time?: components["parameters"]["AfterTime"];
                /** @description Optional inclusive upper bound for event or transaction timestamp. */
                before_time?: components["parameters"]["BeforeTime"];
                /**
                 * @description Opaque server-generated continuation token for cursor pagination.
                 *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
                 */
                cursor?: components["parameters"]["Cursor"];
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Auction bid feed */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BidListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listSales: {
        parameters: {
            query?: {
                /** @description Optional inclusive lower bound for event or transaction timestamp. */
                after_time?: components["parameters"]["AfterTime"];
                /** @description Optional inclusive upper bound for event or transaction timestamp. */
                before_time?: components["parameters"]["BeforeTime"];
                /**
                 * @description Opaque server-generated continuation token for cursor pagination.
                 *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
                 */
                cursor?: components["parameters"]["Cursor"];
                /** @description Optional domain zone filter. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
                domain_zone?: components["parameters"]["DomainZone"];
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Completed sale feed */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransactionListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listTransactions: {
        parameters: {
            query?: {
                /** @description Optional inclusive lower bound for event or transaction timestamp. */
                after_time?: components["parameters"]["AfterTime"];
                /** @description Optional inclusive upper bound for event or transaction timestamp. */
                before_time?: components["parameters"]["BeforeTime"];
                /**
                 * @description Opaque server-generated continuation token for cursor pagination.
                 *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
                 */
                cursor?: components["parameters"]["Cursor"];
                /** @description Optional filter by deal contract address. */
                deal_address?: components["schemas"]["AddressObject"];
                /** @description Optional exact domain-name filter. */
                domain_name?: string;
                /** @description Optional domain zone filter. Use `ton` for `.ton` domains or `t.me` for Telegram usernames. */
                domain_zone?: components["parameters"]["DomainZone"];
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
                /** @description Optional flag restricting the feed to transactions attributed to Webdom. */
                only_webdom?: boolean;
                /** @description Optional inclusive upper bound for normalized TON price, in human-readable TON units such as `10.1`. */
                price_ton_max?: components["parameters"]["PriceTonMax"];
                /** @description Optional inclusive lower bound for normalized TON price, in human-readable TON units such as `10.1`. */
                price_ton_min?: components["parameters"]["PriceTonMin"];
                /** @description Feed ordering mode. Reuse any returned cursor only with the same sort value. */
                sort?: "time.desc" | "time.asc" | "price_ton.desc" | "price_ton.asc" | "domain.asc" | "domain.desc";
                /** @description Optional transaction action-type filters. Multiple values are combined with OR semantics. */
                types?: components["schemas"]["DomainActionType"][];
                /** @description Optional filter for transactions involving the specified wallet address. */
                user_address?: components["schemas"]["AddressObject"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Transaction feed */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransactionListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    getMarketplaceConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Marketplace configuration */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MarketplaceConfigEnvelope"];
                };
            };
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    getOffer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Offer contract address in user-friendly TON address format. */
                offer_address: components["parameters"]["OfferAddressPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Offer details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OfferEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    getBestOffer: {
        parameters: {
            query: {
                /** @description Required. Domain name for which the best active offer should be returned. */
                domain_name: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Best offer */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BestOfferEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listMyOffers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Incoming and outgoing offers */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyOffersEnvelope"];
                };
            };
            401: components["responses"]["Unauthorized"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    getUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User wallet address in user-friendly TON address format. */
                address: components["parameters"]["UserAddressPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description User profile */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    listUserActivity: {
        parameters: {
            query?: {
                /**
                 * @description Opaque server-generated continuation token for cursor pagination.
                 *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
                 */
                cursor?: components["parameters"]["Cursor"];
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path: {
                /** @description User wallet address in user-friendly TON address format. */
                address: components["parameters"]["UserAddressPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description User activity */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransactionListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
    searchUsers: {
        parameters: {
            query: {
                /**
                 * @description Opaque server-generated continuation token for cursor pagination.
                 *     For offset-based feeds in this API, the token binds to the endpoint ordering and, where applicable, to the explicit `sort` value.
                 */
                cursor?: components["parameters"]["Cursor"];
                /** @description Optional page size. Default is `50`; maximum is `100`. */
                limit?: components["parameters"]["Limit"];
                /** @description Required free-form search string matched against supported public user identity fields. */
                search: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description User search results */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserListEnvelope"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalError"];
        };
    };
}

export type AddressObject = components["schemas"]["AddressObject"];
export type AgentApiToken = components["schemas"]["AgentApiToken"];
export type AgentApiTokenEnvelope = components["schemas"]["AgentApiTokenEnvelope"];
export type AvailableLabelFilterOptions = components["schemas"]["AvailableLabelFilterOptions"];
export type AvailableLabelFilterTag = components["schemas"]["AvailableLabelFilterTag"];
export type AvailableLabelItem = components["schemas"]["AvailableLabelItem"];
export type AvailableLabelListEnvelope = components["schemas"]["AvailableLabelListEnvelope"];
export type BackResolveEnvelope = components["schemas"]["BackResolveEnvelope"];
export type BackResolveResult = components["schemas"]["BackResolveResult"];
export type BestOfferEnvelope = components["schemas"]["BestOfferEnvelope"];
export type BestOfferSummary = components["schemas"]["BestOfferSummary"];
export type Bid = components["schemas"]["Bid"];
export type BidListEnvelope = components["schemas"]["BidListEnvelope"];
export type CharacterFilter = components["schemas"]["CharacterFilter"];
export type CurrencyAmountTotals = components["schemas"]["CurrencyAmountTotals"];
export type CurrencyCode = components["schemas"]["CurrencyCode"];
export type CurrencyCountTotals = components["schemas"]["CurrencyCountTotals"];
export type CurrentSaleSummary = components["schemas"]["CurrentSaleSummary"];
export type Deal = components["schemas"]["Deal"];
export type DealCapabilities = components["schemas"]["DealCapabilities"];
export type DealEnvelope = components["schemas"]["DealEnvelope"];
export type DealListEnvelope = components["schemas"]["DealListEnvelope"];
export type DealPricing = components["schemas"]["DealPricing"];
export type DealState = components["schemas"]["DealState"];
export type DealTiming = components["schemas"]["DealTiming"];
export type DealType = components["schemas"]["DealType"];
export type DnsRecords = components["schemas"]["DnsRecords"];
export type DnsRecordType = components["schemas"]["DnsRecordType"];
export type Domain = components["schemas"]["Domain"];
export type DomainActionType = components["schemas"]["DomainActionType"];
export type DomainEnvelope = components["schemas"]["DomainEnvelope"];
export type DomainLengthAnalyticsEntry = components["schemas"]["DomainLengthAnalyticsEntry"];
export type DomainListEnvelope = components["schemas"]["DomainListEnvelope"];
export type DomainStateFilter = components["schemas"]["DomainStateFilter"];
export type DomainStatus = components["schemas"]["DomainStatus"];
export type DomainStatusAnalytics = components["schemas"]["DomainStatusAnalytics"];
export type DomainZoneValue = components["schemas"]["DomainZoneValue"];
export type ErrorEnvelope = components["schemas"]["ErrorEnvelope"];
export type ErrorObject = components["schemas"]["ErrorObject"];
export type JettonPrices = components["schemas"]["JettonPrices"];
export type JettonPricesEnvelope = components["schemas"]["JettonPricesEnvelope"];
export type LastSaleSummary = components["schemas"]["LastSaleSummary"];
export type MarketCharts = components["schemas"]["MarketCharts"];
export type MarketChartsEnvelope = components["schemas"]["MarketChartsEnvelope"];
export type MarketOverview = components["schemas"]["MarketOverview"];
export type MarketOverviewEnvelope = components["schemas"]["MarketOverviewEnvelope"];
export type MarketParticipants = components["schemas"]["MarketParticipants"];
export type MarketplaceConfig = components["schemas"]["MarketplaceConfig"];
export type MarketplaceConfigEnvelope = components["schemas"]["MarketplaceConfigEnvelope"];
export type MarketplaceDeployConfig = components["schemas"]["MarketplaceDeployConfig"];
export type MarketplacePromotionPeriodPrices = components["schemas"]["MarketplacePromotionPeriodPrices"];
export type MarketplacePromotionPrices = components["schemas"]["MarketplacePromotionPrices"];
export type MarketRecordBase = components["schemas"]["MarketRecordBase"];
export type Meta = components["schemas"]["Meta"];
export type Money = components["schemas"]["Money"];
export type MultipleOfferContract = components["schemas"]["MultipleOfferContract"];
export type MyOffers = components["schemas"]["MyOffers"];
export type MyOffersEnvelope = components["schemas"]["MyOffersEnvelope"];
export type Offer = components["schemas"]["Offer"];
export type OfferCapabilities = components["schemas"]["OfferCapabilities"];
export type OfferContractBase = components["schemas"]["OfferContractBase"];
export type OfferEnvelope = components["schemas"]["OfferEnvelope"];
export type OfferPricing = components["schemas"]["OfferPricing"];
export type OfferState = components["schemas"]["OfferState"];
export type OfferTiming = components["schemas"]["OfferTiming"];
export type OfferType = components["schemas"]["OfferType"];
export type PageInfo = components["schemas"]["PageInfo"];
export type PurchaseOfferContract = components["schemas"]["PurchaseOfferContract"];
export type ResolveEnvelope = components["schemas"]["ResolveEnvelope"];
export type ResolveResult = components["schemas"]["ResolveResult"];
export type SalesHistoryPoint = components["schemas"]["SalesHistoryPoint"];
export type TokenRevocationEnvelope = components["schemas"]["TokenRevocationEnvelope"];
export type TokenRevocationResult = components["schemas"]["TokenRevocationResult"];
export type TonProofChallenge = components["schemas"]["TonProofChallenge"];
export type TonProofChallengeEnvelope = components["schemas"]["TonProofChallengeEnvelope"];
export type TonProofDomain = components["schemas"]["TonProofDomain"];
export type TonProofProof = components["schemas"]["TonProofProof"];
export type TonProofTokenExchangeRequest = components["schemas"]["TonProofTokenExchangeRequest"];
export type TopSaleEntry = components["schemas"]["TopSaleEntry"];
export type TopSaleListEnvelope = components["schemas"]["TopSaleListEnvelope"];
export type Transaction = components["schemas"]["Transaction"];
export type TransactionActors = components["schemas"]["TransactionActors"];
export type TransactionListEnvelope = components["schemas"]["TransactionListEnvelope"];
export type TransactionOtherInfo = components["schemas"]["TransactionOtherInfo"];
export type User = components["schemas"]["User"];
export type UserEnvelope = components["schemas"]["UserEnvelope"];
export type UserListEnvelope = components["schemas"]["UserListEnvelope"];
export type UserProfile = components["schemas"]["UserProfile"];
export type UserProfileIdentity = components["schemas"]["UserProfileIdentity"];
export type UserProfileRankings = components["schemas"]["UserProfileRankings"];
export type UserProfileStatsByZone = components["schemas"]["UserProfileStatsByZone"];
export type UserProfileSummary = components["schemas"]["UserProfileSummary"];
export type UserProfileViewerContext = components["schemas"]["UserProfileViewerContext"];
export type UserRankingEntry = components["schemas"]["UserRankingEntry"];
export type UserRankingEnvelope = components["schemas"]["UserRankingEnvelope"];
export type UserSearchStats = components["schemas"]["UserSearchStats"];
export type UserSubscription = components["schemas"]["UserSubscription"];
export type UserTopDeal = components["schemas"]["UserTopDeal"];
export type UserZoneStats = components["schemas"]["UserZoneStats"];

export type BaseEnvelope<T> = components["schemas"]["BaseEnvelope"] & {
    data: T;
};
export type PaginatedEnvelope<T> = BaseEnvelope<{ items: T[] }> & {
    page_info: PageInfo;
};
type OperationParamsPart<T> = [NonNullable<T>] extends [never] ? Record<never, never> : NonNullable<T>;
type Simplify<T> = { [K in keyof T]: T[K] } & {};
type MergeOperationParams<TPath, TQuery> = Simplify<OperationParamsPart<TPath> & OperationParamsPart<TQuery>>;

export type BackResolveDomainParams = MergeOperationParams<operations["backResolveDomain"]["parameters"]["path"], operations["backResolveDomain"]["parameters"]["query"]>;
export type GetBestOfferParams = MergeOperationParams<operations["getBestOffer"]["parameters"]["path"], operations["getBestOffer"]["parameters"]["query"]>;
export type GetDealParams = MergeOperationParams<operations["getDeal"]["parameters"]["path"], operations["getDeal"]["parameters"]["query"]>;
export type GetDomainParams = MergeOperationParams<operations["getDomain"]["parameters"]["path"], operations["getDomain"]["parameters"]["query"]>;
export type GetMarketChartsParams = MergeOperationParams<operations["getMarketCharts"]["parameters"]["path"], operations["getMarketCharts"]["parameters"]["query"]>;
export type GetMarketOverviewParams = MergeOperationParams<operations["getMarketOverview"]["parameters"]["path"], operations["getMarketOverview"]["parameters"]["query"]>;
export type GetOfferParams = MergeOperationParams<operations["getOffer"]["parameters"]["path"], operations["getOffer"]["parameters"]["query"]>;
export type GetUserParams = MergeOperationParams<operations["getUser"]["parameters"]["path"], operations["getUser"]["parameters"]["query"]>;
export type ListAuctionBidsParams = MergeOperationParams<operations["listAuctionBids"]["parameters"]["path"], operations["listAuctionBids"]["parameters"]["query"]>;
export type ListAvailableDomainLabelsParams = MergeOperationParams<operations["listAvailableDomainLabels"]["parameters"]["path"], operations["listAvailableDomainLabels"]["parameters"]["query"]>;
export type ListDealBidsParams = MergeOperationParams<operations["listDealBids"]["parameters"]["path"], operations["listDealBids"]["parameters"]["query"]>;
export type ListDealsParams = MergeOperationParams<operations["listDeals"]["parameters"]["path"], operations["listDeals"]["parameters"]["query"]>;
export type ListDomainsParams = MergeOperationParams<operations["listDomains"]["parameters"]["path"], operations["listDomains"]["parameters"]["query"]>;
export type ListDomainTransactionsParams = MergeOperationParams<operations["listDomainTransactions"]["parameters"]["path"], operations["listDomainTransactions"]["parameters"]["query"]>;
export type ListSalesParams = MergeOperationParams<operations["listSales"]["parameters"]["path"], operations["listSales"]["parameters"]["query"]>;
export type ListTopSalesParams = MergeOperationParams<operations["listTopSales"]["parameters"]["path"], operations["listTopSales"]["parameters"]["query"]>;
export type ListTransactionsParams = MergeOperationParams<operations["listTransactions"]["parameters"]["path"], operations["listTransactions"]["parameters"]["query"]>;
export type ListUserActivityParams = MergeOperationParams<operations["listUserActivity"]["parameters"]["path"], operations["listUserActivity"]["parameters"]["query"]>;
export type ListUserRankingsParams = MergeOperationParams<operations["listUserRankings"]["parameters"]["path"], operations["listUserRankings"]["parameters"]["query"]>;
export type ResolveDomainParams = MergeOperationParams<operations["resolveDomain"]["parameters"]["path"], operations["resolveDomain"]["parameters"]["query"]>;
export type SearchUsersParams = MergeOperationParams<operations["searchUsers"]["parameters"]["path"], operations["searchUsers"]["parameters"]["query"]>;
