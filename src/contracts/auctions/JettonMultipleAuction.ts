import type { Address, ContractProvider} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';
import { DomainContract } from '../Domain';
import { JettonWallet } from '../JettonWallet';
import { MessageInfo } from '../imports/DefaultContract';
import type { Maybe } from '../imports/maybe';
import { Tons } from '../imports/constants';
import { VaultJetton, VaultNative } from '../imports/dedust';
import { Auction } from './Auction';

import { BidaskPool } from '../imports/BidaskPool';

export type JettonMultipleAuctionConfig = {
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

    jettonWalletAddress?: Maybe<Address>;
    jettonMinterAddress: Address;

    state: number;
    startTime: number;
    endTime: number;
    lastDomainRenewalTime: number;
    lastBidValue: bigint;
    lastBidTime: number;
    lastBidderAddress: Maybe<Address>;

    tonsToEndAuction: bigint;
    isDeferred: boolean;

    hotUntil?: number;
    coloredUntil?: number;
};

export class JettonMultipleAuction extends Auction {
    static STATE_UNINIT = 0;
    static STATE_ACTIVE = 1;
    static STATE_COMPLETED = 2;
    static STATE_CANCELLED = 3;
    static TONS_MIN_TON_FOR_STORAGE = toNano('0.04');

    static createFromAddress(address: Address) {
        return new JettonMultipleAuction(address);
    }

    static deployPayload(
        isWeb3: boolean,
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
            .storeBit(isWeb3)
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
            (Tons.NFT_TRANSFER + Tons.PURCHASE_NOTIFICATION + toNano('0.01')) * BigInt(domainsNumber) +
            Tons.JETTON_TRANSFER * 3n +
            Tons.NOTIFY_MARKETPLACE +
            JettonMultipleAuction.TONS_MIN_TON_FOR_STORAGE
        );
    }

    static getPlaceBidMessageInfo(
        userAddress: Address,
        auctionAddress: Address,
        jettonWalletAddress: Address,
        bidValue: bigint,
        domainsNumber: number,
        queryId: number = 0
    ): MessageInfo {
        const requiredValue = Tons.JETTON_TRANSFER + JettonMultipleAuction.getTonsToPlaceBid(domainsNumber);
        const payload = beginCell().storeUint(0, 32).storeStringTail('Bid via webdom.market').endCell();
        return new MessageInfo(
            jettonWalletAddress,
            requiredValue,
            JettonWallet.transferMessage(bidValue, auctionAddress, userAddress, requiredValue - Tons.JETTON_TRANSFER, payload, queryId)
        );
    }

    static async placeBidWithSwapMessageInfo(
        fromAsset: 'TON' | 'WEB3' | 'USDT',
        toAsset: 'WEB3' | 'USDT',
        userAddress: Address,
        auctionAddress: Address,
        swapAmount: bigint,
        bidValue: bigint,
        domainsNumber: number,
        jettonWalletAddress?: Address,
        queryId: number = 0
    ) {
        const requiredValue = Tons.JETTON_TRANSFER * 3n + JettonMultipleAuction.getTonsToPlaceBid(domainsNumber);
        if (fromAsset === 'TON') {
            if (toAsset === 'USDT') {
                return await BidaskPool.getSwapMessageInfo(
                    fromAsset,
                    toAsset,
                    userAddress,
                    auctionAddress,
                    requiredValue,
                    bidValue,
                    undefined,
                    queryId
                );
            }
            return VaultNative.getSwapMessageInfo(toAsset, userAddress, auctionAddress, swapAmount, bidValue, requiredValue, queryId);
        } else {
            return VaultJetton.getSwapMessageInfo(
                fromAsset,
                toAsset,
                userAddress,
                auctionAddress,
                jettonWalletAddress!,
                swapAmount,
                requiredValue,
                bidValue,
                queryId
            );
        }
    }
    async getStorageData(provider: ContractProvider, _isWebdom: boolean = true): Promise<JettonMultipleAuctionConfig> {
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

            jettonWalletAddress: stack.readAddressOpt(),

            isDeferred: stack.readBoolean(),
            hotUntil: stack.readNumber(),
            coloredUntil: stack.readNumber(),

            jettonMinterAddress: stack.readAddress(),
            tonsToEndAuction: JettonMultipleAuction.getTonsToPlaceBid(stack.readNumber())
        };
    }
}
