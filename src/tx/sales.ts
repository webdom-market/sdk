import type { Cell } from '@ton/core';

import type { AddressLike } from '../config';
import {
    DefaultContract,
    FixPriceSale,
    JettonMultipleSale,
    JettonSimpleSale,
    Marketplace,
    TonMultipleSale,
    TonSimpleSale
} from '../contracts';
import type { TxContext } from './shared';
import {
    parseAddress,
    prepareSingle,
    resolveDealPrice,
    resolveDealPurchaseDetails,
    resolveDeployFee,
    resolveJettonWalletAddress
} from './shared';

export function createSaleTransactions(context: TxContext) {
    return {
        async deployTonSimple(args: {
            userAddress: AddressLike;
            domainAddress: AddressLike;
            domainName: string;
            deployFee?: bigint;
            price: bigint;
            validUntil: number;
            autoRenewCooldown?: number;
            autoRenewIterations?: number;
            discountCell?: Cell | null;
            queryId?: number;
        }) {
            const deployFee = await resolveDeployFee(context, 'ton_simple_sale', args.deployFee);
            const message = await Marketplace.getDeployTonSimpleSaleMessageInfo(
                parseAddress(args.userAddress),
                parseAddress(args.domainAddress),
                args.domainName,
                deployFee,
                args.price,
                args.validUntil,
                args.autoRenewCooldown,
                args.autoRenewIterations,
                args.discountCell ?? null,
                args.queryId ?? 0,
                context.contracts.marketplace,
                context.getTonClient()
            );
            return prepareSingle('DeployTonSimpleSale', message, {
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
            price: bigint;
            validUntil: number;
            autoRenewCooldown?: number;
            autoRenewIterations?: number;
            discountCell?: Cell | null;
            queryId?: number;
        }) {
            const deployFee = await resolveDeployFee(context, 'jetton_simple_sale', args.deployFee);
            const message = await Marketplace.getDeployJettonSimpleSaleMessageInfo(
                parseAddress(args.userAddress),
                parseAddress(args.domainAddress),
                args.domainName,
                deployFee,
                args.isWeb3,
                args.price,
                args.validUntil,
                args.autoRenewCooldown,
                args.autoRenewIterations,
                args.discountCell ?? null,
                args.queryId ?? 0,
                context.contracts.marketplace,
                context.getTonClient()
            );
            return prepareSingle('DeployJettonSimpleSale', message, {
                queryId: args.queryId,
                contractAddress: args.domainAddress,
                domainNames: [args.domainName]
            });
        },

        async deployTonMultiple(args: {
            domainAddresses: AddressLike[];
            deployFee?: bigint;
            price: bigint;
            validUntil: number;
            autoRenewCooldown?: number;
            autoRenewIterations?: number;
            discountCell?: Cell | null;
            queryId?: number;
            domainNames?: string[];
        }) {
            const deployFee = await resolveDeployFee(context, 'ton_multiple_sale', args.deployFee);
            return prepareSingle(
                'DeployTonMultipleSale',
                Marketplace.getDeployTonMultipleSaleMessageInfo(
                    args.domainAddresses.map(parseAddress),
                    deployFee,
                    args.price,
                    args.validUntil,
                    args.autoRenewCooldown,
                    args.autoRenewIterations,
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
            price: bigint;
            validUntil: number;
            autoRenewCooldown?: number;
            autoRenewIterations?: number;
            discountCell?: Cell | null;
            queryId?: number;
            domainNames?: string[];
        }) {
            const deployFee = await resolveDeployFee(context, 'jetton_multiple_sale', args.deployFee);
            return prepareSingle(
                'DeployJettonMultipleSale',
                Marketplace.getDeployJettonMultipleSaleMessageInfo(
                    args.domainAddresses.map(parseAddress),
                    deployFee,
                    args.isWeb3,
                    args.price,
                    args.validUntil,
                    args.autoRenewCooldown,
                    args.autoRenewIterations,
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

        changePrice(args: {
            saleAddress: AddressLike;
            newPrice: bigint;
            newValidUntil: number;
            queryId?: number;
        }) {
            return prepareSingle(
                'ChangeFixPriceSalePrice',
                FixPriceSale.getChangePriceMessageInfo(parseAddress(args.saleAddress), args.newPrice, args.newValidUntil, args.queryId ?? 0),
                {
                    queryId: args.queryId,
                    contractAddress: args.saleAddress
                }
            );
        },

        cancel(args: { saleAddress: AddressLike; isGetgems?: boolean | number | bigint }) {
            return prepareSingle(
                'CancelFixPriceSale',
                DefaultContract.getCancelDealMessageInfo(parseAddress(args.saleAddress), args.isGetgems ?? true),
                { contractAddress: args.saleAddress }
            );
        },

        cancelTonMultiple(args: { saleAddress: AddressLike; domainsNumber: number | bigint | boolean }) {
            return prepareSingle(
                'CancelTonMultipleSale',
                TonMultipleSale.getCancelDealMessageInfo(parseAddress(args.saleAddress), args.domainsNumber),
                { contractAddress: args.saleAddress }
            );
        },

        async purchaseTonSimple(args: { saleAddress: AddressLike; price?: bigint }) {
            const price = await resolveDealPrice(context, args.saleAddress, args.price, { expectedCurrency: 'TON' });
            return prepareSingle(
                'PurchaseTonSimpleSale',
                TonSimpleSale.getPurchaseMessageInfo(parseAddress(args.saleAddress), price),
                { contractAddress: args.saleAddress }
            );
        },

        async purchaseTonMultiple(args: { saleAddress: AddressLike; price?: bigint; domainsNumber?: number | bigint }) {
            const deal = await resolveDealPurchaseDetails({
                context,
                saleAddress: args.saleAddress,
                price: args.price,
                domainsNumber: args.domainsNumber,
                expectedCurrency: 'TON'
            });
            return prepareSingle(
                'PurchaseTonMultipleSale',
                TonMultipleSale.getPurchaseMessageInfo(parseAddress(args.saleAddress), deal.price, deal.domainsNumber),
                { contractAddress: args.saleAddress }
            );
        },

        async purchaseJettonSimple(args: {
            userAddress: AddressLike;
            saleAddress: AddressLike;
            jettonWalletAddress?: AddressLike;
            price?: bigint;
            queryId?: number;
        }) {
            const deal = args.price === undefined || args.jettonWalletAddress === undefined ? await context.api.deals.get({
                deal_address: parseAddress(args.saleAddress).toString()
            }) : null;
            const dealPrice = deal?.pricing.price;
            const price = args.price ?? (dealPrice ? BigInt(dealPrice.amount) : undefined);

            if (price === undefined) {
                throw new Error(`Deal ${parseAddress(args.saleAddress).toString()} does not contain a price`);
            }

            const jettonWalletAddress = await resolveJettonWalletAddress({
                context,
                userAddress: args.userAddress,
                jettonWalletAddress: args.jettonWalletAddress,
                currency: dealPrice?.currency
            });

            return prepareSingle(
                'PurchaseJettonSimpleSale',
                JettonSimpleSale.getPurchaseMessageInfo(
                    parseAddress(args.userAddress),
                    parseAddress(args.saleAddress),
                    jettonWalletAddress,
                    price,
                    args.queryId ?? 0
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.saleAddress
                }
            );
        },

        async purchaseJettonMultiple(args: {
            userAddress: AddressLike;
            saleAddress: AddressLike;
            jettonWalletAddress?: AddressLike;
            domainsNumber?: number;
            price?: bigint;
            queryId?: number;
        }) {
            const shouldLoadDeal = args.price === undefined || args.domainsNumber === undefined || args.jettonWalletAddress === undefined;
            const fetchedDeal = shouldLoadDeal ? await context.api.deals.get({
                deal_address: parseAddress(args.saleAddress).toString()
            }) : null;
            const dealPrice = fetchedDeal?.pricing.price;
            const price = args.price ?? (dealPrice ? BigInt(dealPrice.amount) : undefined);
            const domainsNumber = args.domainsNumber ?? fetchedDeal?.domain_names.length;

            if (price === undefined) {
                throw new Error(`Deal ${parseAddress(args.saleAddress).toString()} does not contain a price`);
            }
            if (domainsNumber === undefined || domainsNumber <= 0) {
                throw new Error(`Deal ${parseAddress(args.saleAddress).toString()} does not contain purchasable domains`);
            }

            const jettonWalletAddress = await resolveJettonWalletAddress({
                context,
                userAddress: args.userAddress,
                jettonWalletAddress: args.jettonWalletAddress,
                currency: dealPrice?.currency
            });

            return prepareSingle(
                'PurchaseJettonMultipleSale',
                JettonMultipleSale.getPurchaseMessageInfo(
                    parseAddress(args.userAddress),
                    parseAddress(args.saleAddress),
                    jettonWalletAddress,
                    domainsNumber,
                    price,
                    args.queryId ?? 0
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.saleAddress
                }
            );
        },

        renewDomains(args: { saleAddress: AddressLike; domainsNumber: number; queryId?: number; isOldContract?: boolean }) {
            return prepareSingle(
                'RenewFixPriceSaleDomains',
                FixPriceSale.getRenewDomainMessageInfo(parseAddress(args.saleAddress), args.domainsNumber, args.queryId ?? 0, args.isOldContract),
                {
                    queryId: args.queryId,
                    contractAddress: args.saleAddress
                }
            );
        },

        setAutoRenewParams(args: {
            saleAddress: AddressLike;
            domainsNumber: number;
            autoRenewCooldown: number;
            autoRenewIterations: number;
            currentAutoRenewIterations?: number;
            queryId?: number;
            newValidUntil?: number;
        }) {
            return prepareSingle(
                'SetAutoRenewParams',
                FixPriceSale.getSetAutoRenewParamsMessageInfo(
                    parseAddress(args.saleAddress),
                    args.domainsNumber,
                    args.autoRenewCooldown,
                    args.autoRenewIterations,
                    args.currentAutoRenewIterations ?? 0,
                    args.queryId ?? 0,
                    args.newValidUntil ?? 0
                ),
                {
                    queryId: args.queryId,
                    contractAddress: args.saleAddress
                }
            );
        }
    };
}
