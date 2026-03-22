import type { Address, ContractProvider} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';
import { JettonWallet } from '../JettonWallet';
import { MessageInfo } from '../imports/DefaultContract';
import type { Maybe } from '../imports/maybe';
import { COMMISSION_DIVIDER, OpCodes, Tons } from '../imports/constants';

import { Offer } from './Offer';

export type JettonSimpleOfferConfig = {
    state: number;
    price: bigint;
    commission: bigint;
    validUntil: number;
    sellerAddress: Maybe<Address>;
    jettonWalletAddress: Maybe<Address>;

    createdAt: number;
    domainAddress: Address;
    buyerAddress: Address;
    jettonMinterAddress: Address;
    domainName: string;
    cancelledBySeller: boolean;
    sellerPrice: bigint;
};

export class JettonSimpleOffer extends Offer {
    static TONS_DEPLOY = Tons.JETTON_TRANSFER + toNano('0.175');
    static TONS_CANCEL_OFFER = toNano('0.01');

    static createFromAddress(address: Address) {
        return new JettonSimpleOffer(address);
    }

    static deployPayload(validUntil: number, sellerAddress: Address, domainName: string, notifySeller: boolean = true) {
        return beginCell()
            .storeUint(validUntil, 32)
            .storeAddress(sellerAddress)
            .storeBit(notifySeller)
            .storeStringRefTail(domainName)
            .endCell();
    }

    static changePricePayload(newValidUntil: number, notifySeller: boolean) {
        return beginCell().storeUint(OpCodes.CHANGE_PRICE, 32).storeUint(newValidUntil, 32).storeBit(notifySeller).endCell();
    }

    static getChangePriceMessageInfo(
        userAddress: Address,
        offerAddress: Address,
        jettonWalletAddress: Address,
        oldPrice: bigint,
        commissionRate: number,
        newPrice: bigint,
        newValidUntil: number,
        notifySeller: boolean,
        queryId: number = 0,
        afterCounterproposal: boolean = false
    ): MessageInfo {
        Offer.assertPriceIncreaseOrThrow(oldPrice, newPrice);

        return JettonWallet.getTransferMessageInfo(
            jettonWalletAddress,
            ((newPrice - oldPrice) * (1000n + BigInt(Math.round(commissionRate * 1000)))) / 1000n,
            offerAddress,
            userAddress,
            Offer.TONS_CHANGE_PRICE +
            Offer.TONS_OFFER_NOTIFICATION * (notifySeller ? 1n : 0n) +
            (afterCounterproposal ? Offer.TONS_COUNTERPROPOSE_PRICE : 0n),
            JettonSimpleOffer.changePricePayload(newValidUntil, notifySeller),
            queryId
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

    async getStorageData(provider: ContractProvider, _isWebdom: boolean = true): Promise<JettonSimpleOfferConfig> {
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
            cancelledBySeller: stack.readBoolean(),
            jettonWalletAddress: stack.readAddress(),
            sellerPrice: stack.readBigNumber(),
            jettonMinterAddress: stack.readAddress()
        };
    }
}
