import type { WebdomApi } from '../api/high-level';
import type { WebdomSdkContext } from '../config';

import { createAuctionTransactions } from './auctions';
import { createDomainTransactions } from './domains';
import { createMarketplaceTransactions } from './marketplace';
import { createNftTransactions } from './nft';
import { createOfferTransactions } from './offers';
import { createSaleTransactions } from './sales';
import { createTxContext } from './shared';
import { createSwapTransactions } from './swaps';

export * from './shared';

export type WebdomTx = ReturnType<typeof createTxClient>;

export function createTxClient(context: WebdomSdkContext, api: WebdomApi) {
    const txContext = createTxContext(context, api);

    return {
        domains: createDomainTransactions(txContext),
        sales: createSaleTransactions(txContext),
        auctions: createAuctionTransactions(txContext),
        offers: createOfferTransactions(txContext),
        swaps: createSwapTransactions(txContext),
        marketplace: createMarketplaceTransactions(txContext),
        nft: createNftTransactions()
    };
}
