Before running the examples, install the SDK globally:

```bash
npm install -g @webdom/sdk
```

# Webdom CLI Examples

Notes:

- All JSON outputs below are real responses captured from the current CLI and live API.
- `--pretty` is used in most examples for readability. Without it, success output is compact JSON.
- Authenticated examples used `WEBDOM_AGENT_TOKEN_FILE=/tmp/webdom-examples-token.txt`.
- The shell already had `WEBDOM_WALLET_MNEMONIC` configured for a `v5r1` wallet before running `auth.authenticate`.
- The `access_token` field in the auth example is intentionally redacted before committing this file.

## Discovery And Self-Description

### Discover Workflow Commands

```bash
npx @webdom/sdk commands --layer workflow --pretty
```

```json
[
  {
    "name": "find-domain",
    "layer": "workflow",
    "summary": "Search domains with common filters.",
    "aliases": [
      "find-domains"
    ],
    "auth_required": false,
    "accepts_input": "object"
  },
  {
    "name": "find-deal",
    "layer": "workflow",
    "summary": "Search deals with common filters.",
    "aliases": [
      "find-deals"
    ],
    "auth_required": false,
    "accepts_input": "object"
  },
  // ...
]
```

### Inspect Machine-Readable Schema

```bash
npx @webdom/sdk schema find-domain --pretty
```

```json
{
  "name": "find-domain",
  "aliases": [
    "find-domains"
  ],
  "layer": "workflow",
  "summary": "Search domains with common filters.",
  "description": "Wrapper around catalog.list-domains.",
  "auth_required": false,
  "accepts_input": "object",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "description": "Free-text search query.",
        "type": "string",
        "aliases": [
          "search"
        ]
      },
      "zone": {
        "description": "Domain zone.",
        "type": "string",
        "enum": [
          "ton",
          "t.me"
        ],
        "aliases": [
          "domain_zone"
        ]
      },
      "limit": {
        "description": "Maximum number of items to return.",
        "type": "number"
      },
      "cursor": {
        "description": "Opaque cursor returned by the previous page.",
        "type": "string"
      },
      "sort": {
        "description": "Sort order.",
        "type": "string",
        "enum": [
          "relevance.desc",
          "name.asc",
          "name.desc",
          "name_length.asc",
          "name_length.desc",
          "last_renewal_time.desc",
          "last_renewal_time.asc",
          "registration_time.desc",
          "registration_time.asc",
          "current_price_ton.desc",
          "current_price_ton.asc",
          "last_price_ton.desc",
          "last_price_ton.asc",
          "last_sale_time.desc",
          "last_sale_time.asc",
          "last_price_difference_ton.desc",
          "last_price_difference_ton.asc",
          "sale_created_at.asc",
          "sale_created_at.desc",
          "deal_ending_time.asc",
          "watchlists_count.desc"
        ]
      },
      "owner_address": {
        "description": "Filter by owner address.",
        "type": "string"
      },
      "linked_wallet_address": {
        "description": "Filter by linked wallet address.",
        "type": "string"
      }
    },
    "additionalProperties": false,
    "required": []
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "items": {}
      },
      "pageInfo": {
        "type": "object"
      },
      "meta": {
        "type": "object"
      }
    }
  },
  "examples": [
    "webdom find-domain --query gold --zone ton --limit 5",
    "webdom find-domain --owner-address UQ... --limit 20"
  ],
  "global_options": [
    {
      "name": "api-base-url",
      "type": "string",
      "description": "Override the Agent API base URL."
    },
    {
      "name": "token",
      "type": "string",
      "description": "Use the provided bearer token for this invocation only."
    },
    {
      "name": "token-file",
      "type": "string",
      "description": "Read and persist tokens in a shared file across invocations."
    },
    {
      "name": "toncenter-endpoint",
      "type": "string",
      "description": "Override the TON client endpoint for tx helpers."
    },
    {
      "name": "config",
      "type": "string",
      "description": "Load JSON createWebdomSdk(...) options from a file."
    },
    {
      "name": "json",
      "type": "string",
      "description": "Inline JSON payload merged like --input."
    },
    {
      "name": "input",
      "type": "string",
      "description": "Load JSON params from stdin (`-`) or a file path."
    },
    {
      "name": "select",
      "type": "string",
      "description": "Select a nested field from the command result before printing."
    },
    {
      "name": "jsonl",
      "type": "boolean",
      "description": "Print arrays as one JSON object per line."
    },
    {
      "name": "pretty",
      "type": "boolean",
      "description": "Pretty-print JSON output instead of compact JSON."
    }
  ]
}
```

### Read Human Help For A Tx Builder

```bash
npx @webdom/sdk help build-purchase-tx
```

```text
build-purchase-tx
  Build a TON simple-sale purchase transaction.

Prepare a TonConnect-ready message for purchasing a TON-priced simple sale.

Layer: workflow
Auth: not required
Input: object

Parameters:
  --sale-address <string>  required. Sale contract address.
  --price <bigint>  optional. Optional explicit TON price in nanotons.

Examples:
  webdom build-purchase-tx --sale-address EQ...

Output:
  Prepared TonConnect transaction.
```

## Workflow Reads

### Find Sale Domains By Query

```bash
npx @webdom/sdk find-domain --query auto --zone ton --limit 1 --pretty
```

```json
{
  "items": [
    {
      "type": "domain",
      "name": "eauto.ton",
      "domain_zone": "ton",
      "name_length": 5,
      "address": "EQCzJiD74vIaBxzS6ETPRccTMhZLm4fUvXlmqR5kIK0FiURu",
      "owner": "UQAAJlaAvu5I8BJgThs4RwlbOPRiDa_f3_ZRDaTyD_O9GdQY",
      "owner_inited": true,
      "status": {
        "is_expired": false,
        "is_banned": false,
        "is_on_primary_auction": false,
        "is_for_sale": true,
        "is_on_secondary_auction": false,
        "is_on_swap_contract": false
      },
      "sale_type": "fix_price",
      "sale_address": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS",
      "linked_wallet_address": null,
      "dns_records": {
        "wallet": null,
        "ton_site": null,
        "ton_storage": null,
        "raw": {}
      },
      "categories": [],
      "description": null,
      "watchlists_count": 0,
      "relevance_score": "287385951250884900",
      "last_renewal_time": "2025-09-19T18:47:51+00:00",
      "registration_time": "2022-08-06T13:17:09+00:00",
      "last_sale": {
        "price": {
          "amount": "50000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 50
        },
        "time": "2025-01-15T15:27:02+00:00"
      },
      "current_sale": {
        "address": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS",
        "deal_type": "fix_price_sale",
        "price": {
          "amount": "70000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 70000
        },
        "created_at": "2025-09-19T18:47:51+00:00",
        "valid_until": "2026-09-18T18:47:39+00:00"
      },
      "last_updated_at": "2025-12-13T19:43:58.053622+00:00"
    }
  ],
  "pageInfo": {
    "nextCursor": "eyJzb3J0IjoicmVsZXZhbmNlLmRlc2MiLCJvZmZzZXQiOjF9",
    "hasMore": true
  },
  "meta": {
    "requestId": "03cd4d23-5bff-4c5a-b1c7-40813ee3585d",
    "apiVersion": "v1"
  }
}
```

### Fetch Full Domain Details

```bash
npx @webdom/sdk get-domain --domain eauto.ton --pretty
```

```json
{
  "type": "domain",
  "name": "eauto.ton",
  "domain_zone": "ton",
  "name_length": 5,
  "address": "EQCzJiD74vIaBxzS6ETPRccTMhZLm4fUvXlmqR5kIK0FiURu",
  "owner": "UQAAJlaAvu5I8BJgThs4RwlbOPRiDa_f3_ZRDaTyD_O9GdQY",
  "owner_inited": true,
  "status": {
    "is_expired": false,
    "is_banned": false,
    "is_on_primary_auction": false,
    "is_for_sale": true,
    "is_on_secondary_auction": false,
    "is_on_swap_contract": false
  },
  "sale_type": "fix_price",
  "sale_address": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS",
  "linked_wallet_address": null,
  "dns_records": {
    "wallet": null,
    "ton_site": null,
    "ton_storage": null,
    "raw": {}
  },
  "categories": [],
  "description": null,
  "watchlists_count": 0,
  "relevance_score": "287385951250884900",
  "last_renewal_time": "2025-09-19T18:47:51+00:00",
  "registration_time": "2022-08-06T13:17:09+00:00",
  "last_sale": {
    "price": {
      "amount": "50000000000",
      "decimals": 9,
      "currency": "TON",
      "amount_decimal": 50
    },
    "time": "2025-01-15T15:27:02+00:00"
  },
  "current_sale": {
    "address": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS",
    "deal_type": "fix_price_sale",
    "price": {
      "amount": "70000000000000",
      "decimals": 9,
      "currency": "TON",
      "amount_decimal": 70000
    },
    "created_at": "2025-09-19T18:47:51+00:00",
    "valid_until": "2026-09-18T18:47:39+00:00"
  },
  "last_updated_at": "2025-12-13T19:43:58.053622+00:00"
}
```

### Feed Params Through Stdin And Select One Field

```bash
npx @webdom/sdk get-domain --input - --select owner <<'EOF'
{"domain":"eauto.ton"}
EOF
```

```json
"UQAAJlaAvu5I8BJgThs4RwlbOPRiDa_f3_ZRDaTyD_O9GdQY"
```

### Resolve An Address Back To A Domain

```bash
npx @webdom/sdk reverse-resolve-domain --address UQBlEDoxpVYNunb3tmDdD5wwalbcnjeqCP3rqu-oVm73xP8n --pretty
```

```json
{
  "domain_name": "8690.ton",
  "last_updated_at": "2026-02-21T16:00:43.976888+00:00"
}
```

### Inspect Recent Domain History

```bash
npx @webdom/sdk list-domain-transactions --domain eauto.ton --limit 2 --pretty
```

```json
{
  "items": [
    {
      "type": "transaction",
      "tx_hash": "3ee6d79455bd379900454d8b9a0e35507e2c2c02e26f36a36b7fcd2a993cdc02",
      "lt": "64619302000003",
      "block_ref": "0,-9223372036854775808,59892050",
      "timestamp": "2025-12-13T19:43:46+00:00",
      "action_type": "change_sale_price",
      "domain_name": "eauto.ton",
      "deal_address": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS",
      "price": {
        "amount": "70000000000000",
        "decimals": 9,
        "currency": "TON",
        "amount_decimal": 70000
      },
      "is_webdom": true,
      "actors": {
        "seller_address": null,
        "buyer_address": null,
        "bidder_address": null,
        "prev_owner_address": null,
        "new_owner_address": null
      },
      "other_info": {
        "previous_price": {
          "amount": "50000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 50000
        },
        "next_price": {
          "amount": "70000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 70000
        }
      }
    },
    {
      "type": "transaction",
      "tx_hash": "289e475c8bbc500997497c2b534d94ce927e7f0b1c1cec4d7f516341163accad",
      "lt": "63305782000003",
      "block_ref": "0,-9223372036854775808,58657709",
      "timestamp": "2025-11-05T17:14:55+00:00",
      "action_type": "change_sale_price",
      "domain_name": "eauto.ton",
      "deal_address": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS",
      "price": {
        "amount": "50000000000000",
        "decimals": 9,
        "currency": "TON",
        "amount_decimal": 50000
      },
      "is_webdom": true,
      "actors": {
        "seller_address": null,
        "buyer_address": null,
        "bidder_address": null,
        "prev_owner_address": null,
        "new_owner_address": null
      },
      "other_info": {
        "previous_price": {
          "amount": "40000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 40000
        },
        "next_price": {
          "amount": "50000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 50000
        }
      }
    }
  ],
  "pageInfo": {
    "nextCursor": "eyJzb3J0IjoibHQuZGVzYyIsIm9mZnNldCI6Mn0",
    "hasMore": true
  },
  "meta": {
    "requestId": "c78b2cf1-e111-484d-838f-5a3c0908cdc1",
    "apiVersion": "v1"
  }
}
```

### Find Active Auction Deals

```bash
npx @webdom/sdk find-deal --type auction --state active --limit 1 --pretty
```

```json
{
  "items": [
    {
      "address": "EQA_eLGS7ScVSReLIkZF81F0V_u60YwMb_fUWpm1h-unHICo",
      "participants": {
        "seller_address": "UQCkZ_j6hNOH_sOlk3K_9FfWs0KgesgSq1WtFsqF7pvSK3LK",
        "buyer_address": null,
        "owner_address": null,
        "last_bidder_address": null
      },
      "domain_names": [
        "hexiangjian.ton"
      ],
      "last_updated_at": "2026-03-22T12:14:55.305830+00:00",
      "type": "auction",
      "state": "active",
      "marketplace": {
        "address": "EQD7-a6WPtb7w5VgoUfHJmMvakNFgitXPk3sEM8Gf_WEBDOM",
        "name": "webdom"
      },
      "pricing": {
        "price": null,
        "execution_price_ton": null,
        "next_min_bid": {
          "amount": "1000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 1000
        },
        "min_bid_value": {
          "amount": "1000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 1000
        },
        "max_bid_value": {
          "amount": "10000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 10000
        }
      },
      "timing": {
        "created_at": "2027-03-11T19:41:22+00:00",
        "valid_until": "2027-03-11T20:40:22+00:00",
        "start_time": "2027-03-11T19:41:22+00:00",
        "last_bid_time": null
      },
      "capabilities": {
        "purchase_available": true,
        "bid_available": true,
        "cancellation_available": true
      }
    }
  ],
  "pageInfo": {
    "nextCursor": "eyJzb3J0IjoiY3JlYXRlZF9hdC5kZXNjIiwib2Zmc2V0IjoxfQ",
    "hasMore": true
  },
  "meta": {
    "requestId": "0e96309c-d290-4a02-a740-79cc827a7276",
    "apiVersion": "v1"
  }
}
```

### Fetch Full Auction Deal Details

```bash
npx @webdom/sdk get-deal --deal EQA_eLGS7ScVSReLIkZF81F0V_u60YwMb_fUWpm1h-unHICo --pretty
```

```json
{
  "address": "EQA_eLGS7ScVSReLIkZF81F0V_u60YwMb_fUWpm1h-unHICo",
  "participants": {
    "seller_address": "UQCkZ_j6hNOH_sOlk3K_9FfWs0KgesgSq1WtFsqF7pvSK3LK",
    "buyer_address": null,
    "owner_address": null,
    "last_bidder_address": null
  },
  "domain_names": [
    "hexiangjian.ton"
  ],
  "last_updated_at": "2026-03-22T12:14:55.305830+00:00",
  "type": "auction",
  "state": "active",
  "marketplace": {
    "address": "EQD7-a6WPtb7w5VgoUfHJmMvakNFgitXPk3sEM8Gf_WEBDOM",
    "name": "webdom"
  },
  "pricing": {
    "price": null,
    "execution_price_ton": null,
    "next_min_bid": {
      "amount": "1000000000000",
      "decimals": 9,
      "currency": "TON",
      "amount_decimal": 1000
    },
    "min_bid_value": {
      "amount": "1000000000000",
      "decimals": 9,
      "currency": "TON",
      "amount_decimal": 1000
    },
    "max_bid_value": {
      "amount": "10000000000000",
      "decimals": 9,
      "currency": "TON",
      "amount_decimal": 10000
    }
  },
  "timing": {
    "created_at": "2027-03-11T19:41:22+00:00",
    "valid_until": "2027-03-11T20:40:22+00:00",
    "start_time": "2027-03-11T19:41:22+00:00",
    "last_bid_time": null
  },
  "capabilities": {
    "purchase_available": true,
    "bid_available": true,
    "cancellation_available": true
  }
}
```

### Search Users By Text

```bash
npx @webdom/sdk find-user --query webdom --limit 1 --pretty
```

```json
{
  "items": [
    {
      "address": "UQBlEDoxpVYNunb3tmDdD5wwalbcnjeqCP3rqu-oVm73xP8n",
      "nickname": "Webdom VIP",
      "avatar_url": null,
      "link": "webdom-vip",
      "last_linked_domain": "8690.ton",
      "stats": {
        "domains_count": 0,
        "sales_count": 0,
        "primary_purchases_count": 0,
        "secondary_purchases_count": 0,
        "total_purchases_count": 0,
        "primary_purchase_volume": {
          "amount": "0",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 0
        },
        "secondary_purchase_volume": {
          "amount": "0",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 0
        },
        "total_purchase_volume": {
          "amount": "0",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 0
        },
        "total_sale_volume": {
          "amount": "0",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 0
        }
      }
    }
  ],
  "pageInfo": {
    "nextCursor": null,
    "hasMore": false
  },
  "meta": {
    "requestId": "3c06b548-592d-461d-9f08-819b59d6acae",
    "apiVersion": "v1"
  }
}
```

### Inspect Recent User Activity

```bash
npx @webdom/sdk list-user-activity --address UQBlEDoxpVYNunb3tmDdD5wwalbcnjeqCP3rqu-oVm73xP8n --limit 2 --pretty
```

```json
{
  "items": [
    {
      "type": "transaction",
      "tx_hash": "12841bc5624cd980c74570789acad5876b55e1e7cdfa1db9be7c5134aa3ba743",
      "lt": "67196243000003",
      "block_ref": "0,-9223372036854775808,62282145",
      "timestamp": "2026-02-22T00:45:47+00:00",
      "action_type": "transfer",
      "domain_name": "888-webdom-vip.ton",
      "deal_address": null,
      "price": null,
      "is_webdom": false,
      "actors": {
        "seller_address": null,
        "buyer_address": null,
        "bidder_address": null,
        "prev_owner_address": "UQBlEDoxpVYNunb3tmDdD5wwalbcnjeqCP3rqu-oVm73xP8n",
        "new_owner_address": "UQCTK1hnOU8ObPn50Ni2We7KgyXud01pnCfWiwVo9Q7KbTs_"
      },
      "other_info": {}
    },
    {
      "type": "transaction",
      "tx_hash": "ade7d4559ca08802841984b6032729ea18d6568d979581f178b6a744d96afd2b",
      "lt": "67194624000005",
      "block_ref": "0,-9223372036854775808,62280612",
      "timestamp": "2026-02-21T23:42:37+00:00",
      "action_type": "primary_purchase",
      "domain_name": "888-webdom-vip.ton",
      "deal_address": null,
      "price": {
        "amount": "1000000000",
        "decimals": 9,
        "currency": "TON",
        "amount_decimal": 1
      },
      "is_webdom": false,
      "actors": {
        "seller_address": "UQC3dNlesgVD8YbAazcauIrXBPfiVhMMr5YYk2in0Mtszx22",
        "buyer_address": null,
        "bidder_address": null,
        "prev_owner_address": null,
        "new_owner_address": "UQBlEDoxpVYNunb3tmDdD5wwalbcnjeqCP3rqu-oVm73xP8n"
      },
      "other_info": {}
    }
  ],
  "pageInfo": {
    "nextCursor": "eyJzb3J0IjoibHQuZGVzYyIsIm9mZnNldCI6Mn0",
    "hasMore": true
  },
  "meta": {
    "requestId": "06a7366c-4bc6-465a-9d6d-031628483ba3",
    "apiVersion": "v1"
  }
}
```

## Analytics

### Get Market Snapshot

```bash
npx @webdom/sdk get-market-overview --zone ton --pretty
```

```json
{
  "domains_count": 164507,
  "domains_owners": 58004,
  "domains_on_sale_count": 24291,
  "domains_statuses": {
    "on_sale": 24291,
    "on_auction": 189,
    "not_for_sale": 140027,
    "expiring_in_7_days": 952,
    "expiring_in_1_day": 88,
    "expired": 47366
  },
  "snapshot_updated_at": "2026-03-22T12:16:35+00:00"
}
```

### Rank Top Secondary Sales

```bash
npx @webdom/sdk list-top-sales --zone ton --segment secondary --limit 1 --pretty
```

```json
{
  "items": [
    {
      "domain_name": "binance.ton",
      "price_native": {
        "amount": "95000000000000",
        "decimals": 9,
        "currency": "TON",
        "amount_decimal": 95000
      },
      "price_ton_normalized": "95000000000000",
      "price_usdt_normalized": "194075587334",
      "price_web3_normalized": "1413690476",
      "currency": "TON",
      "buyer_address": "UQBKxh9chEJ7tz0uP4H0YdRwHpPR2jCixQcm5eD5s0IDfC2F",
      "buyer_nickname": null,
      "seller_address": "UQCtskPx_Xp4fKs8xU3pJDU8Ri53yQff4jChhRybwAxGLHZY",
      "seller_nickname": null,
      "tx_hash": "8dbdf1e3f04fa48ba7c13dcaf2beeefc50b5d84bd5a062dade35138b1921cfb2",
      "tx_timestamp": "2024-02-03T10:56:09+00:00"
    }
  ],
  "offset": 0,
  "limit": 1,
  "total_results": 1500,
  "snapshot_updated_at": "2026-03-22T12:16:35.924064+00:00"
}
```

## Low-Level Escape Hatch

### Use Low-Level API Filters Directly

```bash
npx @webdom/sdk catalog.list-domains --search auto --domain-zone ton --sort relevance.desc --limit 2 --pretty
```

```json
{
  "items": [
    {
      "type": "domain",
      "name": "eauto.ton",
      "domain_zone": "ton",
      "name_length": 5,
      "address": "EQCzJiD74vIaBxzS6ETPRccTMhZLm4fUvXlmqR5kIK0FiURu",
      "owner": "UQAAJlaAvu5I8BJgThs4RwlbOPRiDa_f3_ZRDaTyD_O9GdQY",
      "owner_inited": true,
      "status": {
        "is_expired": false,
        "is_banned": false,
        "is_on_primary_auction": false,
        "is_for_sale": true,
        "is_on_secondary_auction": false,
        "is_on_swap_contract": false
      },
      "sale_type": "fix_price",
      "sale_address": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS",
      "linked_wallet_address": null,
      "dns_records": {
        "wallet": null,
        "ton_site": null,
        "ton_storage": null,
        "raw": {}
      },
      "categories": [],
      "description": null,
      "watchlists_count": 0,
      "relevance_score": "287385951250884900",
      "last_renewal_time": "2025-09-19T18:47:51+00:00",
      "registration_time": "2022-08-06T13:17:09+00:00",
      "last_sale": {
        "price": {
          "amount": "50000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 50
        },
        "time": "2025-01-15T15:27:02+00:00"
      },
      "current_sale": {
        "address": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS",
        "deal_type": "fix_price_sale",
        "price": {
          "amount": "70000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 70000
        },
        "created_at": "2025-09-19T18:47:51+00:00",
        "valid_until": "2026-09-18T18:47:39+00:00"
      },
      "last_updated_at": "2025-12-13T19:43:58.053622+00:00"
    },
    {
      "type": "domain",
      "name": "autodoc.ton",
      "domain_zone": "ton",
      "name_length": 7,
      "address": "EQASQfdzy64kNHjGWx_RA5t1imlh1j_XF1aGftfd5Lg2q6gf",
      "owner": "UQAAJlaAvu5I8BJgThs4RwlbOPRiDa_f3_ZRDaTyD_O9GdQY",
      "owner_inited": true,
      "status": {
        "is_expired": false,
        "is_banned": false,
        "is_on_primary_auction": false,
        "is_for_sale": true,
        "is_on_secondary_auction": false,
        "is_on_swap_contract": false
      },
      "sale_type": "fix_price",
      "sale_address": "EQBdn6Peifa0Me_AI2_0xAJWBGD_C8lBZebxuiutKZD66Eku",
      "linked_wallet_address": null,
      "dns_records": {
        "wallet": null,
        "ton_site": null,
        "ton_storage": null,
        "raw": {}
      },
      "categories": [],
      "description": null,
      "watchlists_count": 0,
      "relevance_score": "287104476274177150",
      "last_renewal_time": "2025-09-21T19:17:38+00:00",
      "registration_time": "2022-08-06T05:03:11+00:00",
      "last_sale": {
        "price": {
          "amount": "30000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 30
        },
        "time": "2025-01-16T09:37:46+00:00"
      },
      "current_sale": {
        "address": "EQBdn6Peifa0Me_AI2_0xAJWBGD_C8lBZebxuiutKZD66Eku",
        "deal_type": "fix_price_sale",
        "price": {
          "amount": "30000000000000",
          "decimals": 9,
          "currency": "TON",
          "amount_decimal": 30000
        },
        "created_at": "2025-09-21T19:17:38+00:00",
        "valid_until": "2026-09-20T19:17:28+00:00"
      },
      "last_updated_at": "2025-10-27T06:58:52.914344+00:00"
    }
  ],
  "pageInfo": {
    "nextCursor": "eyJzb3J0IjoicmVsZXZhbmNlLmRlc2MiLCJvZmZzZXQiOjJ9",
    "hasMore": true
  },
  "meta": {
    "requestId": "7e1e4276-f4da-4a66-b092-093210217a80",
    "apiVersion": "v1"
  }
}
```

### Read Global Auction Bid History

```bash
npx @webdom/sdk history.auction-bids --limit 1 --pretty
```

```json
{
  "items": [
    {
      "tx_hash": "e5d7f23c7e3d383fb1d2b5a576b8517191f04878852fcd454ca8169f6e0f8b1a",
      "timestamp": "2026-03-22T13:20:55+00:00",
      "auction_address": "EQA9S9-Oo5hi6i-yuf52Sa7AHdp6zf1gzcvnkW854JFVyAqR",
      "bidder_address": "UQA6NWXUZP20_47jY5Tv9ezc_hHPQ3UFkIeW-lE2_fu45HYy",
      "bid_value": {
        "amount": "6845000000",
        "decimals": 9,
        "currency": "TON",
        "amount_decimal": 6.845
      },
      "domains_list": [
        "sebnyl.t.me"
      ]
    }
  ],
  "pageInfo": {
    "nextCursor": "eyJzb3J0IjoibHQuZGVzYyIsIm9mZnNldCI6MX0",
    "hasMore": true
  },
  "meta": {
    "requestId": "e62128fa-14ae-414e-b38e-630b11403c4d",
    "apiVersion": "v1"
  }
}
```

## Authenticated Offer Flows

### Authenticate And Persist A Token

```bash
WEBDOM_WALLET_MNEMONIC="word1 word2 ..." \
WEBDOM_WALLET_ADDRESS="UQ..." \
WEBDOM_AGENT_TOKEN_FILE=/tmp/webdom-examples-token.txt \
npx @webdom/sdk auth.authenticate --pretty
```

```json
{
  "token_type": "Bearer",
  "access_token": "<redacted>",
  "wallet_address": "UQA0WCBuWfrSYXpriHdDJEwugZIIfiZpsYZnc0Kz4OSLya4q",
  "expires_at": "2026-04-21T13:48:55.692729+00:00"
}
```

### Read Authenticated Incoming Offers

```bash
WEBDOM_AGENT_TOKEN_FILE=/tmp/webdom-examples-token.txt npx @webdom/sdk list-my-offers --pretty
```

```json
{
  "incoming": [
    {
      "address": "EQA-b0HZgkRYW13sRnsqqZYM95C5-ecmSW2aVYZvhJTwkDGl",
      "participants": {
        "seller_address": "UQA0WCBuWfrSYXpriHdDJEwugZIIfiZpsYZnc0Kz4OSLya4q",
        "buyer_address": "UQCovSj8c8Ik1I-RZt7dbIOEulYe-MfJ2SN5eMhxwfACvp7x",
        "owner_address": null,
        "last_bidder_address": null
      },
      "domain_names": [
        "testsiteston.ton"
      ],
      "last_updated_at": "2026-03-22T13:29:32.736734+00:00",
      "state": "active",
      "pricing": {
        "price": {
          "amount": "400000",
          "decimals": 3,
          "currency": "WEB3",
          "amount_decimal": 400
        }
      },
      "timing": {
        "created_at": "2026-03-22T12:53:27+00:00",
        "valid_until": "2026-03-23T11:53:18+00:00"
      },
      "capabilities": {
        "sale_available": true,
        "cancellation_available": true
      },
      "offer_type": "purchase_offer"
    }
  ],
  "outgoing": [],
  "generated_at": "2026-03-22T13:49:06.061044+00:00"
}
```

### Fetch The Best Offer For A Domain

```bash
npx @webdom/sdk get-best-offer --domain testsiteston.ton --pretty
```

```json
{
  "domain_name": "testsiteston.ton",
  "offer": {
    "offer_address": "EQA-b0HZgkRYW13sRnsqqZYM95C5-ecmSW2aVYZvhJTwkDGl",
    "offer_type": "purchase_offer",
    "price": {
      "amount": "400000",
      "decimals": 3,
      "currency": "WEB3",
      "amount_decimal": 400
    },
    "valid_until": "2026-03-23T11:53:18+00:00"
  }
}
```

### Fetch Full Offer Details

```bash
npx @webdom/sdk get-offer --offer EQA-b0HZgkRYW13sRnsqqZYM95C5-ecmSW2aVYZvhJTwkDGl --pretty
```

```json
{
  "address": "EQA-b0HZgkRYW13sRnsqqZYM95C5-ecmSW2aVYZvhJTwkDGl",
  "participants": {
    "seller_address": "UQA0WCBuWfrSYXpriHdDJEwugZIIfiZpsYZnc0Kz4OSLya4q",
    "buyer_address": "UQCovSj8c8Ik1I-RZt7dbIOEulYe-MfJ2SN5eMhxwfACvp7x",
    "owner_address": null,
    "last_bidder_address": null
  },
  "domain_names": [
    "testsiteston.ton"
  ],
  "last_updated_at": "2026-03-22T13:29:32.736734+00:00",
  "state": "active",
  "pricing": {
    "price": {
      "amount": "400000",
      "decimals": 3,
      "currency": "WEB3",
      "amount_decimal": 400
    }
  },
  "timing": {
    "created_at": "2026-03-22T12:53:27+00:00",
    "valid_until": "2026-03-23T11:53:18+00:00"
  },
  "capabilities": {
    "sale_available": true,
    "cancellation_available": true
  },
  "offer_type": "purchase_offer"
}
```

## Transaction Builders

`build-*` workflow commands and `sdk.tx.*` helpers intentionally stop at prepared message generation. To actually sign and broadcast, pass the resulting `messages` to a wallet tool such as `@ton/mcp@alpha`.

### Build A Fixed-Price Purchase Transaction

```bash
npx @webdom/sdk build-purchase-tx --sale-address EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS --price 70000000000000 --pretty
```

```json
{
  "messages": [
    {
      "address": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS",
      "amount": "70000176000000",
      "payload": "te6cckEBAQEAIAAAPAAAAABQdXJjaGFzZSB2aWEgd2ViZG9tLm1hcmtldON6jYk="
    }
  ],
  "meta": {
    "kind": "PurchaseTonSimpleSale",
    "contractAddress": "EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS"
  }
}
```

### Send The Prepared Transaction Through `@ton/mcp@alpha`

The SDK output can be sent to TON without reshaping the `messages` array. Build the transaction, extract `.messages`, send it with `send_raw_transaction`, then poll by `normalizedHash`.

```bash
TX_JSON=$(npx @webdom/sdk build-purchase-tx --sale-address EQCZrE2PauJVGz8d2Rh-0aoXDlJYr9l6koX64pZDVJYogAuS --price 70000000000000)
MESSAGES=$(echo "$TX_JSON" | jq -c '.messages')

HASH=$(
  npx -y @ton/mcp@alpha send_raw_transaction \
    --messages "$MESSAGES" \
  | jq -r '.normalizedHash'
)

npx -y @ton/mcp@alpha get_transaction_status --normalizedHash "$HASH"
```

If `MNEMONIC` or `PRIVATE_KEY` is not set, `@ton/mcp@alpha` uses the local TON config registry at `~/.config/ton/config.json`. In that mode you can add `--walletSelector <id|name|address>` to choose a specific wallet.

More information:

- `@ton/mcp` README: <https://github.com/ton-connect/kit/blob/main/packages/mcp/README.md>
- install TON skills for an agent: `npx skills add ton-connect/kit/packages/mcp`

### Build A Secondary Auction Bid Transaction

```bash
npx @webdom/sdk build-auction-bid-tx --auction-address EQA_eLGS7ScVSReLIkZF81F0V_u60YwMb_fUWpm1h-unHICo --bid-value 1000000000000 --pretty
```

```json
{
  "messages": [
    {
      "address": "EQA_eLGS7ScVSReLIkZF81F0V_u60YwMb_fUWpm1h-unHICo",
      "amount": "1000110000000",
      "payload": "te6cckEBAQEAGwAAMgAAAABCaWQgdmlhIHdlYmRvbS5tYXJrZXS7dhVl"
    }
  ],
  "meta": {
    "kind": "PlaceTonSimpleAuctionBid",
    "contractAddress": "EQA_eLGS7ScVSReLIkZF81F0V_u60YwMb_fUWpm1h-unHICo"
  }
}
```

### Build A Primary Auction Bid Transaction

```bash
npx @webdom/sdk build-primary-auction-bid-tx --domain-address EQBzG7WwjQVNIH8lmYCjAEJIr6dKqW52soa4RYMeEpbeaeu0 --bid-value 174000000000 --pretty
```

```json
{
  "messages": [
    {
      "address": "EQBzG7WwjQVNIH8lmYCjAEJIr6dKqW52soa4RYMeEpbeaeu0",
      "amount": "174000000000",
      "payload": "te6cckEBAQEAGwAAMgAAAABCaWQgdmlhIHdlYmRvbS5tYXJrZXS7dhVl"
    }
  ],
  "meta": {
    "kind": "PlacePrimaryAuctionBid",
    "contractAddress": "EQBzG7WwjQVNIH8lmYCjAEJIr6dKqW52soa4RYMeEpbeaeu0"
  }
}
```

### Build A Link-Wallet DNS Record Transaction

```bash
npx @webdom/sdk build-link-wallet-tx --domain-address EQDUu6QDlo1F5exjcuEzUmt42petpjSt0MxpoE7R5cN5rR6F --wallet-address UQA0WCBuWfrSYXpriHdDJEwugZIIfiZpsYZnc0Kz4OSLya4q --query-id 7 --pretty
```

```json
{
  "messages": [
    {
      "address": "EQDUu6QDlo1F5exjcuEzUmt42petpjSt0MxpoE7R5cN5rR6F",
      "amount": "10000000",
      "payload": "te6cckEBAgEAVgABWE6x8PkAAAAAAAAAB+jUQFCHPbqGWqfBcKtMzmTZCDmjTc/Wz3HRTgIFRDsbAQBJn9OABosEDcs/WkwvTXEO6GSJhdAyQQ/EzTYwzO5oVnwckXkgEKOt3TA="
    }
  ],
  "queryId": 7,
  "meta": {
    "kind": "LinkWallet",
    "contractAddress": "EQDUu6QDlo1F5exjcuEzUmt42petpjSt0MxpoE7R5cN5rR6F"
  }
}
```

### Build A Purchase-Offer Acceptance Transaction

```bash
npx @webdom/sdk build-accept-offer-tx --domain-address EQDUu6QDlo1F5exjcuEzUmt42petpjSt0MxpoE7R5cN5rR6F --offer-address EQA-b0HZgkRYW13sRnsqqZYM95C5-ecmSW2aVYZvhJTwkDGl --user-address UQA0WCBuWfrSYXpriHdDJEwugZIIfiZpsYZnc0Kz4OSLya4q --pretty
```

```json
{
  "messages": [
    {
      "address": "EQDUu6QDlo1F5exjcuEzUmt42petpjSt0MxpoE7R5cN5rR6F",
      "amount": "44353462",
      "payload": "te6cckEBAQEAVQAApV/MPRQAAAAAAAAAAIAHzeg7MEiLC2u9iM9lVTLBnvIXPzzkyS2zSrDN8JKeEhAA0WCBuWfrSYXpriHdDJEwugZIIfiZpsYZnc0Kz4OSLyRzEtAI7Zl/vw=="
    }
  ],
  "meta": {
    "kind": "AcceptPurchaseOffer",
    "contractAddress": "EQA-b0HZgkRYW13sRnsqqZYM95C5-ecmSW2aVYZvhJTwkDGl"
  }
}
```
