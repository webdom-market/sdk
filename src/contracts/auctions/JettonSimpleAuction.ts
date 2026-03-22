import type { Address, ContractProvider} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';
import { JettonWallet } from '../JettonWallet';
import { MessageInfo } from '../imports/DefaultContract';
import type { Maybe } from '../imports/maybe';
import { Tons } from '../imports/constants';
import { VaultJetton, VaultNative } from '../imports/dedust';

import { Auction } from './Auction';
import { TonSimpleAuction } from './TonSimpleAuction';
import { BidaskPool } from '../imports/BidaskPool';

export type JettonSimpleAuctionConfig = {
    domainAddress: Address;
    sellerAddress: Address;
    minBidValue: bigint;
    maxBidValue: bigint;
    minBidIncrement: number;
    timeIncrement: number;
    commissionFactor: number;
    maxCommission: bigint;

    jettonWalletAddress?: Maybe<Address>;
    jettonMinterAddress: Address;

    state: number;
    startTime: number;
    endTime: number;
    lastDomainRenewalTime: number;
    lastBidValue: bigint;
    lastBidTime: number;
    lastBidderAddress: Maybe<Address>;
    domainName: string;

    isDeferred: boolean;

    hotUntil?: number;
    coloredUntil?: number;
};

export class JettonSimpleAuction extends Auction {
    static STATE_UNINIT = 0;
    static STATE_ACTIVE = 1;
    static STATE_COMPLETED = 2;
    static STATE_CANCELLED = 3;

    static TONS_DEPLOY = TonSimpleAuction.TONS_DEPLOY + toNano('0.01'); // 0.055
    static TONS_END_AUCTION = TonSimpleAuction.TONS_END_AUCTION + Tons.NOTIFY_MARKETPLACE + Tons.JETTON_TRANSFER * 2n;
    static TONS_NOTIFY_BIDDER = TonSimpleAuction.TONS_NOTIFY_BIDDER;
    static TONS_MIN_TON_FOR_STORAGE = TonSimpleAuction.TONS_MIN_TON_FOR_STORAGE;
    static TONS_PLACE_BID = this.TONS_END_AUCTION + Tons.JETTON_TRANSFER + this.TONS_MIN_TON_FOR_STORAGE + toNano('0.014');

    static createFromAddress(address: Address) {
        return new JettonSimpleAuction(address);
    }

    static deployPayload(
        isWeb3: boolean,
        startTime: number,
        endTime: number,
        minBidValue: bigint,
        maxBidValue: bigint,
        minBidIncrement: number,
        timeIncrement: number,
        isDeffered: boolean = false
    ) {
        return beginCell()
            .storeBit(isWeb3)
            .storeBit(isDeffered)
            .storeUint(startTime, 32)
            .storeUint(endTime, 32)
            .storeCoins(minBidValue)
            .storeCoins(maxBidValue)
            .storeUint(minBidIncrement, 12)
            .storeUint(timeIncrement, 32)
            .endCell();
    }

    static getPlaceBidMessageInfo(
        userAddress: Address,
        auctionAddress: Address,
        jettonWalletAddress: Address,
        value: bigint,
        queryId: number = 0
    ): MessageInfo {
        const requiredValue = JettonSimpleAuction.TONS_PLACE_BID + Tons.JETTON_TRANSFER;
        const payload = beginCell().storeUint(0, 32).storeStringTail('Bid via webdom.market').endCell();
        return new MessageInfo(
            jettonWalletAddress,
            requiredValue,
            JettonWallet.transferMessage(value, auctionAddress, userAddress, requiredValue - Tons.JETTON_TRANSFER, payload, queryId),
            null
        );
    }

    static async placeBidWithSwapMessageInfo(
        fromAsset: 'TON' | 'WEB3' | 'USDT',
        toAsset: 'WEB3' | 'USDT',
        userAddress: Address,
        auctionAddress: Address,
        swapAmount: bigint,
        bidValue: bigint,
        jettonWalletAddress?: Address,
        queryId: number = 0
    ) {
        if (fromAsset === 'TON') {
            if (toAsset === 'USDT') {
                return await BidaskPool.getSwapMessageInfo(
                    fromAsset,
                    toAsset,
                    userAddress,
                    auctionAddress,
                    JettonSimpleAuction.TONS_PLACE_BID + Tons.JETTON_TRANSFER * 2n,
                    bidValue,
                    undefined,
                    queryId
                );
            }
            return VaultNative.getSwapMessageInfo(
                toAsset,
                userAddress,
                auctionAddress,
                swapAmount,
                bidValue,
                JettonSimpleAuction.TONS_PLACE_BID + Tons.JETTON_TRANSFER * 2n,
                queryId
            );
        } else {
            return VaultJetton.getSwapMessageInfo(
                fromAsset,
                toAsset,
                userAddress,
                auctionAddress,
                jettonWalletAddress!,
                swapAmount,
                JettonSimpleAuction.TONS_PLACE_BID + Tons.JETTON_TRANSFER * 2n,
                bidValue,
                queryId
            );
        }
    }

    async getStorageData(
        provider: ContractProvider,
        isWebdom: boolean = true,
        prevConfig: JettonSimpleAuctionConfig | null = null
    ): Promise<JettonSimpleAuctionConfig> {
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

                jettonWalletAddress: stack.readAddressOpt(),
                isDeferred: stack.readBoolean(),

                hotUntil: stack.readNumber(),
                coloredUntil: stack.readNumber(),

                jettonMinterAddress: stack.readAddress()
            };
        } else {
            const { stack } = await provider.get('get_auction_data_v4', []);
            const isInitialized = stack.readBoolean();
            const isFinished = stack.readBoolean();
            const res: any = {
                endTime: stack.readNumber(),
                domainAddress: [stack.readAddress(), stack.readAddress()][1],
                sellerAddress: stack.readAddress(),
                lastBidValue: stack.readBigNumber(),
                lastBidderAddress: stack.readAddressOpt(),
                minBidIncrement: stack.readNumber() * 10 + 1000,
                commissionFactor: [stack.readAddress(), stack.readNumber()][1]
            };
            stack.skip(2);
            res.maxBidValue = stack.readBigNumber();
            res.minBidValue = stack.readBigNumber();
            res.startTime = stack.readNumber();
            res.lastBidTime = stack.readNumber();
            const isCancelled = stack.readBoolean();
            res.state = isInitialized
                ? isFinished
                    ? isCancelled
                        ? JettonSimpleAuction.STATE_CANCELLED
                        : JettonSimpleAuction.STATE_COMPLETED
                    : JettonSimpleAuction.STATE_ACTIVE
                : JettonSimpleAuction.STATE_UNINIT;
            res.timeIncrement = stack.readNumber();
            res.jettonWalletAddress = stack.readAddress();
            res.jettonMinterAddress = stack.readAddress();

            res.lastDomainRenewalTime = prevConfig?.lastDomainRenewalTime ?? res.startTime;
            res.maxCommission = prevConfig?.maxCommission ?? toNano('99999999');
            return res;
        }
    }
}
