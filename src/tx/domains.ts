import type { Cell } from '@ton/core';

import type { AddressLike } from '../config';
import { DomainContract, ShoppingCart } from '../contracts';
import type { TxContext } from './shared';
import { parseAddress, prepareSingle } from './shared';

export function createDomainTransactions(context: TxContext) {
    return {
        async transfer(args: {
            domainAddress: AddressLike;
            newOwner: AddressLike;
            responseAddress?: AddressLike | null;
            forwardPayload?: Cell | null;
            forwardAmount?: bigint;
            queryId?: number;
            isTgUsername?: boolean;
        }) {
            const message = await DomainContract.getTransferMessageInfo(
                parseAddress(args.domainAddress),
                parseAddress(args.newOwner),
                args.responseAddress ? parseAddress(args.responseAddress) : null,
                args.forwardPayload ?? null,
                args.forwardAmount ?? 0n,
                args.queryId ?? 0,
                args.isTgUsername ?? false,
                context.getTonClient()
            );
            return prepareSingle('TransferDomain', message, {
                queryId: args.queryId,
                contractAddress: args.domainAddress
            });
        },

        startAuction(args: { domainAddress: AddressLike; domainLength?: number; bidValue?: bigint; queryId?: number }) {
            return prepareSingle(
                'StartDnsAuction',
                DomainContract.getStartAuctionMessageInfo(parseAddress(args.domainAddress), args.domainLength, args.queryId, args.bidValue),
                {
                    queryId: args.queryId,
                    contractAddress: args.domainAddress
                }
            );
        },

        placePrimaryAuctionBid(args: { domainAddress: AddressLike; bidValue: bigint }) {
            return prepareSingle(
                'PlacePrimaryAuctionBid',
                DomainContract.getPlaceBidMessageInfo(parseAddress(args.domainAddress), args.bidValue),
                {
                    contractAddress: args.domainAddress
                }
            );
        },

        stopTeleitemAuction(args: { domainAddress: AddressLike; queryId?: number }) {
            return prepareSingle(
                'StopTeleitemAuction',
                DomainContract.getStopTeleitemAuctionMessageInfo(parseAddress(args.domainAddress), args.queryId ?? 0),
                {
                    queryId: args.queryId,
                    contractAddress: args.domainAddress
                }
            );
        },

        linkWallet(args: { domainAddress: AddressLike; walletAddress?: AddressLike; queryId?: number }) {
            return prepareSingle(
                'LinkWallet',
                DomainContract.getLinkWalletMessageInfo(
                    parseAddress(args.domainAddress),
                    args.walletAddress ? parseAddress(args.walletAddress) : undefined,
                    args.queryId ?? 0
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.domainAddress
                }
            );
        },

        removeRecord(args: { domainAddress: AddressLike; recordType: string; queryId?: number }) {
            return prepareSingle(
                'RemoveDnsRecord',
                DomainContract.getRemoveDnsRecordMessageInfo(parseAddress(args.domainAddress), args.recordType, args.queryId ?? 0),
                {
                    queryId: args.queryId,
                    contractAddress: args.domainAddress
                }
            );
        },

        removeAllLinks(args: { domainAddress: AddressLike; queryId?: number }) {
            return prepareSingle(
                'RemoveAllLinks',
                DomainContract.getRemoveAllLinksMessageInfo(parseAddress(args.domainAddress), args.queryId ?? 0),
                {
                    queryId: args.queryId,
                    contractAddress: args.domainAddress
                }
            );
        },

        deployShoppingCart(args: { ownerAddress: AddressLike; domainsDict: Parameters<typeof ShoppingCart.getDeployMessageInfo>[1] }) {
            return prepareSingle(
                'DeployShoppingCart',
                ShoppingCart.getDeployMessageInfo(parseAddress(args.ownerAddress), args.domainsDict)
            );
        }
    };
}
