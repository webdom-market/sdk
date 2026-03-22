import type { Address, Cell, Contract, ContractProvider, DictionaryValue} from '@ton/core';
import { beginCell, toNano } from '@ton/core';
import type { Maybe } from './maybe';

import { OpCodes } from './constants';

export function stringValueParser(): DictionaryValue<string> {
    return {
        serialize: (src, buidler) => {
            buidler.storeStringTail(src);
        },
        parse: (src) => {
            return src.loadStringTail();
        }
    };
}

export class MessageInfo {
    address: string;
    amount: string;
    payload: string | undefined;
    stateInit: string | undefined;

    constructor(address: Address, value: bigint, payload?: Maybe<Cell>, stateInit?: Maybe<Cell>) {
        this.address = address.toString();
        this.amount = value.toString();
        this.payload = payload ? payload.toBoc().toString('base64') : undefined;
        this.stateInit = stateInit ? stateInit.toBoc().toString('base64') : undefined;
    }
}

export abstract class DefaultContract implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static fillUpBalanceMessage(queryId: number = 0) {
        return beginCell().storeUint(OpCodes.FILL_UP_BALANCE, 32).storeUint(queryId, 64).endCell();
    }
    static withdrawTonMessage(queryId: number = 0) {
        return beginCell().storeUint(OpCodes.WITHDRAW_TON, 32).storeUint(queryId, 64).endCell();
    }
    static setCodeMessage(code: Cell, data: Maybe<Cell>, queryId: number = 0) {
        return beginCell().storeUint(OpCodes.SET_CODE, 32).storeUint(queryId, 64).storeRef(code).storeMaybeRef(data).endCell();
    }
    static withdrawJettonMessage(jettonWalletAddress: Address, amount: bigint, queryId: number = 0) {
        return beginCell()
            .storeUint(OpCodes.WITHDRAW_JETTON, 32)
            .storeUint(queryId, 64)
            .storeAddress(jettonWalletAddress)
            .storeCoins(amount)
            .endCell();
    }
    static cancelDealMessage() {
        return beginCell().storeUint(0, 32).storeStringTail('cancel').endCell();
    }
    static sendAnyMessageMessage(
        toAddress: Address,
        payload: Cell,
        stateInit: Maybe<Cell> = null,
        queryId: number = 0,
        messageMode: number = 64
    ) {
        return beginCell()
            .storeUint(OpCodes.SEND_ANY_MESSAGE, 32)
            .storeUint(queryId ?? 0, 64)
            .storeAddress(toAddress)
            .storeMaybeRef(payload)
            .storeMaybeRef(stateInit)
            .storeUint(messageMode, 8)
            .endCell();
    }

    static getCancelDealMessageInfo(saleAddress: Address, isGetgems: boolean | number | bigint = true): MessageInfo {
        return new MessageInfo(saleAddress, isGetgems ? toNano('0.105') : toNano('0.02'), DefaultContract.cancelDealMessage(), null);
    }
    static getFillUpBalanceMessageInfo(contractAddress: Address, amount: bigint, queryId: number = 0): MessageInfo {
        return new MessageInfo(contractAddress, amount + toNano('0.001'), DefaultContract.fillUpBalanceMessage(queryId), null);
    }
    static getWithdrawJettonMessageInfo(
        contractAddress: Address,
        jettonWalletAddress: Address,
        amount: bigint,
        queryId: number = 0
    ): MessageInfo {
        return new MessageInfo(
            contractAddress,
            toNano('0.07'),
            DefaultContract.withdrawJettonMessage(jettonWalletAddress, amount, queryId),
            null
        );
    }
    static getWithdrawTonMessageInfo(contractAddress: Address, queryId: number = 0): MessageInfo {
        return new MessageInfo(contractAddress, toNano('0.02'), DefaultContract.withdrawTonMessage(queryId), null);
    }

    abstract getStorageData(provider: ContractProvider, ...args: unknown[]): Promise<unknown>;
}
