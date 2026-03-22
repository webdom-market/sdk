import type { Address, Contract, ContractProvider} from '@ton/core';
import { Cell, Dictionary, TupleBuilder, beginCell, toNano } from '@ton/core';
import type { TonClient4 } from '@ton/ton';

import { getTonClient } from '../config';

import { getBalanceExcludingStorageFees } from './getBalanceExcludingStorageFees';
import { Addresses, OpCodes, Tons } from './imports/constants';
import { MessageInfo } from './imports/DefaultContract';
import { getAddressByDomainName, getMinPrice } from './imports/dnsUtils';
import type { Maybe } from './imports/maybe';

export const DnsRecordType = {
    linkedWallet: '105311596331855300602201538317979276640056460191511695660591596829410056223515',
    linkedTonSite: '113837984718866553357015413641085683664993881322709313240352703269157551621118',
    linkedTonStorage: '33305727148774590499946634090951755272001978043137765208040544350030765946327',
    dummy: '0'
};

export type DnsRecords = {
    linkedWallet?: Address;
    linkedTonSite?: Cell;
    linkedTonStorage?: bigint;
};

export type DomainConfig = {
    name?: string;
    index: bigint;
    ownerAddress?: Address;
    dnsCollectionAddress: Address;
    lastRenewalTime?: number;
    init?: boolean;
    auctionInfo?: {
        lastBidderAddress: Address;
        lastBidValue: bigint;
        auctionEndTime: number;
        lastBidTime?: number;
        nextMinBidValue: bigint;
    };
    dnsRecords?: DnsRecords;
};

export function domainConfigToCell(config: DomainConfig): Cell {
    return beginCell().storeUint(config.index, 256).storeAddress(config.dnsCollectionAddress).endCell();
}

export class DomainContract implements Contract {
    static TONS_CHANGE_CONTENT = toNano('0.01');

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new DomainContract(address);
    }

    static async createFromName(domainName: string) {
        const address = await getAddressByDomainName(domainName);
        return DomainContract.createFromAddress(address);
    }

    static transferMessage(
        newOwner: Address,
        responseAddress: Maybe<Address> = null,
        forwardPayload: Maybe<Cell> = null,
        forwardAmount: bigint = 0n,
        queryId: number = 0
    ) {
        return beginCell()
            .storeUint(OpCodes.TRANSFER_NFT, 32)
            .storeUint(queryId, 64)
            .storeAddress(newOwner)
            .storeAddress(responseAddress)
            .storeBit(false) // no custom payload
            .storeCoins(forwardAmount)
            .storeMaybeRef(forwardPayload)
            .endCell();
    }

    static async getTransferMessageInfo(
        domainAddress: Address,
        newOwner: Address,
        responseAddress: Maybe<Address> = null,
        forwardPayload: Maybe<Cell> = null,
        forwardAmount: bigint = 0n,
        queryId: number = 0,
        isTgUsername: boolean = false,
        tonClient?: TonClient4
    ): Promise<MessageInfo> {
        if (!tonClient) {
            tonClient = getTonClient();
        }
        let requiredTon = (isTgUsername ? toNano('0.02') : 0n) + Tons.NFT_TRANSFER + forwardAmount;
        const balance = await getBalanceExcludingStorageFees(tonClient!, domainAddress);
        const missingBalance = 10n ** 9n - balance;
        requiredTon += missingBalance > 0n ? missingBalance : 0n;

        return new MessageInfo(
            domainAddress,
            requiredTon,
            DomainContract.transferMessage(newOwner, responseAddress, forwardPayload, forwardAmount, queryId)
        );
    }

    static startAuctionMessage(queryId: number = 0) {
        return beginCell().storeUint(OpCodes.DNS_BALANCE_RELEASE, 32).storeUint(queryId, 64).endCell();
    }

    static getStartAuctionMessageInfo(domainAddress: Address, domainLength?: number, queryId?: number, bidValue?: bigint): MessageInfo {
        if (!domainLength && !bidValue) {
            throw new Error('domainLength or bidValue must be provided');
        }
        bidValue = bidValue ?? getMinPrice(domainLength ?? 0);
        return new MessageInfo(domainAddress, bidValue, DomainContract.startAuctionMessage(queryId ?? 0));
    }

    static getPlaceBidMessageInfo(domainAddress: Address, bidValue: bigint): MessageInfo {
        return new MessageInfo(domainAddress, bidValue, beginCell().storeUint(0, 32).storeStringTail('Bid via webdom.market').endCell());
    }

    static stopTeleitemAuctionMessage(queryId: number = 0) {
        return beginCell().storeUint(OpCodes.STOP_TELEITEM_AUCTION, 32).storeUint(queryId, 64).endCell();
    }

    static getStopTeleitemAuctionMessageInfo(domainAddress: Address, queryId: number = 0) {
        return new MessageInfo(domainAddress, toNano('0.02'), DomainContract.stopTeleitemAuctionMessage(queryId));
    }

    static changeContentMessage(content: Cell, queryId: number = 0) {
        return beginCell().storeUint(OpCodes.EDIT_CONTENT, 32).storeUint(queryId, 64).storeRef(content).endCell();
    }

    static getChangeContentMessageInfo(domainAddress: Address, content: Cell, queryId: number = 0): MessageInfo {
        return new MessageInfo(domainAddress, DomainContract.TONS_CHANGE_CONTENT, DomainContract.changeContentMessage(content, queryId));
    }

    static setDnsRecordMessage(recordType: string, walletAddress?: Address, tonStorage?: bigint, queryId: number = 0) {
        const res = beginCell()
            .storeUint(OpCodes.CHANGE_DNS_RECORD, 32)
            .storeUint(queryId, 64)
            .storeUint(BigInt(DnsRecordType[recordType as keyof typeof DnsRecordType]), 256);
        if (walletAddress) {
            res.storeRef(beginCell().storeUint(0x9fd3, 16).storeAddress(walletAddress).storeUint(0, 8).endCell());
        } else if (tonStorage) {
            res.storeRef(beginCell().storeUint(0x7473, 16).storeUint(tonStorage, 256).storeUint(0, 8).endCell());
        }
        return res.endCell();
    }

    static getLinkWalletMessageInfo(domainAddress: Address, walletAddress?: Address, queryId: number = 0): MessageInfo {
        return new MessageInfo(
            domainAddress,
            DomainContract.TONS_CHANGE_CONTENT,
            DomainContract.setDnsRecordMessage('linkedWallet', walletAddress, undefined, queryId)
        );
    }

    static getRemoveDnsRecordMessageInfo(domainAddress: Address, recordType: string, queryId: number = 0) {
        return new MessageInfo(
            domainAddress,
            DomainContract.TONS_CHANGE_CONTENT,
            DomainContract.setDnsRecordMessage(recordType, undefined, undefined, queryId)
        );
    }

    static removeAllLinksMessage(queryId: number = 0) {
        return beginCell()
            .storeUint(OpCodes.EDIT_CONTENT, 32)
            .storeUint(queryId, 64)
            .storeRef(beginCell().storeUint(0, 9).endCell())
            .endCell();
    }

    static getRemoveAllLinksMessageInfo(domainAddress: Address, queryId: number = 0): MessageInfo {
        return new MessageInfo(domainAddress, DomainContract.TONS_CHANGE_CONTENT, DomainContract.removeAllLinksMessage(queryId));
    }

    static parseDnsRecords(_dnsRecords: string | Cell): DnsRecords {
        const res: DnsRecords = {};
        const dnsRecordsDict = (typeof _dnsRecords === 'string' ? Cell.fromHex(_dnsRecords) : _dnsRecords)
            .beginParse()
            .loadDictDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        const walletCell = dnsRecordsDict.get(105311596331855300602201538317979276640056460191511695660591596829410056223515n);
        if (walletCell) {
            const wallet = walletCell.beginParse();
            if (wallet?.loadUint(16) === 0x9fd3) {
                res.linkedWallet = wallet.loadAddress();
            }
        }
        const tonSiteCell = dnsRecordsDict.get(113837984718866553357015413641085683664993881322709313240352703269157551621118n);
        if (tonSiteCell) {
            const tonSite = tonSiteCell.beginParse();
            if (tonSite?.loadUint(16) === 0xad01) {
                res.linkedTonSite = tonSite.asCell();
            }
        }
        const tonStorageCell = dnsRecordsDict.get(33305727148774590499946634090951755272001978043137765208040544350030765946327n);
        if (tonStorageCell) {
            const tonStorage = tonStorageCell.beginParse();
            if (tonStorage?.loadUint(16) === 0x7473) {
                res.linkedTonStorage = tonStorage.loadUintBig(256);
            }
        }
        return res;
    }

    async getStorageData(
        provider: ContractProvider,
        needAuctionInfo: boolean = false,
        needDnsRecords: boolean = false
    ): Promise<DomainConfig> {
        const { stack: stack_1 } = await provider.get('get_nft_data', []);
        const res: DomainConfig = {
            init: stack_1.readBoolean(),
            index: stack_1.readBigNumber(),
            dnsCollectionAddress: stack_1.readAddress(),
            ownerAddress: stack_1.readAddressOpt() ?? undefined
        };

        if (res.dnsCollectionAddress.equals(Addresses.TON_DNS_COLLECTION)) {
            const nftContent = stack_1.readCell().beginParse();
            try {
                const dnsRecordsCell = nftContent.skip(8).loadMaybeRef();
                if (dnsRecordsCell) {
                    res.dnsRecords = DomainContract.parseDnsRecords(dnsRecordsCell);
                }
            } catch {}

            const { stack: stack_2 } = await provider.get('get_domain', []);
            res.name = stack_2.readString();

            const { stack: stack_3 } = await provider.get('get_last_fill_up_time', []);
            res.lastRenewalTime = stack_3.readNumber();

            if (needAuctionInfo || !res.ownerAddress) {
                const { stack: stack_4 } = await provider.get('get_auction_info', []);
                const lastBidderAddress = stack_4.readAddressOpt();
                if (lastBidderAddress) {
                    const lastBidValue = stack_4.readBigNumber();
                    const auctionEndTime = stack_4.readNumber();
                    const nextMinBidValue = (lastBidValue * 105n) / 100n + toNano('0.01');
                    res.auctionInfo = {
                        lastBidderAddress,
                        lastBidValue,
                        auctionEndTime,
                        nextMinBidValue
                    };
                    if (!res.ownerAddress && auctionEndTime < Date.now() / 1000) {
                        res.ownerAddress = lastBidderAddress;
                    }
                }
            }
        } else {
            const { stack: stack_2 } = await provider.get('get_telemint_token_name', []);
            res.name = stack_2.readString();
            res.lastRenewalTime = 2 ** 31 - 1;

            if (needAuctionInfo) {
                try {
                    const { stack: stack_3 } = await provider.get('get_telemint_auction_state', []);
                    const lastBidderAddress = stack_3.readAddressOpt();
                    if (lastBidderAddress) {
                        const lastBidValue = stack_3.readBigNumber();
                        const lastBidTime = stack_3.readNumber();
                        const nextMinBidValue = stack_3.readBigNumber();
                        const auctionEndTime = stack_3.readNumber();
                        res.auctionInfo = {
                            lastBidderAddress,
                            lastBidValue,
                            lastBidTime,
                            auctionEndTime,
                            nextMinBidValue
                        };
                    }
                } catch {}
            }
            if (needDnsRecords) {
                const argsBuilder = new TupleBuilder();
                argsBuilder.writeSlice(beginCell().storeUint(0, 8).asSlice());
                argsBuilder.writeNumber(0);
                const { stack: stack_4 } = await provider.get('dnsresolve', argsBuilder.build());
                stack_4.skip(1);
                const dnsRecordsCell = stack_4.readCellOpt();
                if (dnsRecordsCell) {
                    res.dnsRecords = DomainContract.parseDnsRecords(dnsRecordsCell);
                }
            }
        }
        return res;
    }
}
