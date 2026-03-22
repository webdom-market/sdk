import type { Address, ContractProvider} from '@ton/core';
import { beginCell, toNano } from '@ton/core';

import { JettonWallet } from '../../JettonWallet';
import { Addresses } from '../constants';

import { ReadinessStatus } from './common';
import type { SwapParams, SwapStep} from './Vault';
import { Vault } from './Vault';

export class VaultJetton extends Vault {
    static readonly DEPOSIT_LIQUIDITY = 0x40e108d6;
    static readonly SWAP = 0xe3a0d482;

    protected constructor(readonly address: Address) {
        super(address);
    }

    static createFromAddress(address: Address) {
        return new VaultJetton(address);
    }

    async getReadinessStatus(provider: ContractProvider): Promise<ReadinessStatus> {
        const state = await provider.getState();
        if (state.state.type !== 'active') {
            return ReadinessStatus.NOT_DEPLOYED;
        }

        const { stack } = await provider.get('is_ready', []);

        return stack.readBoolean() ? ReadinessStatus.READY : ReadinessStatus.NOT_READY;
    }

    static createSwapPayload({
        poolAddress,
        limit,
        swapParams,
        next
    }: {
        poolAddress: Address;
        limit?: bigint;
        swapParams?: SwapParams;
        next?: SwapStep;
    }) {
        return beginCell()
            .storeUint(VaultJetton.SWAP, 32)
            .storeAddress(poolAddress)
            .storeUint(0, 1) // reserved
            .storeCoins(limit ?? 0)
            .storeMaybeRef(next ? Vault.packSwapStep(next) : null)
            .storeRef(Vault.packSwapParams(swapParams ?? {}))
            .endCell();
    }

    static getSwapMessageInfo(
        fromAsset: 'WEB3' | 'USDT',
        toAsset: 'WEB3' | 'USDT' | 'TON',
        userAddress: Address,
        recipientAddress: Address,
        jettonWalletAddress: Address,
        swapAmount: bigint,
        requiredGas: bigint,
        targetAmount: bigint,
        queryId?: number
    ) {
        const vaultAddress = fromAsset === 'WEB3' ? Addresses.WEB3_VAULT : Addresses.USDT_VAULT;
        const poolAddress = fromAsset === 'WEB3' ? Addresses.WEB3_POOL : Addresses.USDT_POOL;
        let next: SwapStep | undefined = undefined;
        if (toAsset !== 'TON') {
            next = {
                poolAddress: toAsset === 'WEB3' ? Addresses.WEB3_POOL : Addresses.USDT_POOL,
                limit: targetAmount
            };
        }
        let swapParams: SwapParams | undefined = undefined;
        if (!recipientAddress.equals(userAddress)) {
            swapParams = {
                recipientAddress,
                fulfillPayload: beginCell().storeAddress(userAddress).endCell()
            };
        }
        return JettonWallet.getTransferMessageInfo(
            jettonWalletAddress,
            swapAmount,
            vaultAddress,
            userAddress,
            requiredGas + toNano('0.15') + (next ? toNano('0.05') : 0n),
            VaultJetton.createSwapPayload({ poolAddress, limit: targetAmount, next, swapParams }),
            queryId
        );
    }
}
