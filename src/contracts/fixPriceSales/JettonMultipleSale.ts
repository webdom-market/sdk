import type { Address, ContractProvider, DictionaryValue} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';

import { DomainContract } from '../Domain';
import { JettonWallet } from '../JettonWallet';
import { MessageInfo } from '../imports/DefaultContract';
import { COMMISSION_DIVIDER, ONE_DAY, Tons } from '../imports/constants';
import { VaultJetton, VaultNative } from '../imports/dedust';

import { FixPriceSale } from './FixPriceSale';
import { TonSimpleSale } from './TonSimpleSale';
import { BidaskPool } from '../imports/BidaskPool';

export function domainInListValueParser(): DictionaryValue<{ isTg: boolean; domain: string }> {
    return {
        serialize: (src, buidler) => {
            buidler.storeBit(src.isTg).storeStringTail(src.domain).endCell();
        },
        parse: (src) => {
            const isTg = src.loadBit();
            const domain = src.loadStringTail();
            return { isTg, domain };
        }
    };
}

export type JettonMultipleSaleConfig = {
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
    hotUntil?: number;
    coloredUntil?: number;
    autoRenewCooldown?: number;
    autoRenewIterations?: number;

    jettonMinterAddress: Address;
    jettonWalletAddress: Address;
};

export class JettonMultipleSale extends FixPriceSale {
    static TONS_DEPLOY = toNano('0.06');
    static TONS_ONE_DOMAIN_PURCHASE = TonSimpleSale.TONS_PURCHASE;
    static TONS_PURCHASE = Tons.JETTON_TRANSFER * 3n + Tons.NOTIFY_MARKETPLACE + toNano('0.005'); // 0.16 TON;

    static createFromAddress(address: Address) {
        return new JettonMultipleSale(address);
    }

    static deployPayload(
        isWeb3: boolean,
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
        let payload = beginCell().storeBit(isWeb3).storeDict(domainsDict).storeCoins(price).storeUint(validUntil, 32);
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

    static getPurchaseMessageInfo(
        userAddress: Address,
        saleAddress: Address,
        jettonWalletAddress: Address,
        domainsNumber: number,
        price: bigint,
        queryId: number = 0
    ): MessageInfo {
        const requiredValue = JettonMultipleSale.TONS_PURCHASE + JettonMultipleSale.TONS_ONE_DOMAIN_PURCHASE * BigInt(domainsNumber);
        return new MessageInfo(
            jettonWalletAddress,
            requiredValue + Tons.JETTON_TRANSFER,
            JettonWallet.transferMessage(price, saleAddress, userAddress, requiredValue, null, queryId)
        );
    }

    static async purchaseWithSwapMessageInfo(
        fromAsset: 'TON' | 'WEB3' | 'USDT',
        toAsset: 'WEB3' | 'USDT',
        userAddress: Address,
        saleAddress: Address,
        domainsNumber: number,
        swapAmount: bigint,
        price: bigint,
        jettonWalletAddress?: Address,
        queryId: number = 0
    ) {
        const requiredValue = JettonMultipleSale.TONS_PURCHASE + JettonMultipleSale.TONS_ONE_DOMAIN_PURCHASE * BigInt(domainsNumber);
        if (fromAsset === 'TON') {
            if (toAsset === 'USDT') {
                return await BidaskPool.getSwapMessageInfo(
                    fromAsset,
                    toAsset,
                    userAddress,
                    saleAddress,
                    requiredValue,
                    price,
                    undefined,
                    queryId
                );
            }
            return VaultNative.getSwapMessageInfo(toAsset, userAddress, saleAddress, swapAmount, price, requiredValue, queryId);
        } else {
            return VaultJetton.getSwapMessageInfo(
                fromAsset,
                toAsset,
                userAddress,
                saleAddress,
                jettonWalletAddress!,
                swapAmount,
                requiredValue,
                price,
                queryId
            );
        }
    }

    async getStorageData(provider: ContractProvider, _isWebdom: boolean = true): Promise<JettonMultipleSaleConfig> {
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
        const jettonWalletAddress = stack.readAddress();
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
            jettonWalletAddress,
            hotUntil,
            coloredUntil,
            autoRenewCooldown: hasAutoRenewFields ? stack.readNumber() : 0,
            autoRenewIterations: hasAutoRenewFields ? stack.readNumber() : 0,
            jettonMinterAddress: stack.readAddress()
        };
    }
}
