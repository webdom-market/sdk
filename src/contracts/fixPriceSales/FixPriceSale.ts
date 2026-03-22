import type { Address, ContractProvider} from '@ton/core';
import { beginCell, toNano } from '@ton/core';

import { DefaultContract, MessageInfo } from '../imports/DefaultContract';
import { OpCodes, Tons } from '../imports/constants';

export abstract class FixPriceSale extends DefaultContract {
    static STATE_UNINIT = 0;
    static STATE_ACTIVE = 1;
    static STATE_COMPLETED = 2;
    static STATE_CANCELLED = 3;
    static AUTORENEW_STORAGE_PER_YEAR = toNano('0.035');

    static changePriceMessage(newPrice: bigint, newValidUntil: number, queryId: number = 0) {
        return beginCell()
            .storeUint(OpCodes.CHANGE_PRICE, 32)
            .storeUint(queryId, 64)
            .storeCoins(newPrice)
            .storeUint(newValidUntil, 32)
            .endCell();
    }

    static getChangePriceMessageInfo(saleAddress: Address, newPrice: bigint, newValidUntil: number, queryId: number = 0): MessageInfo {
        return new MessageInfo(saleAddress, toNano('0.05'), FixPriceSale.changePriceMessage(newPrice, newValidUntil, queryId), null);
    }

    async sendExternalCancel(provider: ContractProvider, queryId?: number) {
        await provider.external(
            beginCell()
                .storeUint(OpCodes.CANCEL_DEAL, 32)
                .storeUint(queryId ?? Date.now(), 64)
                .endCell()
        );
    }

    static renewDomainMessage(queryId: number = 0, newValidUntil?: number, isOldContract: boolean = false) {
        const tmp = beginCell().storeUint(OpCodes.RENEW_DOMAIN, 32).storeUint(queryId, 64);
        if (!isOldContract) {
            tmp.storeBit(Boolean(newValidUntil));
        }
        if (newValidUntil) {
            tmp.storeUint(newValidUntil, 32);
        }
        return tmp.endCell();
    }

    static getRenewDomainMessageInfo(
        saleAddress: Address,
        domainsNumber: number,
        queryId: number = 0,
        idOldContract: boolean = false
    ): MessageInfo {
        return new MessageInfo(
            saleAddress,
            Tons.RENEW_REQUEST + Tons.RENEW_DOMAIN * BigInt(domainsNumber) + toNano('0.004'),
            FixPriceSale.renewDomainMessage(queryId, undefined, idOldContract)
        );
    }

    static setAutoRenewParamsMessage(
        autoRenewCooldown: number,
        autoRenewIterations: number,
        queryId: number = 0,
        newValidUntil: number = 0
    ) {
        const msg = beginCell()
            .storeUint(OpCodes.SET_AUTORENEW_PARAMS, 32)
            .storeUint(queryId, 64)
            .storeUint(autoRenewCooldown, 32)
            .storeUint(autoRenewIterations, 8);
        if (newValidUntil > 0) {
            msg.storeBit(1).storeUint(newValidUntil, 32);
        } else {
            msg.storeBit(0);
        }
        return msg.endCell();
    }

    static getSetAutoRenewParamsMessageInfo(
        saleAddress: Address,
        domainsNumber: number,
        autoRenewCooldown: number,
        autoRenewIterations: number,
        currentAutoRenewIterations: number = 0,
        queryId: number = 0,
        newValidUntil: number = 0
    ): MessageInfo {
        const addIterations = Math.max(autoRenewIterations - currentAutoRenewIterations, 0);
        const topupPerIteration =
            FixPriceSale.AUTORENEW_STORAGE_PER_YEAR + Tons.AUTORENEW_TX_PER_ITER * BigInt(domainsNumber) + Tons.AUTORENEW_MARKETPLACE_FEE;

        const value = Tons.MIN_EXCESS + Tons.AUTORENEW_TOPUP_GAS_BUFFER + BigInt(addIterations) * topupPerIteration + toNano('0.004');

        return new MessageInfo(
            saleAddress,
            value,
            FixPriceSale.setAutoRenewParamsMessage(autoRenewCooldown, autoRenewIterations, queryId, newValidUntil)
        );
    }

    static triggerAutoRenewMessage(queryId: number = 0) {
        return beginCell().storeUint(OpCodes.TRIGGER_AUTORENEW, 32).storeUint(queryId, 64).endCell();
    }
}
