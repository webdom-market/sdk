import type { Cell } from '@ton/core';

import type { AddressLike } from '../config';
import {
    DefaultContract,
    JettonSimpleOffer,
    JettonWallet,
    Marketplace,
    MultipleOffer,
    Offer,
    TonSimpleOffer
} from '../contracts';
import type { TxContext } from './shared';
import {
    normalizeJettonSymbol,
    parseAddress,
    prepareSingle,
    resolveDeployFee,
    resolveJettonWalletAddress,
    resolveJettonWalletAddressFromOffer
} from './shared';

export function createOfferTransactions(context: TxContext) {
    return {
        async deployTonSimple(args: {
            sellerAddress: AddressLike;
            domainName: string;
            deployFee?: bigint;
            price: bigint;
            commission: bigint;
            validUntil: number;
            discountCell?: Cell | null;
            notifySeller?: boolean;
            queryId?: number;
        }) {
            const deployFee = await resolveDeployFee(context, 'ton_simple_offer', args.deployFee);
            return prepareSingle(
                'DeployTonSimpleOffer',
                Marketplace.getDeployTonSimpleOfferMessageInfo(
                    parseAddress(args.sellerAddress),
                    args.domainName,
                    deployFee,
                    args.price,
                    args.commission,
                    args.validUntil,
                    args.discountCell ?? null,
                    args.notifySeller ?? true,
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                {
                    queryId: args.queryId,
                    domainNames: [args.domainName]
                }
            );
        },

        async deployJettonSimple(args: {
            userAddress: AddressLike;
            jettonWalletAddress?: AddressLike;
            jettonSymbol?: string;
            domainName: string;
            deployFee?: bigint;
            sellerAddress: AddressLike;
            price: bigint;
            commission: bigint;
            validUntil: number;
            notifySeller: boolean;
            discountCell?: Cell | null;
            queryId?: number;
        }) {
            const deployFee = await resolveDeployFee(context, 'jetton_simple_offer', args.deployFee);
            const jettonWalletAddress = await resolveJettonWalletAddress({
                context,
                userAddress: args.userAddress,
                jettonWalletAddress: args.jettonWalletAddress,
                currency: args.jettonSymbol ? normalizeJettonSymbol(args.jettonSymbol) : undefined
            });
            return prepareSingle(
                'DeployJettonSimpleOffer',
                Marketplace.getDeployJettonSimpleOfferMessageInfo(
                    parseAddress(args.userAddress),
                    jettonWalletAddress,
                    args.domainName,
                    deployFee,
                    parseAddress(args.sellerAddress),
                    args.price,
                    args.commission,
                    args.validUntil,
                    args.notifySeller,
                    args.discountCell ?? null,
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                {
                    queryId: args.queryId,
                    domainNames: [args.domainName]
                }
            );
        },

        async acceptPurchase(args: {
            domainAddress: AddressLike;
            offerAddress: AddressLike;
            userAddress: AddressLike;
            queryId?: number;
            isTgUsername?: boolean;
        }) {
            const message = await Offer.getAcceptOfferMessageInfo(
                parseAddress(args.domainAddress),
                parseAddress(args.offerAddress),
                parseAddress(args.userAddress),
                args.queryId ?? 0,
                args.isTgUsername ?? false
            );
            return prepareSingle('AcceptPurchaseOffer', message, {
                queryId: args.queryId,
                contractAddress: args.offerAddress
            });
        },

        cancelTonSimple(args: { offerAddress: AddressLike; cancellationComment?: string; queryId?: number }) {
            return prepareSingle(
                'CancelTonSimpleOffer',
                TonSimpleOffer.getCancelOfferMessageInfo(parseAddress(args.offerAddress), args.cancellationComment, args.queryId),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        },

        cancelJettonSimple(args: { offerAddress: AddressLike; cancellationComment?: string; queryId?: number }) {
            return prepareSingle(
                'CancelJettonSimpleOffer',
                JettonSimpleOffer.getCancelOfferMessageInfo(parseAddress(args.offerAddress), args.cancellationComment, args.queryId),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        },

        changeTonSimplePrice(args: {
            offerAddress: AddressLike;
            oldPrice: bigint;
            commissionRate: number;
            newPrice: bigint;
            newValidUntil: number;
            notifySeller: boolean;
            queryId?: number;
            afterCounterproposal?: boolean;
        }) {
            return prepareSingle(
                'ChangeTonSimpleOfferPrice',
                TonSimpleOffer.getChangePriceMessageInfo(
                    parseAddress(args.offerAddress),
                    args.oldPrice,
                    args.commissionRate,
                    args.newPrice,
                    args.newValidUntil,
                    args.notifySeller,
                    args.queryId ?? 0,
                    args.afterCounterproposal ?? false
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        },

        async changeJettonSimplePrice(args: {
            userAddress: AddressLike;
            offerAddress: AddressLike;
            jettonWalletAddress?: AddressLike;
            oldPrice: bigint;
            commissionRate: number;
            newPrice: bigint;
            newValidUntil: number;
            notifySeller: boolean;
            queryId?: number;
            afterCounterproposal?: boolean;
        }) {
            const jettonWalletAddress = await resolveJettonWalletAddressFromOffer({
                context,
                userAddress: args.userAddress,
                offerAddress: args.offerAddress,
                jettonWalletAddress: args.jettonWalletAddress
            });
            return prepareSingle(
                'ChangeJettonSimpleOfferPrice',
                JettonSimpleOffer.getChangePriceMessageInfo(
                    parseAddress(args.userAddress),
                    parseAddress(args.offerAddress),
                    jettonWalletAddress,
                    args.oldPrice,
                    args.commissionRate,
                    args.newPrice,
                    args.newValidUntil,
                    args.notifySeller,
                    args.queryId ?? 0,
                    args.afterCounterproposal ?? false
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        },

        async initialCounterProposePurchase(args: {
            offerAddress: AddressLike;
            domainAddress: AddressLike;
            userAddress: AddressLike;
            newPrice: bigint;
            notifyBuyer: boolean;
            isTgUsername?: boolean;
            queryId?: number;
        }) {
            const message = await Offer.getInitialCounterProposeMessageInfo(
                parseAddress(args.offerAddress),
                parseAddress(args.domainAddress),
                parseAddress(args.userAddress),
                args.newPrice,
                args.notifyBuyer,
                args.isTgUsername ?? false,
                args.queryId ?? 0
            );
            return prepareSingle('InitialCounterProposePurchaseOffer', message, {
                queryId: args.queryId,
                contractAddress: args.offerAddress
            });
        },

        counterProposePurchase(args: {
            offerAddress: AddressLike;
            newPrice: bigint;
            notifyBuyer: boolean;
            queryId?: number;
        }) {
            return prepareSingle(
                'CounterProposePurchaseOffer',
                Offer.counterProposeMessageInfo(parseAddress(args.offerAddress), args.newPrice, args.notifyBuyer, args.queryId ?? 0),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        },

        changePurchaseValidUntil(args: { offerAddress: AddressLike; newValidUntil: number; queryId?: number }) {
            return prepareSingle(
                'ChangePurchaseOfferValidUntil',
                Offer.getChangeValidUntilMessageInfo(parseAddress(args.offerAddress), args.newValidUntil, args.queryId ?? 0),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        },

        async deployMultiple(args: {
            merkleRoot: bigint;
            deployFee?: bigint;
            discountCell?: Cell | null;
            additionalTon?: bigint;
            queryId?: number;
        }) {
            const deployFee = await resolveDeployFee(context, 'multiple_offer', args.deployFee);
            return prepareSingle(
                'DeployMultipleOffer',
                Marketplace.getDeployMultipleOfferMessageInfo(
                    args.merkleRoot,
                    deployFee,
                    args.discountCell ?? null,
                    args.additionalTon ?? 0n,
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                { queryId: args.queryId }
            );
        },

        cancelMultiple(args: { offerAddress: AddressLike; additionalTon?: bigint }) {
            return prepareSingle(
                'CancelMultipleOffer',
                MultipleOffer.getCancelDealMessageInfo(parseAddress(args.offerAddress), args.additionalTon ?? 0n),
                { contractAddress: args.offerAddress }
            );
        },

        depositMultipleTon(args: { offerAddress: AddressLike; amount: bigint; queryId?: number }) {
            return prepareSingle(
                'DepositMultipleOfferTon',
                DefaultContract.getFillUpBalanceMessageInfo(parseAddress(args.offerAddress), args.amount, args.queryId ?? 0),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        },

        depositMultipleJetton(args: {
            jettonWalletAddress: AddressLike;
            amount: bigint;
            offerAddress: AddressLike;
            responseAddress: AddressLike;
            tonAmountToReserve?: bigint;
            queryId?: number;
        }) {
            return prepareSingle(
                'DepositMultipleOfferJetton',
                JettonWallet.getTransferMessageInfo(
                    parseAddress(args.jettonWalletAddress),
                    args.amount,
                    parseAddress(args.offerAddress),
                    parseAddress(args.responseAddress),
                    15000000n,
                    MultipleOffer.fillUpJettonBalancePayload(args.tonAmountToReserve ?? 0n),
                    args.queryId ?? 0
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        },

        withdrawMultipleTon(args: { offerAddress: AddressLike; amount: bigint; queryId?: number }) {
            return prepareSingle(
                'WithdrawMultipleOfferTon',
                MultipleOffer.getWithdrawExactTonMessage(parseAddress(args.offerAddress), args.amount, args.queryId ?? 0),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        },

        withdrawMultipleJetton(args: {
            offerAddress: AddressLike;
            jettonWalletAddress: AddressLike;
            amount: bigint;
            queryId?: number;
        }) {
            return prepareSingle(
                'WithdrawMultipleOfferJetton',
                MultipleOffer.getWithdrawJettonMessageInfo(
                    parseAddress(args.offerAddress),
                    parseAddress(args.jettonWalletAddress),
                    args.amount,
                    args.queryId ?? 0
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.offerAddress
                }
            );
        }
    };
}
