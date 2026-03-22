import type { Address, ContractProvider} from '@ton/core';
import { beginCell, toNano } from '@ton/core';

import { MessageInfo } from '../DefaultContract';
import { Addresses } from '../constants';

import { ReadinessStatus } from './common';
import type { SwapParams, SwapStep} from './Vault';
import { Vault } from './Vault';

export class VaultNative extends Vault {
    static readonly DEPOSIT_LIQUIDITY = 0xd55e4686;
    static readonly SWAP = 0xea06185d;

    protected constructor(readonly address: Address) {
        super(address);
    }

    static createFromAddress(address: Address) {
        return new VaultNative(address);
    }

    async getReadinessStatus(provider: ContractProvider): Promise<ReadinessStatus> {
        const state = await provider.getState();
        if (state.state.type !== 'active') {
            return ReadinessStatus.NOT_DEPLOYED;
        }

        return ReadinessStatus.READY;
    }

    static swapMessage({
        queryId,
        amount,
        poolAddress,
        limit,
        swapParams,
        next
    }: {
        queryId?: bigint | number;
        amount: bigint;
        poolAddress: Address;
        limit?: bigint;
        swapParams?: SwapParams;
        next?: SwapStep;
    }) {
        return beginCell()
            .storeUint(VaultNative.SWAP, 32)
            .storeUint(queryId ?? 0, 64)
            .storeCoins(amount)
            .storeAddress(poolAddress)
            .storeUint(0, 1)
            .storeCoins(limit ?? 0)
            .storeMaybeRef(next ? Vault.packSwapStep(next) : null)
            .storeRef(Vault.packSwapParams(swapParams ?? {}))
            .endCell();
    }

    static getSwapMessageInfo(
        toAsset: 'WEB3' | 'USDT',
        fromAddress: Address,
        recipientAddress: Address,
        swapAmount: bigint,
        targetAmount: bigint,
        requiredGas: bigint,
        queryId?: number
    ) {
        const poolAddress = toAsset === 'WEB3' ? Addresses.WEB3_POOL : Addresses.USDT_POOL;
        let swapParams: SwapParams | undefined = undefined;
        if (!recipientAddress.equals(fromAddress)) {
            swapParams = {
                recipientAddress,
                fulfillPayload: beginCell().storeAddress(fromAddress!).endCell()
            };
        }
        return new MessageInfo(
            Addresses.NATIVE_VAULT,
            swapAmount + requiredGas + toNano('0.15'),
            VaultNative.swapMessage({
                amount: swapAmount,
                poolAddress,
                limit: targetAmount,
                queryId,
                swapParams
            })
        );
    }
}
