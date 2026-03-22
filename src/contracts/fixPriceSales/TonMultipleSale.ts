import type { Address, ContractProvider} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';

import { DomainContract } from '../Domain';
import { DefaultContract, MessageInfo } from '../imports/DefaultContract';
import { COMMISSION_DIVIDER, ONE_DAY, Tons } from '../imports/constants';
import { VaultJetton } from '../imports/dedust';
import { TonSimpleSale } from './TonSimpleSale';

import { FixPriceSale } from './FixPriceSale';
import { BidaskPool } from '../imports/BidaskPool';

export type TonMultipleSaleConfig = {
    sellerAddress: Address;
    domainsDict: Dictionary<Address, number>;
    domainsTotal: number;
    domainsReceived: number;
    price: bigint;
    state: number;
    commission: bigint;
    createdAt: number;
    lastRenewalTime: number;
    validUntil: number;
    buyerAddress: Address | null;
    tonsToReserve: bigint;
    hotUntil?: number;
    coloredUntil?: number;
    autoRenewCooldown?: number;
    autoRenewIterations?: number;
};

export class TonMultipleSale extends FixPriceSale {
    static TONS_DEPLOY = toNano('0.06');

    static createFromAddress(address: Address) {
        return new TonMultipleSale(address);
    }

    static deployPayload(
        domainAddresses: Address[],
        price: bigint,
        validUntil: number,
        autoRenewCooldown: number = ONE_DAY * 365,
        autoRenewIterations: number = 0
    ) {
        const domainsDict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool());
        for (const domainAddress of domainAddresses) {
            domainsDict.set(domainAddress, false);
        }
        let payload = beginCell().storeDict(domainsDict).storeCoins(price).storeUint(validUntil, 32);
        if (autoRenewIterations > 0 || autoRenewCooldown !== ONE_DAY * 365) {
            payload = payload.storeUint(autoRenewCooldown, 32).storeUint(autoRenewIterations, 8);
        }
        return payload.endCell();
    }

    static async getTransferDomainMessageInfo(
        userAddress: Address,
        domainAddress: Address,
        saleAddress: Address,
        queryId: number = 0,
        isTgUsername: boolean = false
    ): Promise<MessageInfo> {
        return await DomainContract.getTransferMessageInfo(
            domainAddress,
            saleAddress,
            userAddress,
            beginCell().storeUint(0, 32).storeStringTail('Multiple sale on webdom.market').endCell(),
            Tons.NFT_TRANSFER + 23000000n,
            queryId,
            isTgUsername
        );
    }

    static getPurchaseMessageInfo(saleAddress: Address, price: bigint, domainsNumber: number | bigint): MessageInfo {
        return new MessageInfo(saleAddress, price + TonSimpleSale.TONS_PURCHASE * BigInt(domainsNumber));
    }

    static async purchaseWithSwapMessageInfo(
        fromAsset: 'WEB3' | 'USDT',
        userAddress: Address,
        saleAddress: Address,
        jettonWalletAddress: Address,
        swapAmount: bigint,
        price: bigint,
        domainsNumber: number | bigint,
        queryId: number = 0,
        bidaskAllowed: boolean = false
    ) {
        if (fromAsset === 'USDT' && bidaskAllowed) {
            return await BidaskPool.getSwapMessageInfo(
                fromAsset,
                'TON',
                userAddress,
                saleAddress,
                TonSimpleSale.TONS_PURCHASE * BigInt(domainsNumber),
                price,
                jettonWalletAddress,
                queryId
            );
        }
        return VaultJetton.getSwapMessageInfo(
            fromAsset,
            'TON',
            userAddress,
            saleAddress,
            jettonWalletAddress,
            swapAmount,
            TonSimpleSale.TONS_PURCHASE * BigInt(domainsNumber),
            price,
            queryId
        );
    }

    static getCancelDealMessageInfo(saleAddress: Address, domainsNumber: number | bigint | boolean): MessageInfo {
        return new MessageInfo(
            saleAddress,
            toNano('0.02') + toNano('0.02') * BigInt(domainsNumber),
            DefaultContract.cancelDealMessage(),
            null
        );
    }
    async getStorageData(provider: ContractProvider, _isWebdom: boolean = true): Promise<TonMultipleSaleConfig> {
        const { stack } = await provider.get('get_storage_data', []);
        const sellerAddress = stack.readAddress();
        const domainsDict = stack.readCell().beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.Uint(1));
        const domainsTotal = stack.readNumber();
        const domainsReceived = stack.readNumber();
        const state = stack.readNumber();
        const price = stack.readBigNumber();
        const commission = (stack.readBigNumber() * price) / BigInt(COMMISSION_DIVIDER);
        const createdAt = stack.readNumber();
        const lastRenewalTime = stack.readNumber();
        const validUntil = stack.readNumber();
        const buyerAddress = stack.readAddressOpt();
        const tonsToReserve = stack.readBigNumber();
        const hotUntil = stack.readNumber();
        const coloredUntil = stack.readNumber();
        const hasAutoRenewFields = stack.remaining >= 4;
        return {
            sellerAddress,
            domainsDict,
            domainsTotal,
            domainsReceived,
            state,
            price,
            commission,
            createdAt,
            lastRenewalTime,
            validUntil,
            buyerAddress,
            tonsToReserve,
            hotUntil,
            coloredUntil,
            autoRenewCooldown: hasAutoRenewFields ? stack.readNumber() : 0,
            autoRenewIterations: hasAutoRenewFields ? stack.readNumber() : 0
        };
    }
}
