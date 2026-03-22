import type { Address, ContractProvider} from '@ton/core';
import { Dictionary, beginCell, toNano } from '@ton/core';

import { DomainContract } from '../Domain';
import { DefaultContract, MessageInfo } from '../imports/DefaultContract';
import { OpCodes } from '../imports/constants';

export type MultipleDomainsSwapConfig = {
    leftOwnerAddress: Address;
    leftDomainsTotal: number;
    leftDomainsReceived: number;
    leftDomainsDict: Dictionary<Address, boolean>;
    leftPaymentTotal: bigint;
    leftPaymentReceived: bigint;

    rightOwnerAddress: Address;
    rightDomainsTotal: number;
    rightDomainsReceived: number;
    rightDomainsDict: Dictionary<Address, boolean>;
    rightPaymentTotal: bigint;
    rightPaymentReceived: bigint;

    state: number;
    createdAt: number;
    validUntil: number;
    lastActionTime: number;
    commission: bigint;
    needsAlert: boolean;
};

export class DomainSwap extends DefaultContract {
    static TONS_DEPLOY = toNano('0.03');
    static TONS_ADD_DOMAIN = toNano('0.05');
    static STATE_WAITING_FOR_LEFT = 0;
    static STATE_WAITING_FOR_RIGHT = 1;
    static STATE_COMPLETED = 2;
    static STATE_CANCELLED = 3;

    static createFromAddress(address: Address) {
        return new DomainSwap(address);
    }

    static deployPayload(
        leftDomainAddresses: Address[],
        leftPaymentTotal: bigint,
        rightOwnerAddress: Address,
        rightDomainAddresses: Address[],
        rightPaymentTotal: bigint,
        validUntil: number,
        notifySeller: boolean = true
    ) {
        const leftDomainsDict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool());
        for (const domainAddress of leftDomainAddresses) {
            leftDomainsDict.set(domainAddress, false);
        }
        const rightDomainsDict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool());
        for (const domainAddress of rightDomainAddresses) {
            rightDomainsDict.set(domainAddress, false);
        }
        return beginCell()
            .storeDict(leftDomainsDict)
            .storeCoins(leftPaymentTotal)
            .storeAddress(rightOwnerAddress)
            .storeDict(rightDomainsDict)
            .storeCoins(rightPaymentTotal)
            .storeUint(validUntil, 32)
            .storeBit(notifySeller)
            .endCell();
    }

    static async getTransferDomainMessageInfo(
        userAddress: Address,
        domainAddress: Address,
        domainSwapAddress: Address,
        payment: bigint = 0n,
        queryId: number = 0,
        isTgUsername: boolean = false
    ) {
        return await DomainContract.getTransferMessageInfo(
            domainAddress,
            domainSwapAddress,
            userAddress,
            beginCell().storeUint(0, 32).storeStringTail('Domain swap on webdom.market').endCell(),
            DomainSwap.TONS_ADD_DOMAIN + payment,
            queryId,
            isTgUsername
        );
    }

    static addPaymentMessageInfo(domainSwapAddress: Address, value: bigint) {
        return new MessageInfo(domainSwapAddress, value + toNano('0.01'), beginCell().endCell());
    }

    static changeValidUntilMessage(validUntil: number, queryId: number = 0) {
        return beginCell().storeUint(OpCodes.CHANGE_VALID_UNTIL, 32).storeUint(queryId, 64).storeUint(validUntil, 32).endCell();
    }

    static changeValidUntilMessageInfo(domainSwapAddress: Address, validUntil: number, queryId: number = 0) {
        return new MessageInfo(domainSwapAddress, toNano('0.01'), DomainSwap.changeValidUntilMessage(validUntil, queryId));
    }

    static getCancelDealMessageInfo(domainSwapAddress: Address, domainsReceived: number | bigint | boolean) {
        return new MessageInfo(
            domainSwapAddress,
            toNano('0.03') + BigInt(domainsReceived) * toNano('0.03'),
            beginCell().storeUint(OpCodes.CANCEL_DEAL, 32).storeUint(Date.now(), 64).endCell()
        );
    }

    async getStorageData(provider: ContractProvider): Promise<MultipleDomainsSwapConfig> {
        const { stack } = await provider.get('get_storage_data', []);
        return {
            leftOwnerAddress: stack.readAddress(),
            leftDomainsDict: (() => {
                const tmp = stack.readCellOpt();
                return tmp
                    ? tmp.beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool())
                    : Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool());
            })(),
            leftDomainsTotal: stack.readNumber(),
            leftDomainsReceived: stack.readNumber(),
            leftPaymentTotal: stack.readBigNumber(),
            leftPaymentReceived: stack.readBigNumber(),

            rightOwnerAddress: stack.readAddress(),
            rightDomainsDict: (() => {
                const tmp = stack.readCellOpt();
                return tmp
                    ? tmp.beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool())
                    : Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool());
            })(),
            rightDomainsTotal: stack.readNumber(),
            rightDomainsReceived: stack.readNumber(),
            rightPaymentTotal: stack.readBigNumber(),
            rightPaymentReceived: stack.readBigNumber(),

            state: stack.readNumber(),
            createdAt: stack.readNumber(),
            validUntil: stack.readNumber(),
            lastActionTime: stack.readNumber(),
            commission: stack.readBigNumber(),
            needsAlert: stack.readBoolean()
        };
    }
}
