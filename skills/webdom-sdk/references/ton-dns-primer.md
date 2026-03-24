# TON DNS Primer

## Contents

- What TON DNS is
- Why people buy `.ton` domains
- How to think about `.t.me`
- Ownership vs linked wallet
- Common market states
- Practical answering rules

## What TON DNS Is

TON DNS maps human-readable names to on-chain identities and records in the TON ecosystem. In practice, people use `.ton` names as easier handles for wallets, apps, landing pages, communities, and brand identities.

For an agent, the useful mental model is:

- a `.ton` name is a user-facing digital identity asset
- a TON DNS domain behaves like an owned on-chain asset, not just a database entry
- control of the domain is distinct from any specific wallet currently linked to it
- the same domain can have utility, branding value, and market value at the same time
- some domains can have platform value because subdomains and service routing can be part of the product story

## Why People Buy `.ton` Domains

Common motivations:

- simpler wallet and payment identity
- brand protection for a project, creator, or business
- memorable naming for apps, bots, communities, or services
- routing for TON Sites, app entry points, and service addresses
- speculation on scarce short or category-defining names
- collecting culturally important or high-status names

For many buyers, `.ton` demand is driven more by identity and branding than by classic web SEO logic.

## How To Think About `.t.me`

Treat `.ton` and `.t.me` as separate zones with different buyer motivations.

- `.ton` usually maps to TON-native identity and on-chain utility
- `.t.me` usually carries stronger Telegram handle and audience value

When comparing names across zones, do not assume they have the same buyer pool, scarcity profile, or pricing logic.

## Ownership vs Linked Wallet

Keep these concepts separate:

- owner address: the wallet that owns the domain asset
- linked wallet: a wallet record associated with the domain for resolution or display

A linked wallet can be updated without changing ownership. If the user asks for "my domains", prefer ownership unless they explicitly ask about linked-wallet records.

## Common Market States

When reasoning about a domain, first identify which state it is in:

- available, expired or unregistered
- primary DNS auction
- owned but not actively listed
- listed on the secondary market
- has incoming or existing offers
- approaching expiry

The correct action and the right pricing interpretation depend on the state. For example, a primary auction reflects first acquisition dynamics, while a secondary listing reflects seller expectations and liquidity.

Expired domains should be treated as potential primary-market opportunities rather than as secondary listings. If a name has expired and re-enters auction flow, reason about it with primary-auction logic.

Auction timing matters:

- auctions for unregistered domains start with a one-hour duration
- auctions for expired domains start with a one-week duration
- if a new bid is placed with less than one hour left, the auction is extended to one hour remaining so other bidders can respond

Auction floors for unregistered and expired domains depend on length:
- 4 characters: `100 TON`
- 5 characters: `50 TON`
- 6 characters: `40 TON`
- 7 characters: `30 TON`
- 8 characters: `20 TON`
- 9 characters: `10 TON`
- 10 characters: `5 TON`
- 11 or more characters: `1 TON`

Keep in mind that TON DNS ownership is not fully passive. Renewal discipline matters, and expiry risk is part of the market structure.

## Practical Answering Rules

- Explain TON DNS in product terms first, then add blockchain detail only if needed.
- When a user asks "why is this domain useful?", anchor the answer in identity, payments, apps, and branding.
- When a user asks about the broader market, load `references/ton-dns-ecosystem.md` before answering.
- When a user asks "who owns this?", distinguish owner from linked wallet.
- When a user asks "is it worth buying?", combine this primer with `references/domain-valuation.md` and live Webdom market data.
- Do not imply that every domain has meaningful end-user demand. Most names are weak inventory unless they are clearly memorable, brandable, or category-relevant.
