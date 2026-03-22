# Webdom SDK

TypeScript SDK for the [Webdom Agent API](https://webdom.market/api/docs/agent-api), TON Proof authentication, Webdom transaction builders, and low-level contract helpers.

## Installation

```bash
npm install -g @webdom/sdk
```

The SDK expects a `fetch` implementation. In modern Node.js runtimes this usually means Node 18+.
If your runtime does not provide `globalThis.fetch`, pass one explicitly to `createWebdomSdk({ fetch })`.

## Quick Start

```ts
import { createWebdomSdk } from '@webdom/sdk';

const sdk = createWebdomSdk();

const domains = await sdk.api.catalog.listDomains({
    search: 'gold',
    domain_zone: 'ton',
    limit: 5
});

console.log(domains.items.map((domain) => domain.name));

const details = await sdk.api.domains.get({
    domain_name: 'example.ton'
});

console.log(details.owner);
```

## Surface

`createWebdomSdk()` returns an isolated SDK instance with these namespaces:

- `sdk.api`
- `sdk.raw`
- `sdk.auth`
- `sdk.tx`
- `sdk.context`

Each SDK instance keeps its own API base URL, token storage, fetch implementation, TON client, and contract addresses.

## Configuration

```ts
import { createWebdomSdk } from '@webdom/sdk';

const sdk = createWebdomSdk({
    apiBaseUrl: 'https://webdom.market/api/agent/v1',
    toncenterEndpoint: 'https://mainnet-v4.tonhubapi.com',
    tokenStorage: {
        async getToken() {
            return process.env.WEBDOM_AGENT_TOKEN ?? null;
        },
        async setToken(token) {
            process.env.WEBDOM_AGENT_TOKEN = token ?? '';
        }
    },
    contracts: {
        marketplace: 'EQD7-a6WPtb7w5VgoUfHJmMvakNFgitXPk3sEM8Gf_WEBDOM'
    }
});
```

Defaults:

- `apiBaseUrl`: `https://webdom.market/api/agent/v1`
- `toncenterEndpoint`: `https://mainnet-v4.tonhubapi.com`
- built-in Webdom contract addresses
- per-instance in-memory token storage

## Authentication

The auth client manages the TON Proof flow and token persistence for one SDK instance.

```ts
const token = await sdk.auth.authenticate({
    mnemonic: process.env.WALLET_MNEMONIC!.split(' '),
    walletVersion: 'v4r2'
});

console.log(token.access_token);
```

If the signature is produced outside the SDK, exchange the external proof directly:

```ts
const challenge = await sdk.auth.getTonProofPayload();

const token = await sdk.auth.exchangeTonProofForToken({
    challenge_id: challenge.challenge_id,
    wallet_address: 'UQ...',
    wallet_public_key: 'deadbeef',
    proof: externalProof
});
```

Token helpers:

```ts
await sdk.auth.setToken('existing-token');
console.log(await sdk.auth.getToken());
await sdk.auth.clearToken();
```

Advanced auth helpers live under `@webdom/sdk/auth`:

```ts
import { signTonProof, buildTonProofTokenExchangeRequest } from '@webdom/sdk/auth';
```

## High-Level vs Raw API

High-level namespaces unwrap `data`, `page_info`, and `meta`:

```ts
const result = await sdk.api.catalog.listDomains({ limit: 10 });
console.log(result.items, result.pageInfo, result.meta);

const marketplaceConfig = await sdk.api.marketplace.getConfig();
console.log(marketplaceConfig.deploy_configs);
```

Raw namespaces preserve the original API envelope:

```ts
const envelope = await sdk.raw.catalog.listDomains({ limit: 10 });
console.log(envelope.data.items, envelope.meta.request_id);

const rawMarketplaceConfig = await sdk.raw.marketplace.getConfig();
console.log(rawMarketplaceConfig.data.deploy_configs);
```

## Transactions

Transaction builders are grouped by domain:

- `sdk.tx.domains`
- `sdk.tx.sales`
- `sdk.tx.auctions`
- `sdk.tx.offers`
- `sdk.tx.swaps`
- `sdk.tx.marketplace`
- `sdk.tx.nft`

Each builder returns TonConnect-ready messages:

```ts
const tx = await sdk.tx.sales.purchaseTonSimple({
    saleAddress: 'EQ...'
});

console.log(tx.messages);
```

Advanced tx helpers are also available via:

```ts
import { createTxClient } from '@webdom/sdk/tx';
```

## CLI

The CLI has two layers:

- workflow commands optimized for humans and AI agents
- low-level `namespace.method` commands for full API coverage

Workflow examples:

```bash
webdom find-domain --query gold --limit 5
webdom get-domain --domain example.ton
webdom build-purchase-tx --sale-address EQ... --price 1500000000
```

Low-level examples:

```bash
webdom catalog.list-domains --search gold --limit 5
webdom domains.get --domain-name example.ton
webdom marketplace.config
webdom auth.authenticate
webdom auth.token.get
```

By default the CLI persists tokens in `~/.config/webdom/agent-token`. Override it with `--token-file` or `WEBDOM_AGENT_TOKEN_FILE`.

Agent-oriented features:

```bash
webdom commands
webdom schema find-domain
webdom help domains.get
echo '{"domain":"example.ton"}' | webdom get-domain --input -
webdom find-domain --query gold --select items --jsonl
```

Defaults:

- success responses are compact JSON on `stdout`
- errors are structured JSON on `stderr`
- `--pretty` enables formatted JSON
- `--input -` reads JSON params from stdin
- `--select path.to.field` extracts a nested value before printing
- `--jsonl` emits arrays as one JSON object per line

Use `webdom help <command>` for human help, `webdom schema <command>` for machine-readable metadata, or `webdom commands` to inspect the full command catalog.

## Entry Points

The package uses a focused root export plus explicit advanced entrypoints:

- `@webdom/sdk`: `createWebdomSdk`, config helpers, `WebdomApiError`, `toNano`, `fromNano`
- `@webdom/sdk/api`: raw and high-level API factories/types
- `@webdom/sdk/auth`: TON Proof helpers and auth client exports
- `@webdom/sdk/tx`: transaction client exports
- `@webdom/sdk/contracts`: low-level contract helpers
- `@webdom/sdk/types`: generated API schema types
- `@webdom/sdk/cli`: CLI runner and command metadata
