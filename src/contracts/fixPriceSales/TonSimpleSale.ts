import type { Address, ContractProvider} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';
import { MessageInfo } from '../imports/DefaultContract';
import type { Maybe } from '../imports/maybe';
import { COMMISSION_DIVIDER, ONE_DAY, Tons } from '../imports/constants';
import { VaultJetton } from '../imports/dedust';

import { FixPriceSale } from './FixPriceSale';
import { BidaskPool } from '../imports/BidaskPool';

export type TonSimpleSaleConfig = {
    domainAddress: Address;
    sellerAddress: Address;
    price: bigint;
    state: number;
    commission: bigint;
    createdAt: number;
    lastRenewalTime: number;
    validUntil?: number;
    buyerAddress: Maybe<Address>;
    domainName: string;
    isTgUsername?: boolean;
    hotUntil?: number;
    coloredUntil?: number;
    autoRenewCooldown?: number;
    autoRenewIterations?: number;
};

export class TonSimpleSale extends FixPriceSale {
    static TONS_PURCHASE = Tons.PURCHASE_NOTIFICATION + Tons.NFT_TRANSFER + toNano('0.07'); // 0.065
    static TONS_DEPLOY = toNano('0.05');

    static async purchaseWithSwapMessageInfo(
        fromAsset: 'WEB3' | 'USDT',
        userAddress: Address,
        saleAddress: Address,
        jettonWalletAddress: Address,
        swapAmount: bigint,
        price: bigint,
        queryId: number = 0,
        bidaskAllowed: boolean = false
    ) {
        if (fromAsset === 'USDT' && bidaskAllowed) {
            return await BidaskPool.getSwapMessageInfo(
                fromAsset,
                'TON',
                userAddress,
                saleAddress,
                TonSimpleSale.TONS_PURCHASE + toNano('0.046'),
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
            TonSimpleSale.TONS_PURCHASE + toNano('0.046'),
            price,
            queryId
        );
    }

    static createFromAddress(address: Address) {
        return new TonSimpleSale(address);
    }

    static getPurchaseMessageInfo(saleAddress: Address, price: bigint): MessageInfo {
        return new MessageInfo(
            saleAddress,
            price + TonSimpleSale.TONS_PURCHASE + toNano('0.046'),
            beginCell().storeUint(0, 32).storeStringTail('Purchase via webdom.market').endCell()
        );
    }

    static deployPayload(price: bigint, validUntil: number, autoRenewCooldown: number = ONE_DAY * 365, autoRenewIterations: number = 0) {
        let payload = beginCell().storeCoins(price).storeUint(validUntil, 32);
        if (autoRenewIterations > 0 || autoRenewCooldown !== ONE_DAY * 365) {
            payload = payload.storeUint(autoRenewCooldown, 32).storeUint(autoRenewIterations, 8);
        }
        return payload.endCell();
    }

    async getStorageData(
        provider: ContractProvider,
        isWebdom: boolean = true,
        prevConfig: TonSimpleSaleConfig | null = null
    ): Promise<TonSimpleSaleConfig> {
        if (isWebdom) {
            const { stack } = await provider.get('get_storage_data', []);
            const sellerAddress = stack.readAddress();
            const domainsDict = stack.readCell().beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.Uint(1));
            stack.skip(2);
            const state = stack.readNumber();
            const price = stack.readBigNumber();
            const commission = (stack.readBigNumber() * price) / BigInt(COMMISSION_DIVIDER);
            const createdAt = stack.readNumber();
            const lastRenewalTime = stack.readNumber();
            const validUntil = stack.readNumber();
            const buyerAddress = stack.readAddressOpt();
            const domainName = stack.readCell().beginParse().loadStringTail();
            const hasAutoRenewFields = stack.remaining >= 7;
            const res = {
                domainAddress: domainsDict.keys()[0]!,
                sellerAddress,
                state,
                price,
                commission,
                createdAt,
                lastRenewalTime,
                validUntil,
                buyerAddress,
                domainName,
                isTgUsername: hasAutoRenewFields ? stack.readBoolean() : false,
                hotUntil: stack.readNumber(),
                coloredUntil: stack.readNumber(),
                autoRenewCooldown: hasAutoRenewFields ? stack.readNumber() : 0,
                autoRenewIterations: hasAutoRenewFields ? stack.readNumber() : 0
            };
            return res;
        } else {
            const { stack } = await provider.get('get_sale_data', []);
            stack.skip(1);
            const state = stack.readBoolean() ? FixPriceSale.STATE_COMPLETED : FixPriceSale.STATE_ACTIVE;
            const createdAt = stack.readNumber();
            return {
                state,
                createdAt,
                domainAddress: [stack.readAddress(), stack.readAddress()][1]!,
                domainName: prevConfig!.domainName,
                sellerAddress: stack.readAddress(),
                price: stack.readBigNumber(),
                commission: [stack.readAddress(), stack.readBigNumber()][1] as bigint,
                lastRenewalTime: prevConfig?.lastRenewalTime ?? createdAt,
                validUntil: prevConfig?.validUntil,
                buyerAddress: prevConfig?.buyerAddress
            };
        }
    }
}
