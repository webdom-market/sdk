# Domain Valuation

## Contents

- Core valuation model
- Main value drivers
- Domain classes
- Positive signals
- Negative signals
- TON-specific demand patterns
- Market structure and submarkets
- Numeric domains and 4N logic
- How to use live market data
- Suggested answer format

## Core Valuation Model

For TON DNS, value usually comes from a mix of:

1. naming quality
2. buyer demand
3. scarcity inside the zone
4. current market evidence

A good appraisal separates intrinsic quality from current liquidity.

- intrinsic quality: how strong the name is on its own
- liquidity: how many realistic buyers may want it soon
- market evidence: offers, sales, bids, listings, activity, and broader zone momentum

TON DNS domains can derive value from more than one source at once:

- utility value: wallet alias, site entry point, app identity, service routing
- brand value: strong word, category, product, persona, or public identity
- collectible value: pattern scarcity, aesthetics, status, and community demand
- market value: how easily the asset can realistically trade

Do not pretend these are the same thing. A domain can be beautiful but illiquid, liquid inside a narrow collector segment, or highly useful but not especially collectible.

## Main Value Drivers

When appraising a domain, check these factors in order:

1. length
2. readability
3. breadth of buyer demand
4. pattern scarcity
5. cultural or social meaning
6. legal risk
7. renewal and holding risk

Practical interpretation:

- shorter is usually stronger, but meaning can outweigh raw length
- names that are instantly understood usually trade better than names that require explanation
- a broad buyer universe is usually more valuable than dependence on one exact end user
- scarcity matters most when the market already recognizes the pattern
- cultural relevance can create real premiums, especially in numeric and identity-driven segments
- exact brand matches can be valuable but often carry the highest legal risk
- expiry discipline matters because TON DNS ownership is not purely passive

## Domain Classes

Use these classes as a practical map rather than a rigid taxonomy:

- exact-brand or brand-match names
- strong generic one-word names
- short letter domains and acronyms
- geo names, personal names, and cultural words
- IDN or punycode names
- hybrid or complex long-tail names
- numeric domains

Typical behavior by class:

- exact-brand names can be very strong nominally, but buyer concentration and trademark risk make them less clean than top generic words
- strong generic words are usually among the healthiest long-term assets because they combine utility, branding, and broad demand
- short letter domains and pronounceable acronyms can be highly brandable, but low-quality random strings should not be overrated
- geo and personal-name domains can work well, but their liquidity depends more on language, region, and narrative
- IDN names can be underpriced relative to utility, but they usually have narrower liquidity and more spoofing risk
- hybrid or awkward long names are usually long-tail inventory unless they have unusually strong meaning
- numeric domains behave like a more explicitly collectible market with clearer supply boundaries and stronger mask-based pricing

## Positive Signals

Strong signals:

- short names
- clean dictionary words
- memorable brandables
- strong acronyms with multiple plausible buyers
- names that are easy to pronounce, spell, and remember
- names with obvious commercial use cases
- category terms that many projects may want

Additional upside signals:

- broad buyer universe rather than one niche buyer
- clear fit for wallet identity, app identity, media brand, or community brand
- culturally resonant or status-signaling names

## Negative Signals

Weak signals:

- long or awkward strings
- hard-to-spell names
- forced prefixes and suffixes
- random numbers or hyphens
- obvious misspellings without brand merit
- extremely narrow buyer universe
- names that depend on one specific end user noticing them

Risk flags:

- likely trademark conflict
- unclear meaning
- weak pronunciation
- no obvious use case beyond speculation
- owner thesis depends on one hypothetical buyer only

## TON-Specific Demand Patterns

TON DNS buyers often care about simple identity and branding more than traditional web keyword logic.

Names tend to perform better when they fit one of these patterns:

- premium identity names
- wallet-friendly or payment-friendly names
- strong crypto-native categories
- Telegram-native brand or community names
- simple app, tool, or media brands

This does not mean every crypto keyword is valuable. The better question is whether multiple serious buyers could plausibly build on that name.

## Market Structure And Submarkets

Do not value all domains with one generic rubric. TON DNS contains different submarkets with different buyer logic and liquidity:

- broad end-user brands and dictionary words
- short collectible names
- numeric segments such as `4N`
- IDN and punycode names
- adjacent Telegram-identity comparisons with `.t.me`

Practical rules:

- broad brandables and category-defining words usually have the widest buyer universe
- narrow collector segments can be liquid inside their niche but should not be priced like mainstream end-user brands
- IDN names can have localization upside, but also higher confusion and spoofing risk
- a name that looks culturally interesting to insiders may still have thin liquidity outside that subcommunity
- renewal and expiry pressure matter for holding strategy, especially in speculative portfolios

## Numeric Domains And 4N Logic

Numeric domains deserve separate handling. In TON DNS they behave more like a collector market with explicit masks, finite supply, and recognizable micro-collections.

Useful mental model:

- `4N` is the flagship numeric collectible class
- `5N` can still be liquid, but usually has weaker average scarcity because supply is much larger
- beyond `5N`, pattern quality matters more than raw numeric length

Why numeric domains can trade well:

- supply is easy to understand
- masks are easy to classify
- visual identity is immediate
- collector communities can create stable demand around recognized patterns

For `4N`, treat the following as especially strong:

- `XXXX`
- very clean zero-heavy symmetry such as `00XX`, `X00X`, `0XX0`, `000Х`, `Х000`, `0XXX`
- mirrored and repeated structures such as `XYYX`, `XYXY`, `XXYY`
- culturally loaded years, dates, and obvious special sequences

Useful appraisal rules for numeric domains:

- do not compare a top-tier `4N` to an average random `4N` as if they were the same asset class
- a strong `5N` can outperform a weak `4N`
- special collections and cultural meaning can matter almost as much as raw tier shape
- liquidity in numerics is often community-mediated, so sentiment and collector attention matter more than for generic words
- avoid fake precision: tier shape improves expected liquidity, not guaranteed sale price

## How To Use Live Market Data

When the user asks whether a domain is valuable, do not answer from naming heuristics alone. Pair the heuristic view with Webdom data:

- current domain status
- active deals or auction state
- recent domain transactions
- overall market activity and top sales

Useful commands:

```bash
npx @webdom/sdk get-domain --domain example.ton --pretty
npx @webdom/sdk find-deal --domain example.ton --limit 10 --pretty
npx @webdom/sdk list-domain-transactions --domain example.ton --limit 20 --pretty
npx @webdom/sdk get-market-overview --zone ton --pretty
npx @webdom/sdk list-top-sales --zone ton --segment secondary --limit 10 --pretty
```

Interpretation rules:

- listing price shows seller intent, not fair value
- repeated sales or auction bids increase confidence
- no activity does not make a name worthless
- venue matters: a domain-specialized venue can reveal better intent and liquidity signals than a generic NFT venue
- when valuing numeric domains, compare against the right mask class rather than against all domains broadly

## Suggested Answer Format

For "is this domain good?" or "how valuable is it?", answer in this order:

1. naming quality
2. likely buyer universe
3. current market evidence
4. bottom-line stance

Use compact labels when helpful:

- premium
- strong
- decent
- weak

If useful, add one short risk line:

- legal risk
- liquidity risk
- expiry or holding risk
- niche-only demand

Avoid fake precision. If there are no strong comps or offers, give a directional view instead of a confident price target.
