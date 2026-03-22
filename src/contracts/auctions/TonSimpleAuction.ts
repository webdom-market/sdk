import type { Address, ContractProvider} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';
import { MessageInfo } from '../imports/DefaultContract';
import type { Maybe } from '../imports/maybe';
import { VaultJetton } from '../imports/dedust';

import { Auction } from './Auction';
import { BidaskPool } from '../imports/BidaskPool';

export type TonSimpleAuctionConfig = {
    domainAddress: Address;
    sellerAddress: Address;
    minBidValue: bigint;
    maxBidValue: bigint;
    minBidIncrement: number;
    timeIncrement: number;
    commissionFactor: number;

    state: number;
    startTime: number;
    endTime: number;
    lastDomainRenewalTime: number;
    lastBidValue: bigint;
    lastBidTime: number;
    lastBidderAddress: Maybe<Address>;
    domainName: string;

    isDeffered: boolean;
    maxCommission: bigint;

    hotUntil?: number;
    coloredUntil?: number;
};

export class TonSimpleAuction extends Auction {
    static STATE_UNINIT = 0;
    static STATE_ACTIVE = 1;
    static STATE_COMPLETED = 2;
    static STATE_CANCELLED = 3;

    static TONS_END_AUCTION = toNano('0.07');
    static TONS_NOTIFY_BIDDER = toNano('0.005');
    static TONS_DEPLOY = toNano('0.05');
    static TONS_MIN_TON_FOR_STORAGE = toNano('0.035');
    static TONS_PLACE_BID = this.TONS_END_AUCTION + this.TONS_NOTIFY_BIDDER + this.TONS_MIN_TON_FOR_STORAGE;

    static createFromAddress(address: Address) {
        return new TonSimpleAuction(address);
    }

    static deployPayload(
        startTime: number,
        endTime: number,
        minBidValue: bigint,
        maxBidValue: bigint,
        minBidIncrement: number,
        timeIncrement: number,
        isDeffered: boolean = false
    ) {
        return beginCell()
            .storeBit(isDeffered)
            .storeUint(startTime, 32)
            .storeUint(endTime, 32)
            .storeCoins(minBidValue)
            .storeCoins(maxBidValue)
            .storeUint(minBidIncrement, 12)
            .storeUint(timeIncrement, 32)
            .endCell();
    }

    static placeBidMessageInfo(auctionAddress: Address, value: bigint): MessageInfo {
        return new MessageInfo(
            auctionAddress,
            value + TonSimpleAuction.TONS_PLACE_BID,
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
        queryId: number = 0,
        bidaskAllowed: boolean = false
    ) {
        if (fromAsset === 'USDT' && bidaskAllowed) {
            return await BidaskPool.getSwapMessageInfo(
                fromAsset,
                'TON',
                userAddress,
                auctionAddress,
                TonSimpleAuction.TONS_PLACE_BID,
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
            TonSimpleAuction.TONS_PLACE_BID,
            bidValue,
            queryId
        );
    }

    async getStorageData(
        provider: ContractProvider,
        isWebdom: boolean = true,
        prevConfig: TonSimpleAuctionConfig | null = null
    ): Promise<TonSimpleAuctionConfig> {
        if (isWebdom) {
            const { stack } = await provider.get('get_storage_data', []);
            const sellerAddress = stack.readAddress();
            const domainsDict = stack.readCell().beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.Uint(1));
            stack.skip(2);
            return {
                sellerAddress,
                domainAddress: domainsDict.keys()[0]!,
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
                domainName: stack.readCell().beginParse().loadStringTail(),
                maxCommission: (stack.readCellOpt() ? 1n : 1n) * stack.readBigNumber(),
                isDeffered: stack.readBoolean(),
                hotUntil: stack.readNumber(),
                coloredUntil: stack.readNumber()
            };
        } else {
            const { stack } = await provider.get('get_auction_data', []);
            const isInitialized = stack.readBoolean();
            const isFinished = stack.readBoolean();
            const res: any = {
                endTime: stack.readNumber(),
                domainAddress: [stack.readAddress(), stack.readAddress()][1],
                sellerAddress: stack.readAddress(),
                lastBidValue: stack.readBigNumber(),
                lastBidderAddress: stack.readAddressOpt(),
                minBidIncrement: stack.readNumber() * 10 + 1000,
                commissionFactor: [stack.readAddress(), stack.readNumber()][1],
                isDeffered: false
            };
            stack.skip(3);
            res.maxBidValue = stack.readBigNumber() ?? prevConfig?.maxBidValue;
            res.minBidValue = stack.readBigNumber();
            res.startTime = stack.readNumber();
            res.lastBidTime = stack.readNumber();
            const isCancelled = stack.readBoolean();
            res.state = isInitialized
                ? isFinished
                    ? isCancelled
                        ? TonSimpleAuction.STATE_CANCELLED
                        : TonSimpleAuction.STATE_COMPLETED
                    : TonSimpleAuction.STATE_ACTIVE
                : TonSimpleAuction.STATE_UNINIT;
            res.timeIncrement = stack.readNumber();

            res.lastDomainRenewalTime = res.startTime;
            res.maxCommission = prevConfig?.maxCommission ?? toNano('99999999');
            return res;
        }
    }
}
