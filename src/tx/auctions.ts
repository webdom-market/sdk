import type { Cell } from '@ton/core';

import type { AddressLike } from '../config';
import {
    Auction,
    JettonMultipleAuction,
    JettonSimpleAuction,
    Marketplace,
    TonMultipleAuction,
    TonSimpleAuction
} from '../contracts';
import type { TxContext } from './shared';
import {
    parseAddress,
    prepareSingle,
    resolveDeployFee,
    resolveJettonWalletAddressFromDeal
} from './shared';

export function createAuctionTransactions(context: TxContext) {
    return {
        async deployTonSimple(args: {
            userAddress: AddressLike;
            domainAddress: AddressLike;
            domainName: string;
            deployFee?: bigint;
            startTime: number;
            endTime: number;
            minBidValue: bigint;
            maxBidValue: bigint;
            minBidIncrement: number;
            timeIncrement: number;
            isDeferred?: boolean;
            discountCell?: Cell | null;
            queryId?: number;
        }) {
            const deployFee = await resolveDeployFee(context, 'ton_simple_auction', args.deployFee);
            const message = await Marketplace.getDeployTonSimpleAuctionMessageInfo(
                parseAddress(args.userAddress),
                parseAddress(args.domainAddress),
                args.domainName,
                deployFee,
                args.startTime,
                args.endTime,
                args.minBidValue,
                args.maxBidValue,
                args.minBidIncrement,
                args.timeIncrement,
                args.isDeferred ?? false,
                args.discountCell ?? null,
                args.queryId ?? 0,
                context.contracts.marketplace,
                context.getTonClient()
            );
            return prepareSingle('DeployTonSimpleAuction', message, {
                queryId: args.queryId,
                contractAddress: args.domainAddress,
                domainNames: [args.domainName]
            });
        },

        async deployJettonSimple(args: {
            userAddress: AddressLike;
            domainAddress: AddressLike;
            domainName: string;
            deployFee?: bigint;
            isWeb3: boolean;
            startTime: number;
            endTime: number;
            minBidValue: bigint;
            maxBidValue: bigint;
            minBidIncrement: number;
            timeIncrement: number;
            isDeferred?: boolean;
            discountCell?: Cell | null;
            queryId?: number;
        }) {
            const deployFee = await resolveDeployFee(context, 'jetton_simple_auction', args.deployFee);
            const message = await Marketplace.getDeployJettonSimpleAuctionMessageInfo(
                parseAddress(args.userAddress),
                parseAddress(args.domainAddress),
                args.domainName,
                deployFee,
                args.isWeb3,
                args.startTime,
                args.endTime,
                args.minBidValue,
                args.maxBidValue,
                args.minBidIncrement,
                args.timeIncrement,
                args.isDeferred ?? false,
                args.discountCell ?? null,
                args.queryId ?? 0,
                context.contracts.marketplace,
                context.getTonClient()
            );
            return prepareSingle('DeployJettonSimpleAuction', message, {
                queryId: args.queryId,
                contractAddress: args.domainAddress,
                domainNames: [args.domainName]
            });
        },

        async deployTonMultiple(args: {
            domainAddresses: AddressLike[];
            deployFee?: bigint;
            startTime: number;
            endTime: number;
            minBidValue: bigint;
            maxBidValue: bigint;
            minBidIncrement: number;
            timeIncrement: number;
            isDeferred?: boolean;
            discountCell?: Cell | null;
            queryId?: number;
            domainNames?: string[];
        }) {
            const deployFee = await resolveDeployFee(context, 'ton_multiple_auction', args.deployFee);
            return prepareSingle(
                'DeployTonMultipleAuction',
                Marketplace.getDeployTonMultipleAuctionMessageInfo(
                    args.domainAddresses.map(parseAddress),
                    deployFee,
                    args.startTime,
                    args.endTime,
                    args.minBidValue,
                    args.maxBidValue,
                    args.minBidIncrement,
                    args.timeIncrement,
                    args.isDeferred ?? false,
                    args.discountCell ?? null,
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                {
                    queryId: args.queryId,
                    domainNames: args.domainNames
                }
            );
        },

        async deployJettonMultiple(args: {
            domainAddresses: AddressLike[];
            deployFee?: bigint;
            isWeb3: boolean;
            startTime: number;
            endTime: number;
            minBidValue: bigint;
            maxBidValue: bigint;
            minBidIncrement: number;
            timeIncrement: number;
            isDeferred?: boolean;
            discountCell?: Cell | null;
            queryId?: number;
            domainNames?: string[];
        }) {
            const deployFee = await resolveDeployFee(context, 'jetton_multiple_auction', args.deployFee);
            return prepareSingle(
                'DeployJettonMultipleAuction',
                Marketplace.getDeployJettonMultipleAuctionMessageInfo(
                    args.domainAddresses.map(parseAddress),
                    deployFee,
                    args.isWeb3,
                    args.startTime,
                    args.endTime,
                    args.minBidValue,
                    args.maxBidValue,
                    args.minBidIncrement,
                    args.timeIncrement,
                    args.isDeferred ?? false,
                    args.discountCell ?? null,
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                {
                    queryId: args.queryId,
                    domainNames: args.domainNames
                }
            );
        },

        stop(args: { auctionAddress: AddressLike; isGetgems?: boolean; isV4?: boolean }) {
            return prepareSingle(
                'StopAuction',
                Auction.getStopAuctionMessageInfo(parseAddress(args.auctionAddress), args.isGetgems ?? false, args.isV4 ?? false),
                {
                    contractAddress: args.auctionAddress
                }
            );
        },

        placeTonSimpleBid(args: { auctionAddress: AddressLike; bidValue: bigint }) {
            return prepareSingle(
                'PlaceTonSimpleAuctionBid',
                TonSimpleAuction.placeBidMessageInfo(parseAddress(args.auctionAddress), args.bidValue),
                { contractAddress: args.auctionAddress }
            );
        },

        placeTonMultipleBid(args: { auctionAddress: AddressLike; bidValue: bigint; domainsNumber: number }) {
            return prepareSingle(
                'PlaceTonMultipleAuctionBid',
                TonMultipleAuction.placeBidMessageInfo(parseAddress(args.auctionAddress), args.bidValue, args.domainsNumber),
                { contractAddress: args.auctionAddress }
            );
        },

        async placeJettonSimpleBid(args: {
            userAddress: AddressLike;
            auctionAddress: AddressLike;
            jettonWalletAddress?: AddressLike;
            value: bigint;
            queryId?: number;
        }) {
            const jettonWalletAddress = await resolveJettonWalletAddressFromDeal({
                context,
                userAddress: args.userAddress,
                dealAddress: args.auctionAddress,
                jettonWalletAddress: args.jettonWalletAddress
            });
            return prepareSingle(
                'PlaceJettonSimpleAuctionBid',
                JettonSimpleAuction.getPlaceBidMessageInfo(
                    parseAddress(args.userAddress),
                    parseAddress(args.auctionAddress),
                    jettonWalletAddress,
                    args.value,
                    args.queryId ?? 0
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.auctionAddress
                }
            );
        },

        async placeJettonMultipleBid(args: {
            userAddress: AddressLike;
            auctionAddress: AddressLike;
            jettonWalletAddress?: AddressLike;
            bidValue: bigint;
            domainsNumber: number;
            queryId?: number;
        }) {
            const jettonWalletAddress = await resolveJettonWalletAddressFromDeal({
                context,
                userAddress: args.userAddress,
                dealAddress: args.auctionAddress,
                jettonWalletAddress: args.jettonWalletAddress
            });
            return prepareSingle(
                'PlaceJettonMultipleAuctionBid',
                JettonMultipleAuction.getPlaceBidMessageInfo(
                    parseAddress(args.userAddress),
                    parseAddress(args.auctionAddress),
                    jettonWalletAddress,
                    args.bidValue,
                    args.domainsNumber,
                    args.queryId ?? 0
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.auctionAddress
                }
            );
        },

        renewDomains(args: { auctionAddress: AddressLike; domainsNumber: number; queryId?: number; isOldContract?: boolean }) {
            return prepareSingle(
                'RenewAuctionDomains',
                Auction.getRenewDomainMessageInfo(parseAddress(args.auctionAddress), args.domainsNumber, args.queryId ?? 0, args.isOldContract),
                {
                    queryId: args.queryId,
                    contractAddress: args.auctionAddress
                }
            );
        }
    };
}
