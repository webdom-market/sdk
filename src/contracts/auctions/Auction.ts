import type { Address, ContractProvider} from '@ton/core';
import { beginCell, toNano } from '@ton/core';

import { DefaultContract, MessageInfo } from '../imports/DefaultContract';
import { OpCodes, Tons } from '../imports/constants';

export abstract class Auction extends DefaultContract {
    static STATE_UNINIT = 0;
    static STATE_ACTIVE = 1;
    static STATE_COMPLETED = 2;
    static STATE_CANCELLED = 3;

    static stopAuctionMessage(isGetgemsV4: boolean = false) {
        if (!isGetgemsV4) {
            return beginCell().storeUint(0, 32).storeStringTail('stop').endCell();
        } else {
            return beginCell().storeUint(0xf373ace5, 32).storeUint(0, 64).endCell();
        }
    }

    static getStopAuctionMessageInfo(auctionAddress: Address, isGetgems: boolean = false, isV4: boolean = false): MessageInfo {
        return new MessageInfo(
            auctionAddress,
            isGetgems ? (isV4 ? toNano('0.27') : toNano('0.1')) : toNano('0.015'),
            Auction.stopAuctionMessage(isGetgems && isV4),
            null
        );
    }

    static renewDomainMessage(queryId: number = 0) {
        return beginCell().storeUint(OpCodes.RENEW_DOMAIN, 32).storeUint(queryId, 64).endCell();
    }

    static getRenewDomainMessageInfo(
        auctionAddress: Address,
        domainsNumber: number,
        queryId: number = 0,
        _isOldContract: boolean = false
    ): MessageInfo {
        return new MessageInfo(
            auctionAddress,
            Tons.RENEW_DOMAIN + Tons.RENEW_REQUEST * BigInt(domainsNumber) + toNano('0.004'),
            Auction.renewDomainMessage(queryId)
        );
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
