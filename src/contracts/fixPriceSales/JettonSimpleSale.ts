import type { ContractProvider} from '@ton/core';
import { Address, Dictionary, beginCell, toNano } from '@ton/core';
import { JettonWallet } from '../JettonWallet';
import { MessageInfo } from '../imports/DefaultContract';
import type { Maybe } from '../imports/maybe';
import { COMMISSION_DIVIDER, ONE_DAY, Tons } from '../imports/constants';
import { VaultJetton, VaultNative } from '../imports/dedust';
import { FixPriceSale } from './FixPriceSale';

import { TonSimpleSale } from './TonSimpleSale';
import { BidaskPool } from '../imports/BidaskPool';

export type JettonSimpleSaleConfig = {
    domainAddress: Address;
    sellerAddress: Address;
    jettonWalletAddress?: Maybe<Address>;
    price: bigint;
    state: number;

    jettonMinterAddress?: Address;
    commission: bigint;
    createdAt: number;
    lastRenewalTime: number;
    validUntil?: number;
    buyerAddress?: Maybe<Address>;
    domainName?: string;
    isTgUsername?: boolean;
    hotUntil?: number;
    coloredUntil?: number;
    autoRenewCooldown?: number;
    autoRenewIterations?: number;
};

export class JettonSimpleSale extends FixPriceSale {
    static TONS_PURCHASE = TonSimpleSale.TONS_PURCHASE + Tons.JETTON_TRANSFER * 3n + Tons.NOTIFY_MARKETPLACE; // 0.215
    static TONS_DEPLOY = TonSimpleSale.TONS_DEPLOY + toNano('0.01'); // 0.035

    static createFromAddress(address: Address) {
        return new JettonSimpleSale(address);
    }

    static deployPayload(
        isWeb3: boolean,
        price: bigint,
        validUntil: number,
        autoRenewCooldown: number = ONE_DAY * 365,
        autoRenewIterations: number = 0
    ) {
        let payload = beginCell().storeBit(isWeb3).storeCoins(price).storeUint(validUntil, 32);
        if (autoRenewIterations > 0 || autoRenewCooldown !== ONE_DAY * 365) {
            payload = payload.storeUint(autoRenewCooldown, 32).storeUint(autoRenewIterations, 8);
        }
        return payload.endCell();
    }

    static getPurchaseMessageInfo(
        userAddress: Address,
        saleAddress: Address,
        jettonWalletAddress: Address,
        price: bigint,
        queryId: number = 0
    ): MessageInfo {
        const requiredValue = JettonSimpleSale.TONS_PURCHASE + Tons.JETTON_TRANSFER;
        const payload = beginCell().storeUint(0, 32).storeStringTail('Purchase via webdom.market').endCell();
        return new MessageInfo(
            jettonWalletAddress,
            requiredValue,
            JettonWallet.transferMessage(price, saleAddress, userAddress, requiredValue - Tons.JETTON_TRANSFER, payload, queryId)
        );
    }

    static async purchaseWithSwapMessageInfo(
        fromAsset: 'TON' | 'WEB3' | 'USDT',
        toAsset: 'WEB3' | 'USDT',
        userAddress: Address,
        saleAddress: Address,
        swapAmount: bigint,
        price: bigint,
        jettonWalletAddress?: Address,
        queryId: number = 0
    ) {
        if (fromAsset === 'TON') {
            if (toAsset === 'USDT') {
                return await BidaskPool.getSwapMessageInfo(
                    fromAsset,
                    toAsset,
                    userAddress,
                    saleAddress,
                    JettonSimpleSale.TONS_PURCHASE,
                    price,
                    undefined,
                    queryId
                );
            }
            return VaultNative.getSwapMessageInfo(
                toAsset,
                userAddress,
                saleAddress,
                swapAmount,
                price,
                JettonSimpleSale.TONS_PURCHASE,
                queryId
            );
        } else {
            return VaultJetton.getSwapMessageInfo(
                fromAsset,
                toAsset,
                userAddress,
                saleAddress,
                jettonWalletAddress!,
                swapAmount,
                JettonSimpleSale.TONS_PURCHASE,
                price,
                queryId
            );
        }
    }

    async getStorageData(
        provider: ContractProvider,
        isWebdom: boolean = true,
        prevConfig: JettonSimpleSaleConfig | null = null
    ): Promise<JettonSimpleSaleConfig> {
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
            const hasAutoRenewFields = stack.remaining >= 8;
            return {
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
                jettonWalletAddress: stack.readAddressOpt(),
                hotUntil: stack.readNumber(),
                coloredUntil: stack.readNumber(),
                autoRenewCooldown: hasAutoRenewFields ? stack.readNumber() : 0,
                autoRenewIterations: hasAutoRenewFields ? stack.readNumber() : 0,
                jettonMinterAddress: stack.readAddress()
            };
        } else {
            const { stack } = await provider.get('get_fix_price_data_v4', []);
            const isCompleted = stack.readBoolean();
            const createdAt = stack.readNumber();
            const domainAddress = [stack.readAddress(), stack.readAddress()][1]!;
            const sellerAddress = stack.readAddress();
            stack.skip(2);
            const commissionRate = stack.readBigNumber();
            stack.skip(2);
            const soldAt = stack.readNumber();
            const state = isCompleted
                ? soldAt > 0
                    ? JettonSimpleSale.STATE_COMPLETED
                    : JettonSimpleSale.STATE_CANCELLED
                : JettonSimpleSale.STATE_ACTIVE;
            stack.skip(1);
            const priceDict = stack.readCell().beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigVarUint(4));
            const priceKey = priceDict.keys()[0]!;
            const price = priceDict.get(priceKey) ?? prevConfig?.price ?? 0n;
            const commission = (price * commissionRate) / BigInt(COMMISSION_DIVIDER * 10);
            const jettonWalletAddress = new Address(0, Buffer.from(priceKey.toString(16), 'hex'));
            return {
                createdAt,
                domainAddress,
                domainName: prevConfig?.domainName,
                sellerAddress,
                state,
                price,
                commission,
                jettonWalletAddress,
                jettonMinterAddress: prevConfig?.jettonMinterAddress,
                buyerAddress: prevConfig?.buyerAddress,
                validUntil: prevConfig?.validUntil,
                lastRenewalTime: prevConfig?.lastRenewalTime ?? createdAt
            };
        }
    }
}
