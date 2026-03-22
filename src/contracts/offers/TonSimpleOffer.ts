import type { Address, ContractProvider} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';
import { MessageInfo } from '../imports/DefaultContract';
import type { Maybe } from '../imports/maybe';
import { COMMISSION_DIVIDER, OpCodes } from '../imports/constants';

import { Offer } from './Offer';

export type TonSimpleOfferConfig = {
    domainAddress: Address;
    price: bigint;
    state: number;
    commission: bigint;
    createdAt: number;
    validUntil: number;
    buyerAddress: Address;
    sellerAddress: Maybe<Address>;
    domainName: string;
    cancelledBySeller: boolean;
    sellerPrice: bigint;
};

export class TonSimpleOffer extends Offer {
    static TONS_DEPLOY = toNano('0.075');

    static createFromAddress(address: Address) {
        return new TonSimpleOffer(address);
    }

    static deployPayload(price: bigint, validUntil: number, sellerAddress: Address, domainName: string, notifySeller: boolean = true) {
        return beginCell()
            .storeCoins(price)
            .storeUint(validUntil, 32)
            .storeAddress(sellerAddress)
            .storeBit(notifySeller)
            .storeStringRefTail(domainName)
            .endCell();
    }

    static changePriceMessage(queryId: number = 0, newPrice: bigint, newValidUntil: number, notifySeller: boolean) {
        return beginCell()
            .storeUint(OpCodes.CHANGE_PRICE, 32)
            .storeUint(queryId, 64)
            .storeCoins(newPrice)
            .storeUint(newValidUntil, 32)
            .storeBit(notifySeller)
            .endCell();
    }

    static getChangePriceMessageInfo(
        offerAddress: Address,
        oldPrice: bigint,
        commissionRate: number,
        newPrice: bigint,
        newValidUntil: number,
        notifySeller: boolean,
        queryId: number = 0,
        afterCounterproposal: boolean = false
    ): MessageInfo {
        Offer.assertPriceIncreaseOrThrow(oldPrice, newPrice);

        return new MessageInfo(
            offerAddress,
            ((newPrice - oldPrice) * (1000n + BigInt(Math.round(commissionRate * 1000)))) / 1000n +
            Offer.TONS_CHANGE_PRICE +
            Offer.TONS_OFFER_NOTIFICATION * (notifySeller ? 1n : 0n) +
            (afterCounterproposal ? Offer.TONS_COUNTERPROPOSE_PRICE : 0n),
            TonSimpleOffer.changePriceMessage(queryId, newPrice, newValidUntil, notifySeller)
        );
    }

    static getCancelOfferMessageInfo(offerAddress: Address, cancellationComment?: string, queryId?: number): MessageInfo {
        let body = beginCell()
            .storeUint(OpCodes.CANCEL_DEAL, 32)
            .storeUint(queryId ?? 0, 64);
        if (cancellationComment) {
            body = body.storeStringTail(cancellationComment);
        }
        return new MessageInfo(offerAddress, Offer.TONS_CANCEL_OFFER, body.endCell());
    }

    async getStorageData(provider: ContractProvider, _isWebdom: boolean = true): Promise<TonSimpleOfferConfig> {
        const { stack } = await provider.get('get_storage_data', []);
        const sellerAddress = stack.readAddressOpt();
        const domainsDict = stack.readCell().beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.Uint(1));
        stack.skip(2);
        const state = stack.readNumber();
        const price = stack.readBigNumber();
        return {
            domainAddress: domainsDict.keys()[0]!,
            sellerAddress,
            state,
            price,
            commission: (stack.readBigNumber() * price) / BigInt(COMMISSION_DIVIDER),
            createdAt: stack.readNumber(),
            validUntil: stack.readNumber() + stack.readNumber(), // 0 + validUntil
            buyerAddress: stack.readAddress(),
            domainName: stack.readCell().beginParse().loadStringTail(),
            cancelledBySeller: stack.readNumber() === -1,
            sellerPrice: stack.readBigNumber()
        };
    }
}
