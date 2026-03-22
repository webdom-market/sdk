import type { Cell } from '@ton/core';

import type { AddressLike } from '../config';
import { NftSale } from '../contracts';
import { parseAddress, prepareSingle } from './shared';

export function createNftTransactions() {
    return {
        buySale(args: { saleAddress: AddressLike; nftsCount: number; nftPrice: bigint }) {
            return prepareSingle(
                'BuyNftSale',
                NftSale.getSimplePurchaseMessageInfo(parseAddress(args.saleAddress), args.nftsCount, args.nftPrice),
                { contractAddress: args.saleAddress }
            );
        },

        buySaleWithWhitelist(args: {
            saleAddress: AddressLike;
            nftsCount: number;
            nftPrice: bigint;
            discountCell: Cell;
            queryId?: number;
        }) {
            return prepareSingle(
                'BuyNftSaleWithWhitelist',
                NftSale.getWlPurchaseMessageInfo(
                    parseAddress(args.saleAddress),
                    args.nftsCount,
                    args.nftPrice,
                    args.discountCell,
                    args.queryId ?? 0
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.saleAddress
                }
            );
        }
    };
}
