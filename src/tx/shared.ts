import type { Cell } from '@ton/core';
import { Address, beginCell } from '@ton/core';

import type { WebdomApi } from '../api/high-level';
import type { AddressLike, WebdomContractAddresses, WebdomSdkContext } from '../config';
import type { Deal, MarketplaceConfig as AgentMarketplaceConfig } from '../generated/agent-api';
import type { MessageInfo } from '../contracts';
import { JettonMinter } from '../contracts';

export type TonConnectMessage = MessageInfo;

export type PreparedTransaction = {
    messages: TonConnectMessage[];
    queryId?: number;
    meta?: {
        kind: string;
        contractAddress?: string;
        domainNames?: string[];
    };
};

export type TxApi = Pick<WebdomApi, 'analytics' | 'marketplace' | 'deals' | 'offers'>;

export type TxContext = {
    api: TxApi;
    contracts: WebdomContractAddresses;
    getTonClient: WebdomSdkContext['getTonClient'];
};

export type MarketplaceDeployAlias =
    | 'ton_simple_sale'
    | 'jetton_simple_sale'
    | 'ton_multiple_sale'
    | 'jetton_multiple_sale'
    | 'ton_simple_auction'
    | 'jetton_simple_auction'
    | 'ton_multiple_auction'
    | 'jetton_multiple_auction'
    | 'ton_simple_offer'
    | 'jetton_simple_offer'
    | 'multiple_offer'
    | 'multiple_domain_swap';

export type CurrencyCode = 'TON' | 'USDT' | 'WEB3';
export type JettonCurrencyCode = 'USDT' | 'WEB3';

export function createTxContext(context: WebdomSdkContext, api: WebdomApi): TxContext {
    return {
        api,
        contracts: context.contracts,
        getTonClient: () => context.getTonClient()
    };
}

export function parseAddress(address: AddressLike): Address {
    return typeof address === 'string' ? Address.parse(address) : address;
}

export function parseRequiredBigInt(value: string | undefined | null, message: string): bigint {
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(message);
    }
    return BigInt(value);
}

export function prepareSingle(
    kind: string,
    message: MessageInfo,
    options?: {
        queryId?: number;
        contractAddress?: AddressLike;
        domainNames?: string[];
    }
): PreparedTransaction {
    return {
        messages: [message],
        queryId: options?.queryId,
        meta: {
            kind,
            contractAddress: options?.contractAddress ? parseAddress(options.contractAddress).toString() : undefined,
            domainNames: options?.domainNames
        }
    };
}

export async function getMarketplaceDeployConfig(context: TxContext, alias: MarketplaceDeployAlias) {
    const config = await context.api.marketplace.getConfig() as AgentMarketplaceConfig;
    const deployConfig = config.deploy_configs[alias];

    if (!deployConfig) {
        throw new Error(`Marketplace config does not contain deploy config "${alias}"`);
    }

    return deployConfig;
}

export async function resolveDeployFee(
    context: TxContext,
    alias: MarketplaceDeployAlias,
    deployFee?: bigint
): Promise<bigint> {
    if (deployFee !== undefined) {
        return deployFee;
    }

    const deployConfig = await getMarketplaceDeployConfig(context, alias);
    return parseRequiredBigInt(deployConfig.deploy_fee?.amount, `Marketplace config for "${alias}" does not provide deploy_fee`);
}

export async function resolveCompletionCommission(
    context: TxContext,
    alias: MarketplaceDeployAlias,
    completionCommission?: bigint
): Promise<bigint> {
    if (completionCommission !== undefined) {
        return completionCommission;
    }

    const deployConfig = await getMarketplaceDeployConfig(context, alias);
    return parseRequiredBigInt(
        deployConfig.completion_commission?.amount,
        `Marketplace config for "${alias}" does not provide completion_commission`
    );
}

export async function getDealForPurchase(context: TxContext, saleAddress: AddressLike) {
    return await context.api.deals.get({
        deal_address: parseAddress(saleAddress).toString()
    }) as Deal;
}

export async function getOfferForJettonAction(context: TxContext, offerAddress: AddressLike) {
    return await context.api.offers.get({
        offer_address: parseAddress(offerAddress).toString()
    }) as {
        pricing: {
            price: {
                currency: CurrencyCode;
            };
        };
    };
}

export function normalizeJettonSymbol(symbol: string): JettonCurrencyCode {
    const normalized = symbol.trim().toUpperCase();
    if (normalized === 'USDT' || normalized === 'WEB3') {
        return normalized;
    }
    throw new Error(`Unsupported jetton symbol "${symbol}". Expected "USDT" or "WEB3"`);
}

export function pickDealCurrency(deal: Deal): CurrencyCode | undefined {
    return (
        deal.pricing.price?.currency ??
        deal.pricing.next_min_bid?.currency ??
        deal.pricing.min_bid_value?.currency ??
        deal.pricing.max_bid_value?.currency ??
        deal.pricing.execution_price_ton?.currency
    );
}

export async function resolveDealPrice(
    context: TxContext,
    saleAddress: AddressLike,
    price?: bigint,
    options?: { expectedCurrency?: CurrencyCode; rejectedCurrency?: CurrencyCode }
): Promise<bigint> {
    if (price !== undefined) {
        return price;
    }

    const saleAddressString = parseAddress(saleAddress).toString();
    const deal = await getDealForPurchase(context, saleAddress);
    const dealPrice = deal.pricing.price;

    if (!dealPrice) {
        throw new Error(`Deal ${saleAddressString} does not contain a price`);
    }
    if (options?.expectedCurrency && dealPrice.currency !== options.expectedCurrency) {
        throw new Error(`Deal ${saleAddressString} is priced in ${dealPrice.currency}, expected ${options.expectedCurrency}`);
    }
    if (options?.rejectedCurrency && dealPrice.currency === options.rejectedCurrency) {
        throw new Error(`Deal ${saleAddressString} is priced in ${dealPrice.currency}, use a matching purchase helper`);
    }

    return BigInt(dealPrice.amount);
}

export async function resolveJettonWalletAddress(args: {
    context: TxContext;
    userAddress: AddressLike;
    jettonWalletAddress?: AddressLike;
    currency?: CurrencyCode | JettonCurrencyCode;
}): Promise<Address> {
    if (args.jettonWalletAddress !== undefined) {
        return parseAddress(args.jettonWalletAddress);
    }

    if (args.currency !== 'USDT' && args.currency !== 'WEB3') {
        throw new Error(`Jetton wallet auto-resolution requires a USDT or WEB3 deal currency, got ${args.currency ?? 'unknown'}`);
    }

    const tonClient = args.context.getTonClient();
    const ownerAddress = parseAddress(args.userAddress);
    const minterAddress = args.currency === 'USDT' ? args.context.contracts.usdt : args.context.contracts.web3;
    const minter = JettonMinter.createFromAddress(minterAddress);
    const { last } = await tonClient.getLastBlock();
    const response = await tonClient.runMethod(last.seqno, minter.address, 'get_wallet_address', [
        {
            type: 'slice',
            cell: beginCell().storeAddress(ownerAddress).endCell()
        }
    ]);

    return response.reader.readAddress();
}

export async function resolveJettonWalletAddressFromDeal(args: {
    context: TxContext;
    userAddress: AddressLike;
    dealAddress: AddressLike;
    jettonWalletAddress?: AddressLike;
}): Promise<Address> {
    if (args.jettonWalletAddress !== undefined) {
        return parseAddress(args.jettonWalletAddress);
    }

    const deal = await getDealForPurchase(args.context, args.dealAddress);
    return resolveJettonWalletAddress({
        context: args.context,
        userAddress: args.userAddress,
        currency: pickDealCurrency(deal)
    });
}

export async function resolveJettonWalletAddressFromOffer(args: {
    context: TxContext;
    userAddress: AddressLike;
    offerAddress: AddressLike;
    jettonWalletAddress?: AddressLike;
}): Promise<Address> {
    if (args.jettonWalletAddress !== undefined) {
        return parseAddress(args.jettonWalletAddress);
    }

    const offer = await getOfferForJettonAction(args.context, args.offerAddress);
    return resolveJettonWalletAddress({
        context: args.context,
        userAddress: args.userAddress,
        currency: offer.pricing.price.currency
    });
}

export async function resolveDealPurchaseDetails(args: {
    context: TxContext;
    saleAddress: AddressLike;
    price?: bigint;
    domainsNumber?: number | bigint;
    expectedCurrency?: CurrencyCode;
    rejectedCurrency?: CurrencyCode;
}) {
    if (args.price !== undefined && args.domainsNumber !== undefined) {
        return {
            price: args.price,
            domainsNumber: args.domainsNumber
        };
    }

    const saleAddressString = parseAddress(args.saleAddress).toString();
    const deal = await getDealForPurchase(args.context, args.saleAddress);
    const dealPrice = deal.pricing.price;

    if (!dealPrice) {
        throw new Error(`Deal ${saleAddressString} does not contain a price`);
    }
    if (args.expectedCurrency && dealPrice.currency !== args.expectedCurrency) {
        throw new Error(`Deal ${saleAddressString} is priced in ${dealPrice.currency}, expected ${args.expectedCurrency}`);
    }
    if (args.rejectedCurrency && dealPrice.currency === args.rejectedCurrency) {
        throw new Error(`Deal ${saleAddressString} is priced in ${dealPrice.currency}, use a matching purchase helper`);
    }

    const domainsNumber = args.domainsNumber ?? deal.domain_names.length;
    if (typeof domainsNumber === 'number' ? domainsNumber <= 0 : domainsNumber <= 0n) {
        throw new Error(`Deal ${saleAddressString} does not contain purchasable domains`);
    }

    return {
        price: args.price ?? BigInt(dealPrice.amount),
        domainsNumber
    };
}

export type DiscountCellLike = Cell | null | undefined;
