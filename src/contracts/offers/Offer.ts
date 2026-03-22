import type { Address, ContractProvider} from '@ton/core';
import { beginCell, toNano } from '@ton/core';

import { DomainContract } from '../Domain';
import { DefaultContract, MessageInfo } from '../imports/DefaultContract';
import { OpCodes } from '../imports/constants';

export abstract class Offer extends DefaultContract {
    static STATE_NOT_INITIALIZED = 0;
    static STATE_ACTIVE = 1;
    static STATE_ACCEPTED = 2;
    static STATE_CANCELLED = 3;

    static TONS_DECLINE_REWARD = toNano('0.01');
    static TONS_OFFER_NOTIFICATION = toNano('0.1');
    static TONS_CHANGE_VALID_UNTIL = toNano('0.01');
    static TONS_CHANGE_PRICE = toNano('0.033');
    static TONS_ACCEPT_OFFER = toNano('0.01');
    static TONS_CANCEL_OFFER = toNano('0.01');
    static TONS_COUNTERPROPOSE_PRICE = toNano('0.05');

    static assertPriceIncreaseOrThrow(oldPrice: bigint, newPrice: bigint) {
        if (newPrice < oldPrice) {
            throw new Error('Lowering an offer price is not supported; newPrice must be greater than or equal to oldPrice');
        }
    }

    static async getAcceptOfferMessageInfo(
        domainAddress: Address,
        offerAddress: Address,
        userAddress: Address,
        queryId: number = 0,
        isTgUsername: boolean = false
    ): Promise<MessageInfo> {
        return await DomainContract.getTransferMessageInfo(
            domainAddress,
            offerAddress,
            userAddress,
            null,
            Offer.TONS_ACCEPT_OFFER,
            queryId,
            isTgUsername
        );
    }

    static cancelOfferMessage(cancellationComment?: string, queryId?: number) {
        let body = beginCell()
            .storeUint(OpCodes.CANCEL_DEAL, 32)
            .storeUint(queryId ?? 0, 64);
        if (cancellationComment) {
            body = body.storeStringTail(cancellationComment);
        }
        return body.endCell();
    }

    static counterProposePayload(newPrice: bigint, notifyBuyer: boolean) {
        return beginCell().storeUint(OpCodes.COUNTERPROPOSE, 32).storeCoins(newPrice).storeBit(notifyBuyer).endCell();
    }

    static async getInitialCounterProposeMessageInfo(
        offerAddress: Address,
        domainAddress: Address,
        userAddress: Address,
        newPrice: bigint,
        notifyBuyer: boolean,
        isTgUsername: boolean = false,
        queryId: number = 0
    ): Promise<MessageInfo> {
        return await DomainContract.getTransferMessageInfo(
            domainAddress,
            offerAddress,
            userAddress,
            Offer.counterProposePayload(newPrice, notifyBuyer),
            toNano(notifyBuyer ? '0.12' : '0.015'),
            queryId,
            isTgUsername
        );
    }

    static counterProposeMessage(newPrice: bigint, notifyBuyer: boolean, queryId: number = 0) {
        return beginCell()
            .storeUint(OpCodes.COUNTERPROPOSE, 32)
            .storeUint(queryId, 64)
            .storeCoins(newPrice)
            .storeBit(notifyBuyer)
            .endCell();
    }

    static counterProposeMessageInfo(offerAddress: Address, newPrice: bigint, notifyBuyer: boolean, queryId: number = 0): MessageInfo {
        return new MessageInfo(
            offerAddress,
            Offer.TONS_COUNTERPROPOSE_PRICE + toNano(notifyBuyer ? '0.12' : '0.015'),
            Offer.counterProposeMessage(newPrice, notifyBuyer, queryId)
        );
    }

    static changeValidUntilMessage(newValidUntil: number, queryId: number = 0) {
        return beginCell().storeUint(OpCodes.CHANGE_VALID_UNTIL, 32).storeUint(queryId, 64).storeUint(newValidUntil, 32).endCell();
    }

    static getChangeValidUntilMessageInfo(offerAddress: Address, newValidUntil: number, queryId: number = 0): MessageInfo {
        return new MessageInfo(offerAddress, Offer.TONS_CHANGE_VALID_UNTIL, Offer.changeValidUntilMessage(newValidUntil, queryId));
    }

    async sendExternalCancel(provider: ContractProvider, queryId?: number) {
        await provider.external(
            beginCell()
                .storeUint(OpCodes.CANCEL_DEAL, 32)
                .storeUint(queryId ?? Date.now(), 64)
                .endCell()
        );
    }
}
