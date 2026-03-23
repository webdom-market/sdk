---
name: webdom-sdk
description: Use when the user wants to search .ton or .t.me domains, inspect domain details, find deals, buy a domain, bid in an auction, accept an offer, link a wallet to a domain, check domain or user activity, analyze Webdom market data, or prepare and send domain-related transactions on TON blockchain. Uses the Webdom CLI and SDK under the hood, including transaction broadcasting via external wallet tools such as @ton/mcp@alpha.
---

# Webdom SDK

Use this skill for Webdom marketplace tasks such as finding domains, buying them, bidding, accepting offers, linking wallets, checking history, or preparing sale and purchase flows.

Prefer the workflow CLI for operational tasks. Prefer the TypeScript SDK surface only when the user wants code, integration help, or SDK changes.

## Fast Path

For discovery and one-off operations, start with:

```bash
npx @webdom/sdk commands --layer workflow --pretty
npx @webdom/sdk help <command>
npx @webdom/sdk schema <command> --pretty
```

If the package is already installed globally, `webdom ...` is equivalent of `npx @webdom/sdk`. Prefer these self-describing CLI commands over guessing command names or payload shapes.

## Preferred Workflow

For most user intents, use this sequence:

1. Inspect the asset or market state with workflow commands
2. Build the transaction with `build-*` commands or `sdk.tx.*`
3. If execution is required, send the prepared `messages` through an external wallet tool (e.g. @ton/mcp@alpha)
4. Poll the resulting transaction hash until it is completed or failed

Do not claim that this SDK broadcasts transactions. It intentionally stops at prepared transaction data. Use other tools like @ton/mcp@alpha for signing and broadcasting transactions

## Common Commands

### Read-only discovery

```bash
npx @webdom/sdk find-domain --query gold --zone ton --limit 5
npx @webdom/sdk get-domain --domain example.ton
npx @webdom/sdk resolve-domain --domain example.ton
npx @webdom/sdk reverse-resolve-domain --address UQ...
npx @webdom/sdk find-deal --domain example.ton --limit 10
npx @webdom/sdk get-deal --deal EQ...
npx @webdom/sdk get-best-offer --domain example.ton
npx @webdom/sdk list-domain-transactions --domain example.ton --limit 20
```

### Authenticated reads

```bash
npx @webdom/sdk auth.authenticate
npx @webdom/sdk list-my-offers
npx @webdom/sdk list-user-activity --address UQ... --limit 20
```

Token storage defaults to `~/.config/webdom/agent-token`. You can override it with `--token-file` or `WEBDOM_AGENT_TOKEN_FILE`.

## Action Flows

### Buy a domain at fixed price

Use this when the active deal is a TON simple sale.

```bash
npx @webdom/sdk get-domain --domain example.ton
npx @webdom/sdk find-deal --domain example.ton --state active --limit 10
npx @webdom/sdk build-purchase-tx --sale-address EQ...
```

### Bid on a secondary auction

```bash
npx @webdom/sdk get-deal --deal EQ...
npx @webdom/sdk list-deal-bids --deal EQ... --limit 20
npx @webdom/sdk build-auction-bid-tx --auction-address EQ... --bid-value 1000000000
```

### Bid on a primary DNS auction

```bash
npx @webdom/sdk get-domain --domain example.ton
npx @webdom/sdk build-primary-auction-bid-tx --domain-address EQ... --bid-value 1000000000
```

### Accept a purchase offer

```bash
npx @webdom/sdk get-best-offer --domain example.ton
npx @webdom/sdk build-accept-offer-tx --domain-address EQ... --offer-address EQ... --user-address UQ...
```

### Link or clear a wallet record

```bash
npx @webdom/sdk build-link-wallet-tx --domain-address EQ... --wallet-address UQ...
npx @webdom/sdk build-link-wallet-tx --domain-address EQ...
```

## Broadcasting Prepared Transactions

Prepared transactions contain a `messages` array. That array can be passed directly to `@ton/mcp@alpha send_raw_transaction`.

Canonical shell flow:

```bash
TX_JSON=$(npx @webdom/sdk build-purchase-tx --sale-address EQ... --price 70000000000000)
MESSAGES=$(echo "$TX_JSON" | jq -c '.messages')

HASH=$(
  npx -y @ton/mcp@alpha send_raw_transaction \
    --messages "$MESSAGES" \
  | jq -r '.normalizedHash'
)

npx -y @ton/mcp@alpha get_transaction_status --normalizedHash "$HASH"
```

Important details:

- pass only `messages` to `send_raw_transaction`
- do not pass SDK `meta` or `queryId` as broadcast fields
- SDK `amount` values are already in nanotons
- `payload` and `stateInit` are already base64-encoded when present
- if `MNEMONIC` or `PRIVATE_KEY` is not set, `@ton/mcp@alpha` falls back to the local TON config registry
- in registry mode, you can add `--walletSelector`

If the user asks to complete a purchase end-to-end and a wallet is available, the expected flow is:

1. find the active deal
2. build the correct transaction
3. send it with `@ton/mcp@alpha send_raw_transaction`
4. poll `get_transaction_status`

## TypeScript Guidance

Use the SDK directly when the user wants application code:

- `createWebdomSdk()` is the main entry point
- `sdk.api` is the high-level unwrapped API
- `sdk.raw` preserves the original API envelope
- `sdk.auth` handles TON Proof auth and token persistence
- `sdk.tx` builds prepared transactions

For transaction code, start with:

- `src/tx/sales.ts`
- `src/tx/auctions.ts`
- `src/tx/domains.ts`
- `src/tx/offers.ts`
- `src/tx/shared.ts`

For CLI command mapping, read:

- `src/cli-lib/commands/workflow.ts`
- `src/cli-lib/commands/api.ts`

## References

If this skill is being used inside the SDK repository, these files are useful:

- `README.md` for the public SDK surface
- `EXAMPLES.md` for live CLI examples
- `openapi/agent-api-openapi.yaml` for API contracts
- `src/api/` for client implementation
- `src/auth/` for TON Proof helpers
- `src/tx/` for prepared transaction builders
- `src/contracts/` for low-level contract helpers

If those files are not present in the current workspace, rely on:

- `npx @webdom/sdk commands --layer workflow --pretty`
- `npx @webdom/sdk help <command>`
- `npx @webdom/sdk schema <command> --pretty`
- package docs on npm or GitHub
- if more operational guidance for `@ton/mcp@alpha` is needed, install TON skills with `npx skills add ton-connect/kit/packages/mcp`

## Guardrails

- Prefer workflow commands over low-level `namespace.method` commands unless the workflow layer lacks the needed capability
- Prefer `npx @webdom/sdk ...` in examples unless you know `webdom` is installed globally
- Verify whether the target flow is fixed-price sale, secondary auction, primary auction, offer acceptance, or wallet linking before building a transaction
- If the user asks for on-chain execution, make the handoff to an external wallet tool explicit
- If a wallet or token is missing, say what is missing instead of improvising
