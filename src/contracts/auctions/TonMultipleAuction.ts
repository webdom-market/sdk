import type { Address, ContractProvider} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';
import { DomainContract } from '../Domain';
import { MessageInfo } from '../imports/DefaultContract';
import type { Maybe } from '../imports/maybe';
import { Tons } from '../imports/constants';
import { VaultJetton } from '../imports/dedust';
import { Auction } from './Auction';

import { BidaskPool } from '../imports/BidaskPool';

export type TonMultipleAuctionConfig = {
    sellerAddress: Address;
    domainsDict: Dictionary<Address, number>;
    domainsTotal: number;
    domainsReceived: number;

    minBidValue: bigint;
    maxBidValue: bigint;
    minBidIncrement: number;
    timeIncrement: number;
    commissionFactor: number;
    maxCommission: bigint;

    state: number;
    startTime: number;
    endTime: number;
    lastDomainRenewalTime: number;
    lastBidValue: bigint;
    lastBidTime: number;
    lastBidderAddress: Maybe<Address>;

    isDeferred: boolean;

    hotUntil?: number;
    coloredUntil?: number;
};

export class TonMultipleAuction extends Auction {
    static STATE_UNINIT = 0;
    static STATE_ACTIVE = 1;
    static STATE_COMPLETED = 2;
    static STATE_CANCELLED = 3;

    static createFromAddress(address: Address) {
        return new TonMultipleAuction(address);
    }

    static deployPayload(
        domainsList: Array<Address>,
        startTime: number,
        endTime: number,
        minBidValue: bigint,
        maxBidValue: bigint,
        minBidIncrement: number,
        timeIncrement: number,
        isDeffered: boolean = false
    ) {
        const domainsDict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool());
        for (const domainAddress of domainsList) {
            domainsDict.set(domainAddress, false);
        }

        return beginCell()
            .storeBit(isDeffered)
            .storeUint(startTime, 32)
            .storeUint(endTime, 32)
            .storeDict(domainsDict)
            .storeCoins(minBidValue)
            .storeCoins(maxBidValue)
            .storeUint(minBidIncrement, 12)
            .storeUint(timeIncrement, 32)
            .endCell();
    }

    static async getTransferDomainMessageInfo(
        userAddress: Address,
        domainAddress: Address,
        auctionAddress: Address,
        queryId: number = 0,
        isTgUsername: boolean = false
    ): Promise<MessageInfo> {
        return await DomainContract.getTransferMessageInfo(
            domainAddress,
            auctionAddress,
            userAddress,
            beginCell().storeUint(0, 32).storeStringTail('Multiple auction on webdom.market').endCell(),
            Tons.NFT_TRANSFER + 23000000n,
            queryId,
            isTgUsername
        );
    }

    static getTonsToPlaceBid(domainsNumber: number) {
        return (
            (Tons.NFT_TRANSFER + Tons.PURCHASE_NOTIFICATION + toNano('0.015')) * BigInt(domainsNumber) + toNano('0.035') + toNano('0.005')
        );
    }

    static placeBidMessageInfo(auctionAddress: Address, bidValue: bigint, domainsNumber: number): MessageInfo {
        return new MessageInfo(
            auctionAddress,
            bidValue + TonMultipleAuction.getTonsToPlaceBid(domainsNumber),
            beginCell().storeUint(0, 32).storeStringTail('Bid via webdom.market').endCell()
        );
    }

    static async placeBidWithSwapMessageInfo(
        fromAsset: 'WEB3' | 'USDT',
        userAddress: Address,
        auctionAddress: Address,
        jettonWalletAddress: Address,
        swapAmount: bigint,
        bidValue: bigint,
        domainsNumber: number,
        queryId: number = 0,
        bidaskAllowed: boolean = false
    ) {
        if (fromAsset === 'USDT' && bidaskAllowed) {
            return await BidaskPool.getSwapMessageInfo(
                fromAsset,
                'TON',
                userAddress,
                auctionAddress,
                TonMultipleAuction.getTonsToPlaceBid(domainsNumber),
                bidValue,
                jettonWalletAddress,
                queryId
            );
        }
        return VaultJetton.getSwapMessageInfo(
            fromAsset,
            'TON',
            userAddress,
            auctionAddress,
            jettonWalletAddress,
            swapAmount,
            TonMultipleAuction.getTonsToPlaceBid(domainsNumber),
            bidValue,
            queryId
        );
    }

    async getStorageData(provider: ContractProvider, _isWebdom: boolean = true): Promise<TonMultipleAuctionConfig> {
        const { stack } = await provider.get('get_storage_data', []);
        return {
            sellerAddress: stack.readAddress(),
            domainsDict: stack.readCell().beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.Uint(1)),
            domainsTotal: stack.readNumber(),
            domainsReceived: stack.readNumber(),
            state: stack.readNumber(),
            maxBidValue: stack.readBigNumber(),
            commissionFactor: stack.readNumber(),
            startTime: stack.readNumber(),
            lastDomainRenewalTime: stack.readNumber(),
            endTime: stack.readNumber(),
            lastBidderAddress: stack.readAddressOpt(),

            minBidValue: stack.readBigNumber(),
            minBidIncrement: stack.readNumber(),
            timeIncrement: stack.readNumber(),

            lastBidValue: stack.readBigNumber(),
            lastBidTime: stack.readNumber(),

            maxCommission: stack.readBigNumber(),

            isDeferred: stack.readBoolean(),

            hotUntil: stack.readNumber(),
            coloredUntil: stack.readNumber()
        };
    }
}
