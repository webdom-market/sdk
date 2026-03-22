import type { AddressLike } from '../config';
import { Marketplace } from '../contracts';
import type { TxContext } from './shared';
import { parseAddress, prepareSingle, resolveJettonWalletAddress } from './shared';

export function createMarketplaceTransactions(context: TxContext) {
    return {
        async moveUpSale(args: {
            userAddress: AddressLike;
            web3WalletAddress?: AddressLike;
            price: bigint;
            saleAddress: AddressLike;
            queryId?: number;
        }) {
            const web3WalletAddress = await resolveJettonWalletAddress({
                context,
                userAddress: args.userAddress,
                jettonWalletAddress: args.web3WalletAddress,
                currency: 'WEB3'
            });
            return prepareSingle(
                'MoveUpSale',
                Marketplace.getMoveUpSaleMessageInfo(
                    parseAddress(args.userAddress),
                    web3WalletAddress,
                    args.price,
                    parseAddress(args.saleAddress),
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.saleAddress
                }
            );
        },

        async makeHotSale(args: {
            userAddress: AddressLike;
            web3WalletAddress?: AddressLike;
            price: bigint;
            saleAddress: AddressLike;
            period: number;
            queryId?: number;
        }) {
            const web3WalletAddress = await resolveJettonWalletAddress({
                context,
                userAddress: args.userAddress,
                jettonWalletAddress: args.web3WalletAddress,
                currency: 'WEB3'
            });
            return prepareSingle(
                'MakeHotSale',
                Marketplace.getMakeHotMessageInfo(
                    parseAddress(args.userAddress),
                    web3WalletAddress,
                    args.price,
                    parseAddress(args.saleAddress),
                    args.period,
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.saleAddress
                }
            );
        },

        async makeColoredSale(args: {
            userAddress: AddressLike;
            web3WalletAddress?: AddressLike;
            price: bigint;
            saleAddress: AddressLike;
            period: number;
            queryId?: number;
        }) {
            const web3WalletAddress = await resolveJettonWalletAddress({
                context,
                userAddress: args.userAddress,
                jettonWalletAddress: args.web3WalletAddress,
                currency: 'WEB3'
            });
            return prepareSingle(
                'MakeColoredSale',
                Marketplace.getMakeColoredMessageInfo(
                    parseAddress(args.userAddress),
                    web3WalletAddress,
                    args.price,
                    parseAddress(args.saleAddress),
                    args.period,
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.saleAddress
                }
            );
        },

        buySubscription(args: {
            subscriptionLevel: number;
            subscriptionPeriod: number;
            subscriptionPrice: bigint;
            queryId?: number;
        }) {
            return prepareSingle(
                'BuySubscription',
                Marketplace.getBuySubscriptionMessageInfo(
                    args.subscriptionLevel,
                    args.subscriptionPeriod,
                    args.subscriptionPrice,
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                { queryId: args.queryId }
            );
        }
    };
}
