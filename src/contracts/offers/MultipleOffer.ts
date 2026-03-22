import type { Address, Builder, Cell, ContractProvider, Slice} from '@ton/core';
import { Dictionary, beginCell, contractAddress, toNano } from '@ton/core';

import { DefaultContract, MessageInfo } from '../imports/DefaultContract';
import { MULTIPLE_OFFER_CODE } from '../imports/codes';
import { OpCodes, PUBLIC_KEY, Tons } from '../imports/constants';

export interface DomainInOfferInfo {
    price: bigint;
    validUntil: number;
    jettonInfo?: {
        jettonWalletAddress: Address;
        oneJetton: bigint;
        jettonSymbol: string;
    };
}

export const domainInOfferValue = {
    serialize: (src: DomainInOfferInfo, builder: Builder) => {
        builder = builder.storeCoins(src.price).storeUint(src.validUntil, 32);
        if (src.jettonInfo) {
            const { jettonWalletAddress, oneJetton, jettonSymbol } = src.jettonInfo;
            builder = builder.storeBit(true).storeAddress(jettonWalletAddress).storeCoins(oneJetton).storeStringTail(jettonSymbol);
        } else {
            builder = builder.storeBit(false);
        }
        return builder;
    },
    parse: (src: Slice) => {
        const domainInOffer: DomainInOfferInfo = {
            price: src.loadCoins(),
            validUntil: src.loadUint(32)
        };
        if (src.loadBit()) {
            domainInOffer.jettonInfo = {
                jettonWalletAddress: src.loadAddress(),
                oneJetton: src.loadCoins(),
                jettonSymbol: src.loadStringTail()
            };
        }
        return domainInOffer;
    }
};

export type MultipleOfferConfig = {
    ownerAddress: Address;
    merkleRoot: bigint;
    soldNftsDict: Dictionary<Address, number>;
    jettonBalancesDict: Dictionary<Address, bigint>;
    publicKey: bigint;
    commissionFactor: number;
    web3CommissionFactor: number;
    web3WalletAddress?: Address;
};

export function multipleTonOfferConfigToCell(config: MultipleOfferConfig): Cell {
    return beginCell()
        .storeAddress(config.ownerAddress)
        .storeUint(config.merkleRoot, 256)
        .storeDict(config.soldNftsDict)
        .storeDict(config.jettonBalancesDict)
        .storeRef(beginCell().storeUint(config.publicKey, 256).endCell())
        .storeUint(config.commissionFactor, 16)
        .storeUint(config.web3CommissionFactor, 16)
        .storeUint(0, 2)
        .endCell();
}

export class MultipleOffer extends DefaultContract {
    static TONS_DEPLOY = toNano('0.08');
    static TONS_SELL_FOR_TON = Tons.NFT_TRANSFER + toNano('0.02');
    static TONS_SELL_FOR_JETTON = Tons.NFT_TRANSFER + Tons.JETTON_TRANSFER * 2n + Tons.NOTIFY_MARKETPLACE + toNano('0.02');

    static STATE_UNINIT = 0;
    static STATE_ACTIVE = 1;

    static createFromAddress(address: Address) {
        return new MultipleOffer(address);
    }

    static createFromOwnerAddress(ownerAddress: Address, code: Cell = MULTIPLE_OFFER_CODE, workchain = 0) {
        const data = multipleTonOfferConfigToCell({
            ownerAddress,
            merkleRoot: 0n,
            soldNftsDict: Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Uint(32)),
            jettonBalancesDict: Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.BigUint(256)),
            publicKey: PUBLIC_KEY,
            commissionFactor: 0,
            web3CommissionFactor: 0
        });
        const init = { code, data };
        return new MultipleOffer(contractAddress(workchain, init), init);
    }

    static deployPayload(merkleRoot: bigint) {
        return beginCell().storeUint(merkleRoot, 256).endCell();
    }

    static withdrawExactTonMessage(amount: bigint, queryId: number = 0) {
        return beginCell().storeUint(OpCodes.WITHDRAW_TON, 32).storeUint(queryId, 64).storeCoins(amount).endCell();
    }

    static fillUpJettonBalancePayload(tonAmountToReserve: bigint) {
        if (tonAmountToReserve > 0n) {
            return beginCell().storeBit(true).storeCoins(tonAmountToReserve).endCell();
        }
        return beginCell().storeBit(false).endCell();
    }

    static getWithdrawExactTonMessage(offerAddress: Address, amount: bigint, queryId: number = 0): MessageInfo {
        return new MessageInfo(offerAddress, toNano('0.01'), MultipleOffer.withdrawExactTonMessage(amount, queryId));
    }

    static getCancelDealMessageInfo(offerAddress: Address, additionalTon: bigint = 0n): MessageInfo {
        return new MessageInfo(offerAddress, additionalTon + toNano('0.02'), DefaultContract.cancelDealMessage(), null);
    }

    async getStorageData(provider: ContractProvider): Promise<MultipleOfferConfig> {
        const { stack } = await provider.get('get_storage_data', []);
        const res: MultipleOfferConfig = {
            ownerAddress: stack.readAddress(),
            merkleRoot: stack.readBigNumber(),
            publicKey: stack.readBigNumber(),
            commissionFactor: stack.readNumber(),
            web3CommissionFactor: stack.readNumber(),
            soldNftsDict: Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Uint(32)),
            jettonBalancesDict: Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.BigUint(256))
        };
        const soldNftsCell = stack.readCellOpt();
        if (soldNftsCell) {
            res.soldNftsDict = soldNftsCell.beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.Uint(32));
        }
        const jettonBalancesCell = stack.readCellOpt();
        if (jettonBalancesCell) {
            res.jettonBalancesDict = jettonBalancesCell
                .beginParse()
                .loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.BigVarUint(4));
        }
        res.web3WalletAddress = stack.readAddressOpt() ?? undefined;
        return res;
    }
}
