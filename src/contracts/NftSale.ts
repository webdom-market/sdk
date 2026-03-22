import type { Address, Cell, Contract, ContractProvider, Dictionary} from '@ton/core';
import { beginCell, toNano } from '@ton/core';

import { MessageInfo } from './imports/DefaultContract';

export type AddrList = Dictionary<Address, boolean>;

export type SaleConfig = {
    curNftIndex: number;
    adminAddress: Address;
    publicKey: bigint;
    nftCollectionAddress: Address;
    startTime: number;
    endTime: number;

    wlPrice: bigint;
    wlEndIndex: number;
    wlEndTime: number;

    defaultPrice: bigint;
    saleEndIndex: number;
};

export class NftSale implements Contract {
    static readonly TONS_NFT_MINT = toNano('0.03');
    static readonly OP_BUY_WITH_WL = 0x1437c636;

    constructor(readonly address: Address) {}

    static createFromAddress(address: Address) {
        return new NftSale(address);
    }

    static getSimplePurchaseMessageInfo(saleAddress: Address, nftsCount: number, nftPrice: bigint) {
        return new MessageInfo(saleAddress, BigInt(nftsCount) * (nftPrice + NftSale.TONS_NFT_MINT), beginCell().endCell());
    }

    static getWlPurchaseMessageInfo(saleAddress: Address, nftsCount: number, nftPrice: bigint, discountCell: Cell, queryId: number = 0) {
        return new MessageInfo(
            saleAddress,
            BigInt(nftsCount) * (nftPrice + NftSale.TONS_NFT_MINT),
            beginCell().storeUint(NftSale.OP_BUY_WITH_WL, 32).storeUint(queryId, 64).storeSlice(discountCell.beginParse()).endCell()
        );
    }

    async getStorageData(provider: ContractProvider): Promise<SaleConfig> {
        const { stack } = await provider.get('get_storage_data', []);
        return {
            curNftIndex: stack.readNumber(),
            adminAddress: stack.readAddress(),
            publicKey: stack.readBigNumber(),
            nftCollectionAddress: stack.readAddress(),
            startTime: stack.readNumber(),
            wlPrice: stack.readBigNumber(),
            wlEndIndex: stack.readNumber(),
            wlEndTime: stack.readNumber(),
            defaultPrice: stack.readBigNumber(),
            saleEndIndex: stack.readNumber(),
            endTime: stack.readNumber()
        };
    }
}
