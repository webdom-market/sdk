import type { Address, Cell, Contract, ContractProvider} from '@ton/core';
import { beginCell, toNano } from '@ton/core';

import { OpCodes, Tons } from './imports/constants';
import { MessageInfo } from './imports/DefaultContract';
import type { Maybe } from './imports/maybe';

export class JettonWallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new JettonWallet(address);
    }

    async getJettonBalance(provider: ContractProvider) {
        const state = await provider.getState();
        if (state.state.type !== 'active') {
            return 0n;
        }
        const res = await provider.get('get_wallet_data', []);
        return res.stack.readBigNumber();
    }

    static transferMessage(
        jetton_amount: bigint,
        toAddress: Address,
        responseAddress: Address,
        forwardTonAmount: bigint,
        forwardPayload: Maybe<Cell>,
        queryId?: number
    ) {
        const tmp = beginCell()
            .storeUint(OpCodes.TRANSFER_JETTON, 32)
            .storeUint(queryId ?? 0, 64)
            .storeCoins(jetton_amount)
            .storeAddress(toAddress)
            .storeAddress(responseAddress)
            .storeBit(0)
            .storeCoins(forwardTonAmount);
        if (forwardPayload && forwardPayload.bits.length < 200) {
            return tmp.storeBit(0).storeSlice(forwardPayload.asSlice()).endCell();
        } else {
            return tmp.storeMaybeRef(forwardPayload).endCell();
        }
    }

    static getTransferMessageInfo(
        jettonWalletAddress: Address,
        jettonAmount: bigint,
        toAddress: Address,
        responseAddress: Address,
        forwardTonAmount: bigint,
        forwardPayload?: Maybe<Cell>,
        queryId?: number
    ) {
        return new MessageInfo(
            jettonWalletAddress,
            Tons.JETTON_TRANSFER + forwardTonAmount,
            JettonWallet.transferMessage(jettonAmount, toAddress, responseAddress, forwardTonAmount, forwardPayload, queryId)
        );
    }

    static transferNotificationMessage(jettonAmount: bigint, fromAddress: Address, forwardPayload?: Maybe<Cell>, queryId?: number) {
        return beginCell()
            .storeUint(OpCodes.TRANSFER_NOTIFICATION, 32)
            .storeUint(queryId ?? 0, 64)
            .storeCoins(jettonAmount)
            .storeAddress(fromAddress)
            .storeMaybeRef(forwardPayload)
            .endCell();
    }

    /*
        burn#595f07bc query_id:uint64 amount:(VarUInteger 16)
        response_destination:MsgAddress custom_payload:(Maybe ^Cell)
        = InternalMsgBody;
    */
    static burnMessage(jetton_amount: bigint, responseAddress: Address, customPayload: Cell) {
        return beginCell()
            .storeUint(OpCodes.BURN_JETTON, 32)
            .storeUint(0, 64)
            .storeCoins(jetton_amount)
            .storeAddress(responseAddress)
            .storeMaybeRef(customPayload)
            .endCell();
    }

    static getBurnMessageInfo(jettonWalletAddress: Address, jettonAmount: bigint, responseAddress: Address, customPayload: Cell) {
        return new MessageInfo(jettonWalletAddress, toNano('0.05'), JettonWallet.burnMessage(jettonAmount, responseAddress, customPayload));
    }

    /*
        withdraw_tons#107c49ef query_id:uint64 = InternalMsgBody;
    */
    static withdrawTonsMessage() {
        return beginCell().storeUint(0x6d8e5e3c, 32).storeUint(0, 64).endCell();
    }

    static getWithdrawTonsMessageInfo(jettonWalletAddress: Address) {
        return new MessageInfo(jettonWalletAddress, toNano('0.1'), JettonWallet.withdrawTonsMessage());
    }
    /*
        withdraw_jettons#10 query_id:uint64 wallet:MsgAddressInt amount:Coins = InternalMsgBody;
    */
    static withdrawJettonsMessage(from: Address, amount: bigint) {
        return beginCell()
            .storeUint(0x768a50b2, 32)
            .storeUint(0, 64) // op, queryId
            .storeAddress(from)
            .storeCoins(amount)
            .storeMaybeRef(null)
            .endCell();
    }

    static getWithdrawJettonsMessageInfo(jettonWalletAddress: Address, from: Address, amount: bigint) {
        return new MessageInfo(jettonWalletAddress, toNano('0.1'), JettonWallet.withdrawJettonsMessage(from, amount));
    }
}
