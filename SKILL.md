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

## Intent Recipes

Map common user requests to concrete commands instead of inventing new workflows.

### "List my domains" / "Show my domains"

This requires a wallet address. Prefer the owner address unless the user explicitly asks about linked-wallet records.

```bash
npx @webdom/sdk find-domain --owner-address UQ... --limit 100 --pretty
```

If the wallet address is already in the shell environment:

```bash
npx @webdom/sdk find-domain --owner-address "$WEBDOM_WALLET_ADDRESS" --limit 100 --pretty
```

If the user means domains linked through DNS wallet records rather than ownership:

```bash
npx @webdom/sdk find-domain --linked-wallet-address UQ... --limit 100 --pretty
```

If no wallet address is available from the request or environment, ask for it. Do not guess "my domains" from an auth token alone.

### "Show domain details for X"

```bash
npx @webdom/sdk get-domain --domain example.ton --pretty
```

### "Find deals for X" / "Is X for sale?"

```bash
npx @webdom/sdk find-deal --domain example.ton --state active --limit 20 --pretty
```

### "Show the best offer for X"

```bash
npx @webdom/sdk get-best-offer --domain example.ton --pretty
```

### "Show my offers"

This requires Webdom auth.

```bash
npx @webdom/sdk list-my-offers --pretty
```

### "Show activity for this wallet"

```bash
npx @webdom/sdk list-user-activity --address UQ... --limit 20 --pretty
```

### "Show balances for this wallet" / "Do I have enough balance?"

All main balances:

```bash
npx @webdom/sdk get-wallet-balances --address UQ... --pretty
```

Asset-specific checks:

```bash
npx @webdom/sdk get-ton-balance --address UQ... --pretty
npx @webdom/sdk get-usdt-balance --address UQ... --pretty
npx @webdom/sdk get-web3-balance --address UQ... --pretty
```

### "Show marketplace tariffs" / "Show marketplace fees" / "Show commissions" / "Show promotion prices"

Use `marketplace.config` as the source of truth for deploy fees, commissions, and promotion pricing:

```bash
npx @webdom/sdk marketplace.config --pretty
```

What to read from the response:

- deploy fees and deal-specific commissions: `deploy_configs`
- move-up promotion price: `promotion_prices.move_up_price`
- hot and colored promotion prices by period: `promotion_prices.period_prices`

Useful direct selections:

```bash
npx @webdom/sdk marketplace.config --select deploy_configs --pretty
npx @webdom/sdk marketplace.config --select promotion_prices --pretty
```

### "Show transactions for this domain"

```bash
npx @webdom/sdk list-domain-transactions --domain example.ton --limit 20 --pretty
```

### "Reverse resolve this wallet" / "What domain belongs to this address?"

```bash
npx @webdom/sdk reverse-resolve-domain --address UQ... --pretty
```

### "Show global transactions" / "Show recent marketplace sales"

Transactions:

```bash
npx @webdom/sdk list-transactions-history --limit 20 --pretty
```

Sales:

```bash
npx @webdom/sdk list-sales-history --zone ton --limit 20 --pretty
```

Auction bids:

```bash
npx @webdom/sdk list-auction-bids-history --limit 20 --pretty
```

### "Show market overview" / "Show charts" / "Show top sales"

Overview:

```bash
npx @webdom/sdk get-market-overview --zone ton --pretty
```

Charts:

```bash
npx @webdom/sdk get-market-charts --zone ton --pretty
```

Top sales:

```bash
npx @webdom/sdk list-top-sales --zone ton --segment secondary --limit 10 --pretty
```

User rankings:

```bash
npx @webdom/sdk list-user-rankings --rating total_purchases_volume --limit 10 --pretty
```

### "Buy this domain"

For a fixed-price TON sale:

```bash
npx @webdom/sdk find-deal --domain example.ton --state active --limit 20 --pretty
npx @webdom/sdk build-purchase-tx --sale-address EQ... --pretty
```

Then send the resulting `.messages` with `@ton/mcp@alpha send_raw_transaction`.

### "Place a bid on this auction"

For a secondary auction:

```bash
npx @webdom/sdk get-deal --deal EQ... --pretty
npx @webdom/sdk build-auction-bid-tx --auction-address EQ... --bid-value 1000000000 --pretty
```

For a primary DNS auction:

```bash
npx @webdom/sdk get-domain --domain example.ton --pretty
npx @webdom/sdk build-primary-auction-bid-tx --domain-address EQ... --bid-value 1000000000 --pretty
```

### "List this domain for sale" / "Put my domain on sale"

Use the workflow CLI command:

```bash
npx @webdom/sdk build-sale-tx \
  --user-address UQ... \
  --domain-address EQ... \
  --domain-name example.ton \
  --currency USDT \
  --price 1000000000 \
  --valid-until 1767225600 \
  --pretty
```

Variations:

- TON sale: `--currency TON`
- USDT sale: `--currency USDT`
- WEB3 sale: `--currency WEB3`
- Optional auto-renew for the sale: `--auto-renew-cooldown <seconds>` and `--auto-renew-iterations <count>`

### "Make an offer for this domain" / "Place a purchase offer"

Use the workflow CLI command:

```bash
npx @webdom/sdk build-offer-tx \
  --domain-name example.ton \
  --seller-address UQ... \
  --currency TON \
  --price 1000000000 \
  --valid-until 1767225600 \
  --pretty
```

For USDT or WEB3 offers, also pass the buyer wallet:

```bash
npx @webdom/sdk build-offer-tx \
  --domain-name example.ton \
  --seller-address UQ... \
  --user-address UQ... \
  --currency USDT \
  --price 1000000000 \
  --valid-until 1767225600 \
  --pretty
```

`commission` is optional in the CLI command. If omitted, it is loaded from `marketplace.config`.

### "Change the price of this offer"

TON offer:

```bash
npx @webdom/sdk build-change-offer-price-tx \
  --offer-address EQ... \
  --commission-rate 0.05 \
  --new-price 2000000000 \
  --new-valid-until 1767225600 \
  --pretty
```

USDT or WEB3 offer:

```bash
npx @webdom/sdk build-change-offer-price-tx \
  --offer-address EQ... \
  --user-address UQ... \
  --commission-rate 0.05 \
  --new-price 2000000 \
  --new-valid-until 1767225600 \
  --pretty
```

### "Start an auction for this domain"

Use the workflow CLI command:

```bash
npx @webdom/sdk build-auction-tx \
  --user-address UQ... \
  --domain-address EQ... \
  --domain-name example.ton \
  --currency TON \
  --start-time 1766620800 \
  --end-time 1767225600 \
  --min-bid-value 1000000000 \
  --max-bid-value 100000000000 \
  --min-bid-increment 5 \
  --time-increment 300 \
  --pretty
```

### "Accept this purchase offer"

```bash
npx @webdom/sdk get-best-offer --domain example.ton --pretty
npx @webdom/sdk build-accept-offer-tx \
  --domain-address EQ... \
  --offer-address EQ... \
  --user-address UQ... \
  --pretty
```

### "Link this wallet to the domain" / "Clear the linked wallet"

Link:

```bash
npx @webdom/sdk build-link-wallet-tx --domain-address EQ... --wallet-address UQ... --pretty
```

Clear:

```bash
npx @webdom/sdk build-link-wallet-tx --domain-address EQ... --pretty
```

### "Renew this domain"

```bash
npx @webdom/sdk build-renew-domain-tx --domain-name example.ton --pretty
```

The CLI loads the domain and picks the renewal path automatically:

- direct renew when the domain is not on a deal
- sale renew when the domain is on a Webdom fixed-price sale
- auction renew when the domain is on a Webdom auction

It rejects unsupported states such as primary DNS auctions, swap contracts, or external marketplaces.

### "Cancel this sale"

Simple sale:

```bash
npx @webdom/sdk build-cancel-deal-tx --deal-type sale --deal-address EQ... --pretty
```

Multiple sale:

```bash
npx @webdom/sdk build-cancel-deal-tx --deal-type sale --deal-address EQ... --pretty
```

The CLI detects whether the sale is Webdom or Getgems automatically and reads the number of domains from the deal itself.

### "Cancel this offer"

Offer currency is detected automatically:

```bash
npx @webdom/sdk build-cancel-deal-tx --deal-type offer --deal-address EQ... --pretty
```

### "Cancel this auction" / "Stop this auction"

```bash
npx @webdom/sdk build-cancel-deal-tx --deal-type auction --deal-address EQ... --pretty
```

### "Promote this sale" / "Move this sale up" / "Make this sale hot" / "Make this sale colored"

Move up:

```bash
npx @webdom/sdk build-promote-sale-tx \
  --promotion-type move_up \
  --user-address UQ... \
  --sale-address EQ... \
  --pretty
```

Hot:

```bash
npx @webdom/sdk build-promote-sale-tx \
  --promotion-type hot \
  --user-address UQ... \
  --sale-address EQ... \
  --period 86400 \
  --pretty
```

Colored:

```bash
npx @webdom/sdk build-promote-sale-tx \
  --promotion-type colored \
  --user-address UQ... \
  --sale-address EQ... \
  --period 86400 \
  --pretty
```

Promotion prices are resolved from `marketplace.config`.

### "Buy marketplace subscription"

```bash
npx @webdom/sdk build-buy-subscription-tx \
  --subscription-level 2 \
  --subscription-period 30 \
  --subscription-price 1000000000 \
  --pretty
```

### Main flow variants

- Check balances before execution: `get-wallet-balances`, `get-ton-balance`, `get-usdt-balance`, `get-web3-balance`
- Buy a domain: `find-deal` -> `build-purchase-tx`
- Bid on a secondary auction: `get-deal` -> `build-auction-bid-tx`
- Bid on a primary DNS auction: `get-domain` -> `build-primary-auction-bid-tx`
- List one domain for sale: `build-sale-tx`
- Create a purchase offer: `build-offer-tx`
- Change offer price: `build-change-offer-price-tx`
- Start a one-domain auction: `build-auction-tx`
- Accept an offer: `build-accept-offer-tx`
- Link or clear wallet: `build-link-wallet-tx`
- Renew a domain: `build-renew-domain-tx`
- Cancel sale / offer / auction: `build-cancel-deal-tx`
- Promote sale: `build-promote-sale-tx`
- Buy subscription: `build-buy-subscription-tx`

Before broadcasting any prepared transaction, check that the wallet has enough balance for the required asset and enough TON for gas.

For one-domain write flows, prefer workflow CLI commands over raw SDK calls.

Use raw SDK tx builders only when the workflow layer does not cover the case yet, such as:

- multiple-domain sale deployment
- multiple-domain auction deployment
- counterproposal flows and other advanced offer management beyond the workflow layer

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
