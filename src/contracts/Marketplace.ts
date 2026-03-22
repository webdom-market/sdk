import type { Address, Cell, ContractProvider, DictionaryValue, Slice} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';
import { sign } from '@ton/crypto';
import type { TonClient4 } from '@ton/ton';
import type { Buffer } from 'buffer';

import { JettonMultipleAuction } from './auctions/JettonMultipleAuction';
import { JettonSimpleAuction } from './auctions/JettonSimpleAuction';
import { TonMultipleAuction } from './auctions/TonMultipleAuction';
import { TonSimpleAuction } from './auctions/TonSimpleAuction';
import { DomainContract } from './Domain';
import { DomainSwap } from './domainSwaps/domainSwap';
import { JettonMultipleSale } from './fixPriceSales/JettonMultipleSale';
import { JettonSimpleSale } from './fixPriceSales/JettonSimpleSale';
import { TonMultipleSale } from './fixPriceSales/TonMultipleSale';
import { TonSimpleSale } from './fixPriceSales/TonSimpleSale';
import { Addresses, ONE_DAY, OpCodes, Tons } from './imports/constants';
import { DefaultContract, MessageInfo } from './imports/DefaultContract';
import type { Maybe } from './imports/maybe';
import { JettonWallet } from './JettonWallet';
import { JettonSimpleOffer } from './offers/JettonSimpleOffer';
import { MultipleOffer } from './offers/MultipleOffer';
import { TonSimpleOffer } from './offers/TonSimpleOffer';

export class DeployData {
    raw: Cell;

    fromSlice(_data: Slice) {}
    constructor(data: Slice) {
        this.raw = data.asCell();
        this.fromSlice(data);
    }
}

export class TonSimpleSaleDeployData extends DeployData {
    minPrice: bigint;
    commissionFactor: number;
    maxCommission: bigint;
    minDuration: number;

    constructor(data: Slice) {
        super(data);
        this.minPrice = data.loadCoins();
        this.commissionFactor = data.loadUint(16);
        this.maxCommission = data.loadCoins();
        this.minDuration = data.loadUint(32);
    }

    static fromConfig(minPrice: bigint, commissionFactor: number, maxCommission: bigint, minDuration: number): TonSimpleSaleDeployData {
        return new TonSimpleSaleDeployData(
            beginCell()
                .storeCoins(minPrice)
                .storeUint(commissionFactor, 16)
                .storeCoins(maxCommission)
                .storeUint(minDuration, 32)
                .endCell()
                .beginParse()
        );
    }
}

export class TonMultipleSaleDeployData extends TonSimpleSaleDeployData {}

export class JettonSimpleSaleDeployData extends DeployData {
    minPriceUsdt: bigint;
    minPriceWeb3: bigint;
    commissionFactorUsdt: number;
    commissionFactorWeb3: number;
    maxCommissionUsdt: bigint;
    maxCommissionWeb3: bigint;
    minDurationUsdt: number;
    minDurationWeb3: number;

    constructor(data: Slice) {
        super(data);

        this.minPriceUsdt = data.loadCoins();
        this.commissionFactorUsdt = data.loadUint(16);
        this.maxCommissionUsdt = data.loadCoins();
        this.minDurationUsdt = data.loadUint(32);

        const web3Data = data.loadRef().beginParse();
        this.minPriceWeb3 = web3Data.loadCoins();
        this.commissionFactorWeb3 = web3Data.loadUint(16);
        this.maxCommissionWeb3 = web3Data.loadCoins();
        this.minDurationWeb3 = web3Data.loadUint(32);
    }

    static fromConfig(
        minPriceUsdt: bigint,
        commissionFactorUsdt: number,
        maxCommissionUsdt: bigint,
        minDurationUsdt: number,
        minPriceWeb3: bigint,
        commissionFactorWeb3: number,
        maxCommissionWeb3: bigint,
        minDurationWeb3: number
    ): JettonSimpleSaleDeployData {
        return new JettonSimpleSaleDeployData(
            beginCell()
                .storeCoins(minPriceUsdt)
                .storeUint(commissionFactorUsdt, 16)
                .storeCoins(maxCommissionUsdt)
                .storeUint(minDurationUsdt, 32)
                .storeRef(
                    // web3 data
                    beginCell()
                        .storeCoins(minPriceWeb3)
                        .storeUint(commissionFactorWeb3, 16)
                        .storeCoins(maxCommissionWeb3)
                        .storeUint(minDurationWeb3, 32)
                        .endCell()
                )
                .endCell()
                .beginParse()
        );
    }
}

export class TonSimpleOfferDeployData extends TonSimpleSaleDeployData {}

export class MultipleOfferDeployData extends DeployData {
    commissionFactor: number;
    web3CommissionFactor: number;

    constructor(data: Slice) {
        super(data);
        this.commissionFactor = data.loadUint(16);
        this.web3CommissionFactor = data.loadUint(16);
    }

    static fromConfig(commissionFactor: number, web3CommissionFactor: number): MultipleOfferDeployData {
        return new MultipleOfferDeployData(
            beginCell().storeUint(commissionFactor, 16).storeUint(web3CommissionFactor, 16).endCell().beginParse()
        );
    }
}

export class TonSimpleAuctionDeployData extends DeployData {
    minPrice: bigint;
    commissionFactor: number;
    maxCommission: bigint;
    minTimeIncrement: number;

    constructor(data: Slice) {
        super(data);
        this.minPrice = data.loadCoins();
        this.commissionFactor = data.loadUint(16);
        this.maxCommission = data.loadCoins();
        this.minTimeIncrement = data.loadUint(32);
    }

    static fromConfig(
        minPrice: bigint,
        commissionFactor: number,
        maxCommission: bigint,
        minTimeIncrement: number
    ): TonSimpleAuctionDeployData {
        return new TonSimpleAuctionDeployData(
            beginCell()
                .storeCoins(minPrice)
                .storeUint(commissionFactor, 16)
                .storeCoins(maxCommission)
                .storeUint(minTimeIncrement, 32)
                .endCell()
                .beginParse()
        );
    }
}

export class JettonSimpleAuctionDeployData extends DeployData {
    minPriceUsdt: bigint;
    commissionFactorUsdt: number;
    maxCommissionUsdt: bigint;
    minTimeIncrementUsdt: number;

    minPriceWeb3: bigint;
    commissionFactorWeb3: number;
    maxCommissionWeb3: bigint;
    minTimeIncrementWeb3: number;

    constructor(data: Slice) {
        super(data);
        this.minPriceUsdt = data.loadCoins();
        this.commissionFactorUsdt = data.loadUint(16);
        this.maxCommissionUsdt = data.loadCoins();
        this.minTimeIncrementUsdt = data.loadUint(32);

        const web3Data = data.loadRef().beginParse();
        this.minPriceWeb3 = web3Data.loadCoins();
        this.commissionFactorWeb3 = web3Data.loadUint(16);
        this.maxCommissionWeb3 = web3Data.loadCoins();
        this.minTimeIncrementWeb3 = web3Data.loadUint(32);
    }

    static fromConfig(
        minPriceUsdt: bigint,
        commissionFactorUsdt: number,
        maxCommissionUsdt: bigint,
        minTimeIncrementUsdt: number,
        minPriceWeb3: bigint,
        commissionFactorWeb3: number,
        maxCommissionWeb3: bigint,
        minTimeIncrementWeb3: number
    ): JettonSimpleAuctionDeployData {
        return new JettonSimpleAuctionDeployData(
            beginCell()
                .storeCoins(minPriceUsdt)
                .storeUint(commissionFactorUsdt, 16)
                .storeCoins(maxCommissionUsdt)
                .storeUint(minTimeIncrementUsdt, 32)
                .storeRef(
                    // web3 data
                    beginCell()
                        .storeCoins(minPriceWeb3)
                        .storeUint(commissionFactorWeb3, 16)
                        .storeCoins(maxCommissionWeb3)
                        .storeUint(minTimeIncrementWeb3, 32)
                        .endCell()
                )
                .endCell()
                .beginParse()
        );
    }
}

export class TonMultipleAuctionDeployData extends TonSimpleAuctionDeployData {}
export class JettonMultipleAuctionDeployData extends JettonSimpleAuctionDeployData {}

export class DomainSwapDeployData extends DeployData {
    completionCommission: bigint;
    minDuration: number;

    constructor(data: Slice) {
        super(data);
        this.completionCommission = data.loadCoins();
        this.minDuration = data.loadUint(32);
    }

    static fromConfig(completionCommission: bigint, minDuration: number): DomainSwapDeployData {
        return new DomainSwapDeployData(beginCell().storeCoins(completionCommission).storeUint(minDuration, 32).endCell().beginParse());
    }
}

export type DeployInfoValue = {
    code: Cell;
    deployFee: bigint;
    otherData: DeployData;
};

export function deployInfoValueParser(): DictionaryValue<DeployInfoValue> {
    return {
        serialize: (src, buidler) => {
            buidler.storeRef(src.code).storeCoins(src.deployFee).storeSlice(src.otherData.raw.beginParse()).endCell();
        },
        parse: (src) => {
            const code = src.loadRef();
            const deployFee = src.loadCoins();
            const otherData = new DeployData(src);
            return { code, deployFee, otherData };
        }
    };
}

export type UserSubscriptionValue = {
    level: number;
    endTime: number;
};

export function userSubscriptionValueParser(): DictionaryValue<UserSubscriptionValue> {
    return {
        serialize: (src, buidler) => {
            buidler.storeUint(src.level, 8).storeUint(src.endTime, 32).endCell();
        },
        parse: (src) => {
            const level = src.loadUint(8);
            const endTime = src.loadUint(32);
            return { level, endTime };
        }
    };
}

export function subscriptionInfoValueParser(): DictionaryValue<Dictionary<number, bigint>> {
    return {
        serialize: (src, buidler) => {
            buidler.storeDict(src, Dictionary.Keys.Uint(32), Dictionary.Values.BigUint(64)).endCell();
        },
        parse: (src) => {
            return src.loadDict(Dictionary.Keys.Uint(32), Dictionary.Values.BigUint(64));
        }
    };
}

export type PromotionPricesValue = {
    hotPrice: bigint;
    coloredPrice: bigint;
};

export function promotionPricesValueParser(): DictionaryValue<PromotionPricesValue> {
    return {
        serialize: (src, builder) => {
            builder.storeUint(src.hotPrice, 64).storeUint(src.coloredPrice, 64).endCell();
        },
        parse: (src) => {
            const hotPrice = BigInt(src.loadUint(64));
            const coloredPrice = BigInt(src.loadUint(64));
            return { hotPrice, coloredPrice };
        }
    };
}

export type MarketplaceConfig = {
    ownerAddress: Address;
    publicKey: bigint;

    moveUpSalePrice: bigint;
    currentTopSale: Address;
    collectedFeesTon: bigint;
    collectedFeesDict?: Dictionary<Address, bigint>;

    deployInfos: Dictionary<number, DeployInfoValue>;

    web3WalletAddress: Address;
    promotionPrices: Dictionary<number, PromotionPricesValue>;
    userSubscriptions?: Dictionary<Address, UserSubscriptionValue>;
    subscriptionsInfo?: Dictionary<number, Dictionary<number, bigint>>;
};

export class Marketplace extends DefaultContract {
    static readonly DeployOpCodes = {
        TON_SIMPLE_SALE: 0x763e023f & 0x0fffffff,
        TON_MULTIPLE_SALE: 0xbee2b108 & 0x0fffffff,
        JETTON_SIMPLE_SALE: 0xd3f7025d & 0x0fffffff,
        JETTON_MULTIPLE_SALE: 0xe32bc1bb & 0x0fffffff,

        MULTIPLE_DOMAINS_SWAP: 0xc29adb98 & 0x0fffffff,

        TON_SIMPLE_AUCTION: 0x48615374 & 0x0fffffff,
        TON_MULTIPLE_AUCTION: 0x54363e21 & 0x0fffffff,
        JETTON_SIMPLE_AUCTION: 0x2ef72bde & 0x0fffffff,
        JETTON_MULTIPLE_AUCTION: 0x3630619a & 0x0fffffff,

        TON_SIMPLE_OFFER: 0x1572efe4 & 0x0fffffff,
        JETTON_SIMPLE_OFFER: 0x08be756f & 0x0fffffff,
        MULTIPLE_OFFER: 0x97cb2a7a & 0x0fffffff
    };

    static TONS_BUY_SUBSCRIPTION = toNano('0.02');
    static TONS_MAKE_HOT = toNano('0.03');
    static TONS_DEPLOY_DEAL = toNano('0.17');
    static TONS_DEPLOY_OFFER = toNano('0.04');
    static AUTORENEW_STORAGE_PER_YEAR = toNano('0.035');

    static createFromAddress(address: Address) {
        return new Marketplace(address);
    }

    static deployDealTransferPayload(
        senderAddress: Address,
        opCode: number,
        domainName: string,
        deployPayload: Cell,
        secretKey?: Buffer,
        signTime?: number,
        commissionDiscount: number = 0
    ) {
        let discountCell = null;
        if (domainName.endsWith('.ton')) {
            domainName = domainName.slice(0, -4);
        }
        if (commissionDiscount > 0) {
            const tmp2 = beginCell()
                .storeUint(signTime ?? Math.floor(Date.now() / 1000), 32)
                .storeAddress(senderAddress)
                .storeUint(commissionDiscount, 16);
            const signature = sign(tmp2.endCell().hash(), secretKey!);
            discountCell = tmp2.storeRef(beginCell().storeBuffer(signature).endCell()).endCell();
        }
        return beginCell()
            .storeUint(opCode, 32)
            .storeStringRefTail(domainName)
            .storeMaybeRef(discountCell)
            .storeSlice(deployPayload.beginParse())
            .endCell();
    }

    static getDeployDealMessageInfo(
        opCode: number,
        requiredTon: bigint,
        deployPayload: Cell,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        return new MessageInfo(
            marketplaceAddress,
            requiredTon,
            beginCell()
                .storeUint(opCode, 32)
                .storeUint(queryId, 64)
                .storeMaybeRef(discountCell)
                .storeSlice(deployPayload.beginParse())
                .endCell(),
            null
        );
    }

    static getDeployDomainSwapMessageInfo(
        leftDomainAddresses: Address[],
        leftPaymentTotal: bigint,

        rightOwnerAddress: Address,
        rightDomainAddresses: Address[],
        rightPaymentTotal: bigint,

        deployFee: bigint,
        completionCommission: bigint,
        validUntil: number,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        return Marketplace.getDeployDealMessageInfo(
            Marketplace.DeployOpCodes.MULTIPLE_DOMAINS_SWAP,
            DomainSwap.TONS_DEPLOY +
            deployFee +
            completionCommission +
            toNano('0.17') +
            BigInt(leftDomainAddresses.length + rightDomainAddresses.length) * toNano('0.01'),
            DomainSwap.deployPayload(
                leftDomainAddresses,
                leftPaymentTotal,
                rightOwnerAddress,
                rightDomainAddresses,
                rightPaymentTotal,
                validUntil
            ),
            discountCell,
            queryId,
            marketplaceAddress
        );
    }

    static getDeployTonMultipleSaleMessageInfo(
        domainAddresses: Address[],
        deployFee: bigint,
        price: bigint,
        validUntil: number,
        autoRenewCooldown: number = ONE_DAY * 365,
        autoRenewIterations: number = 0,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        const autoRenewExtra =
            BigInt(autoRenewIterations) *
            (Marketplace.AUTORENEW_STORAGE_PER_YEAR +
                Tons.AUTORENEW_TX_PER_ITER * BigInt(domainAddresses.length) +
                Tons.AUTORENEW_MARKETPLACE_FEE);
        return Marketplace.getDeployDealMessageInfo(
            Marketplace.DeployOpCodes.TON_MULTIPLE_SALE,
            TonMultipleSale.TONS_DEPLOY +
            deployFee +
            Marketplace.TONS_DEPLOY_DEAL +
            toNano('0.01') * BigInt(domainAddresses.length) +
            autoRenewExtra,
            TonMultipleSale.deployPayload(domainAddresses, price, validUntil, autoRenewCooldown, autoRenewIterations),
            discountCell,
            queryId,
            marketplaceAddress
        );
    }

    static getDeployJettonMultipleSaleMessageInfo(
        domainAddresses: Address[],
        deployFee: bigint,
        isWeb3: boolean,
        price: bigint,
        validUntil: number,
        autoRenewCooldown: number = ONE_DAY * 365,
        autoRenewIterations: number = 0,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        const autoRenewExtra =
            BigInt(autoRenewIterations) *
            (Marketplace.AUTORENEW_STORAGE_PER_YEAR +
                Tons.AUTORENEW_TX_PER_ITER * BigInt(domainAddresses.length) +
                Tons.AUTORENEW_MARKETPLACE_FEE);
        return Marketplace.getDeployDealMessageInfo(
            Marketplace.DeployOpCodes.JETTON_MULTIPLE_SALE,
            JettonMultipleSale.TONS_DEPLOY +
            deployFee +
            Marketplace.TONS_DEPLOY_DEAL +
            toNano('0.01') * BigInt(domainAddresses.length) +
            autoRenewExtra,
            JettonMultipleSale.deployPayload(isWeb3, domainAddresses, price, validUntil, autoRenewCooldown, autoRenewIterations),
            discountCell,
            queryId,
            marketplaceAddress
        );
    }

    static getDeployTonMultipleAuctionMessageInfo(
        domainAddresses: Address[],
        deployFee: bigint,
        startTime: number,
        endTime: number,
        minBidValue: bigint,
        maxBidValue: bigint,
        minBidIncrement: number,
        timeIncrement: number,
        isDeffered: boolean = false,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        return Marketplace.getDeployDealMessageInfo(
            Marketplace.DeployOpCodes.TON_MULTIPLE_AUCTION,
            TonSimpleAuction.TONS_DEPLOY + deployFee + Marketplace.TONS_DEPLOY_DEAL + toNano('0.01') * BigInt(domainAddresses.length),
            TonMultipleAuction.deployPayload(
                domainAddresses,
                startTime,
                endTime,
                minBidValue,
                maxBidValue,
                minBidIncrement,
                timeIncrement,
                isDeffered
            ),
            discountCell,
            queryId,
            marketplaceAddress
        );
    }

    static getDeployJettonMultipleAuctionMessageInfo(
        domainAddresses: Address[],
        deployFee: bigint,
        isWeb3: boolean,
        startTime: number,
        endTime: number,
        minBidValue: bigint,
        maxBidValue: bigint,
        minBidIncrement: number,
        timeIncrement: number,
        isDeffered: boolean = false,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        return Marketplace.getDeployDealMessageInfo(
            Marketplace.DeployOpCodes.JETTON_MULTIPLE_AUCTION,
            TonSimpleAuction.TONS_DEPLOY + deployFee + Marketplace.TONS_DEPLOY_DEAL + toNano('0.01') * BigInt(domainAddresses.length),
            JettonMultipleAuction.deployPayload(
                isWeb3,
                domainAddresses,
                startTime,
                endTime,
                minBidValue,
                maxBidValue,
                minBidIncrement,
                timeIncrement,
                isDeffered
            ),
            discountCell,
            queryId,
            marketplaceAddress
        );
    }

    static getDeployTonSimpleOfferMessageInfo(
        sellerAddress: Address,
        domainName: string,
        deployFee: bigint,
        price: bigint,
        commission: bigint,
        validUntil: number,
        discountCell?: Maybe<Cell>,
        notifySeller: boolean = true,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        return Marketplace.getDeployDealMessageInfo(
            Marketplace.DeployOpCodes.TON_SIMPLE_OFFER,
            TonSimpleOffer.TONS_DEPLOY +
            deployFee +
            Marketplace.TONS_DEPLOY_OFFER +
            price +
            commission +
            TonSimpleOffer.TONS_OFFER_NOTIFICATION * (notifySeller ? 1n : 0n),
            TonSimpleOffer.deployPayload(price, validUntil, sellerAddress, domainName, notifySeller),
            discountCell,
            queryId,
            marketplaceAddress
        );
    }

    static getDeployMultipleOfferMessageInfo(
        merkleRoot: bigint,
        deployFee: bigint,
        discountCell?: Maybe<Cell>,
        additionalTon: bigint = 0n,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        return Marketplace.getDeployDealMessageInfo(
            Marketplace.DeployOpCodes.MULTIPLE_OFFER,
            MultipleOffer.TONS_DEPLOY + deployFee + additionalTon,
            MultipleOffer.deployPayload(merkleRoot),
            discountCell,
            queryId,
            marketplaceAddress
        );
    }

    static async getDeployWithNftTransferMessageInfo(
        userAddress: Address,
        domainAddress: Address,
        domainName: string,
        opCode: number,
        requiredTon: bigint,
        deployPayload: Cell,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        options: { marketplaceAddress?: Address; tonClient?: TonClient4 } = {}
    ): Promise<MessageInfo> {
        const domainZone = domainName.slice(domainName.indexOf('.'));
        const isTgUsername = domainZone === '.t.me';
        return await DomainContract.getTransferMessageInfo(
            domainAddress,
            options.marketplaceAddress ?? Addresses.MARKETPLACE,
            userAddress,
            beginCell()
                .storeUint(opCode, 32)
                .storeStringRefTail(domainName)
                .storeMaybeRef(discountCell)
                .storeSlice(deployPayload.beginParse())
                .endCell(),
            requiredTon,
            queryId,
            isTgUsername,
            options.tonClient
        );
    }

    static async getDeployTonSimpleSaleMessageInfo(
        userAddress: Address,
        domainAddress: Address,
        domainName: string,
        deployFee: bigint,
        price: bigint,
        validUntil: number,
        autoRenewCooldown: number = ONE_DAY * 365,
        autoRenewIterations: number = 0,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE,
        tonClient?: TonClient4
    ): Promise<MessageInfo> {
        const autoRenewExtra =
            BigInt(autoRenewIterations) *
            (Marketplace.AUTORENEW_STORAGE_PER_YEAR + Tons.AUTORENEW_TX_PER_ITER + Tons.AUTORENEW_MARKETPLACE_FEE);
        return await Marketplace.getDeployWithNftTransferMessageInfo(
            userAddress,
            domainAddress,
            domainName,
            Marketplace.DeployOpCodes.TON_SIMPLE_SALE,
            TonSimpleSale.TONS_DEPLOY + deployFee + Marketplace.TONS_DEPLOY_DEAL + autoRenewExtra,
            TonSimpleSale.deployPayload(price, validUntil, autoRenewCooldown, autoRenewIterations),
            discountCell,
            queryId,
            { marketplaceAddress, tonClient }
        );
    }

    static async getDeployJettonSimpleSaleMessageInfo(
        userAddress: Address,
        domainAddress: Address,
        domainName: string,
        deployFee: bigint,
        isWeb3: boolean,
        price: bigint,
        validUntil: number,
        autoRenewCooldown: number = ONE_DAY * 365,
        autoRenewIterations: number = 0,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE,
        tonClient?: TonClient4
    ): Promise<MessageInfo> {
        const autoRenewExtra =
            BigInt(autoRenewIterations) *
            (Marketplace.AUTORENEW_STORAGE_PER_YEAR + Tons.AUTORENEW_TX_PER_ITER + Tons.AUTORENEW_MARKETPLACE_FEE);
        return await Marketplace.getDeployWithNftTransferMessageInfo(
            userAddress,
            domainAddress,
            domainName,
            Marketplace.DeployOpCodes.JETTON_SIMPLE_SALE,
            JettonSimpleSale.TONS_DEPLOY + deployFee + Marketplace.TONS_DEPLOY_DEAL + autoRenewExtra,
            JettonSimpleSale.deployPayload(isWeb3, price, validUntil, autoRenewCooldown, autoRenewIterations),
            discountCell,
            queryId,
            { marketplaceAddress, tonClient }
        );
    }

    static async getDeployTonSimpleAuctionMessageInfo(
        userAddress: Address,
        domainAddress: Address,
        domainName: string,
        deployFee: bigint,
        startTime: number,
        endTime: number,
        minBidValue: bigint,
        maxBidValue: bigint,
        minBidIncrement: number,
        timeIncrement: number,
        isDeffered: boolean = false,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE,
        tonClient?: TonClient4
    ): Promise<MessageInfo> {
        return await Marketplace.getDeployWithNftTransferMessageInfo(
            userAddress,
            domainAddress,
            domainName,
            Marketplace.DeployOpCodes.TON_SIMPLE_AUCTION,
            TonSimpleAuction.TONS_DEPLOY + deployFee + Marketplace.TONS_DEPLOY_DEAL,
            TonSimpleAuction.deployPayload(startTime, endTime, minBidValue, maxBidValue, minBidIncrement, timeIncrement, isDeffered),
            discountCell,
            queryId,
            { marketplaceAddress, tonClient }
        );
    }

    static async getDeployJettonSimpleAuctionMessageInfo(
        userAddress: Address,
        domainAddress: Address,
        domainName: string,
        deployFee: bigint,
        isWeb3: boolean,
        startTime: number,
        endTime: number,
        minBidValue: bigint,
        maxBidValue: bigint,
        minBidIncrement: number,
        timeIncrement: number,
        isDeffered: boolean = false,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE,
        tonClient?: TonClient4
    ): Promise<MessageInfo> {
        return await Marketplace.getDeployWithNftTransferMessageInfo(
            userAddress,
            domainAddress,
            domainName,
            Marketplace.DeployOpCodes.JETTON_SIMPLE_AUCTION,
            JettonSimpleAuction.TONS_DEPLOY + deployFee + Marketplace.TONS_DEPLOY_DEAL,
            JettonSimpleAuction.deployPayload(
                isWeb3,
                startTime,
                endTime,
                minBidValue,
                maxBidValue,
                minBidIncrement,
                timeIncrement,
                isDeffered
            ),
            discountCell,
            queryId,
            { marketplaceAddress, tonClient }
        );
    }

    static getDeployWithJettonTransferMessageInfo(
        userAddress: Address,
        jettonWalletAddress: Address,
        opCode: number,
        jettonAmount: bigint,
        requiredTon: bigint,
        deployPayload: Cell,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        return JettonWallet.getTransferMessageInfo(
            jettonWalletAddress,
            jettonAmount,
            marketplaceAddress,
            userAddress,
            requiredTon,
            beginCell().storeUint(opCode, 32).storeMaybeRef(discountCell).storeSlice(deployPayload.beginParse()).endCell(),
            queryId
        );
    }

    static getDeployJettonSimpleOfferMessageInfo(
        userAddress: Address,
        jettonWalletAddress: Address,
        domainName: string,
        deployFee: bigint,
        sellerAddress: Address,
        price: bigint,
        commission: bigint,
        validUntil: number,
        notifySeller: boolean,
        discountCell?: Maybe<Cell>,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        return Marketplace.getDeployWithJettonTransferMessageInfo(
            userAddress,
            jettonWalletAddress,
            Marketplace.DeployOpCodes.JETTON_SIMPLE_OFFER,
            price + commission,
            JettonSimpleOffer.TONS_DEPLOY +
            deployFee +
            Marketplace.TONS_DEPLOY_OFFER +
            JettonSimpleOffer.TONS_OFFER_NOTIFICATION * (notifySeller ? 1n : 0n),
            JettonSimpleOffer.deployPayload(validUntil, sellerAddress, domainName, notifySeller),
            discountCell,
            queryId,
            marketplaceAddress
        );
    }

    static makeHotTransferPayload(saleAddress: Address, period: number) {
        return beginCell().storeUint(OpCodes.MAKE_HOT, 32).storeAddress(saleAddress).storeUint(period, 32).endCell();
    }

    static getMakeHotMessageInfo(
        userAddress: Address,
        web3WalletAddress: Address,
        price: bigint,
        saleAddress: Address,
        period: number,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ) {
        return JettonWallet.getTransferMessageInfo(
            web3WalletAddress,
            price,
            marketplaceAddress,
            userAddress,
            Tons.JETTON_TRANSFER,
            Marketplace.makeHotTransferPayload(saleAddress, period),
            queryId
        );
    }

    static makeColoredTransferPayload(saleAddress: Address, period: number) {
        return beginCell().storeUint(OpCodes.MAKE_COLORED, 32).storeAddress(saleAddress).storeUint(period, 32).endCell();
    }

    static getMakeColoredMessageInfo(
        userAddress: Address,
        web3WalletAddress: Address,
        price: bigint,
        saleAddress: Address,
        period: number,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ) {
        return JettonWallet.getTransferMessageInfo(
            web3WalletAddress,
            price,
            marketplaceAddress,
            userAddress,
            Tons.JETTON_TRANSFER,
            Marketplace.makeColoredTransferPayload(saleAddress, period),
            queryId
        );
    }

    static moveUpSaleTransferPayload(saleAddress: Address) {
        return beginCell().storeUint(OpCodes.MOVE_UP_SALE, 32).storeAddress(saleAddress).endCell();
    }

    static getMoveUpSaleMessageInfo(
        userAddress: Address,
        web3WalletAddress: Address,
        price: bigint,
        saleAddress: Address,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ) {
        return JettonWallet.getTransferMessageInfo(
            web3WalletAddress,
            price,
            marketplaceAddress,
            userAddress,
            Tons.JETTON_TRANSFER,
            Marketplace.moveUpSaleTransferPayload(saleAddress),
            queryId
        );
    }

    static buySubscriptionMessage(subscriptionLevel: number, subscriptionPeriod: number, queryId: number = 0) {
        return beginCell()
            .storeUint(OpCodes.BUY_SUBSCRIPTION, 32)
            .storeUint(queryId, 64)
            .storeUint(subscriptionLevel, 8)
            .storeUint(subscriptionPeriod, 32)
            .endCell();
    }

    static getBuySubscriptionMessageInfo(
        subscriptionLevel: number,
        subscriptionPeriod: number,
        subscriptionPrice: bigint,
        queryId: number = 0,
        marketplaceAddress: Address = Addresses.MARKETPLACE
    ): MessageInfo {
        return new MessageInfo(
            marketplaceAddress,
            subscriptionPrice + Marketplace.TONS_BUY_SUBSCRIPTION,
            Marketplace.buySubscriptionMessage(subscriptionLevel, subscriptionPeriod, queryId)
        );
    }

    async getStorageData(provider: ContractProvider): Promise<MarketplaceConfig> {
        const { stack } = await provider.get('get_storage_data', []);
        return {
            ownerAddress: stack.readAddress(),
            publicKey: stack.readBigNumber(),
            deployInfos: stack.readCell().beginParse().loadDictDirect(Dictionary.Keys.Uint(32), deployInfoValueParser()),

            userSubscriptions: beginCell()
                .storeMaybeRef(stack.readCellOpt())
                .asSlice()
                .loadDict(Dictionary.Keys.Address(), userSubscriptionValueParser()),
            subscriptionsInfo: beginCell()
                .storeMaybeRef(stack.readCellOpt())
                .asSlice()
                .loadDict(Dictionary.Keys.Uint(8), subscriptionInfoValueParser()),

            moveUpSalePrice: stack.readBigNumber(),
            currentTopSale: stack.readAddress(),

            web3WalletAddress: stack.readAddress(),

            collectedFeesTon: stack.readBigNumber(),
            collectedFeesDict: stack.readCellOpt()?.beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.BigVarUint(4)),

            promotionPrices: stack.readCell().beginParse().loadDictDirect(Dictionary.Keys.Uint(32), promotionPricesValueParser())
        };
    }
}
