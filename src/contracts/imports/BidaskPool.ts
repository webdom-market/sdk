import type { Address, Contract } from '@ton/core';
import { beginCell } from '@ton/core';

import { resolveFetchImplementation } from '../../config';
import { Addresses } from './constants';
import { MessageInfo } from './DefaultContract';
import { JettonWallet } from '../JettonWallet';

export interface GetSwapAmountParams {
    fromAsset: 'WEB3' | 'USDT' | 'TON';
    toAsset: 'WEB3' | 'USDT' | 'TON';
    expectedAmount: bigint;
}

export interface GetSwapAmountResponse {
    min_gas_fee: string;
    sell_amount_in: string;
}

function getBidaskTokenAddress(asset: GetSwapAmountParams['fromAsset']): Address {
    if (asset === 'TON') {
        return Addresses.BURN;
    }
    return Addresses[asset];
}

export const getSwapAmount = async (
    params: GetSwapAmountParams
): Promise<{
    gasFee: bigint;
    sellAmount: bigint;
    poolAddress: Address;
}> => {
    const url = 'https://api.bidask.finance/all-Pio5Thipi9oadiey/api/estimate/swap/exact_out';
    const [asset1, asset2] = [params.fromAsset, params.toAsset].sort();
    let poolAddress: Address;
    if (asset1 === 'TON' && asset2 === 'USDT') {
        poolAddress = Addresses.BIDASK_USDT_TON_POOL;
    } else if (asset1 === 'TON' && asset2 === 'WEB3') {
        poolAddress = Addresses.BIDASK_WEB3_TON_POOL;
    } else {
        throw new Error('Invalid assets');
    }
    const response = await resolveFetchImplementation()(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            buy_amount: params.expectedAmount.toString(),
            buy_token: getBidaskTokenAddress(params.toAsset).toString(),
            sell_token: getBidaskTokenAddress(params.fromAsset).toString(),
            pool: poolAddress.toString(),
            detailed: false,
            partial_execution: false,
            slippage_bps: 1073741824
        })
    });
    if (!response.ok) {
        throw new Error(await response.text());
    }
    const responseData = (await response.json()).result as GetSwapAmountResponse;
    return {
        gasFee: BigInt(responseData.min_gas_fee),
        sellAmount: BigInt(responseData.sell_amount_in),
        poolAddress
    };
};

export abstract class BidaskPool implements Contract {
    protected constructor(readonly address: Address) {}

    static tonSwapMessage(params: {
        queryId?: number;
        tonAmount: bigint;
        recipientAddress: Address;
        slippage?: bigint;
        exactOut: bigint;
        userAddress: Address;
    }) {
        return beginCell()
            .storeUint(0xf2ef6c1b, 32)
            .storeUint(params.queryId ?? Date.now(), 64)
            .storeCoins(params.tonAmount)
            .storeAddress(params.recipientAddress)
            .storeBit(0)
            .storeCoins(params.slippage ?? params.exactOut)
            .storeCoins(params.exactOut)
            .storeAddress(Addresses.ADMIN)
            .storeMaybeRef(beginCell().storeAddress(params.userAddress).endCell())
            .storeBit(0)
            .storeMaybeRef(beginCell().storeAddress(params.userAddress).endCell())
            .endCell();
    }
    static jettonSwapPayload(params: { recipientAddress: Address; slippage?: bigint; exactOut: bigint; userAddress: Address }) {
        return beginCell()
            .storeUint(0xf2ef6c1b, 32)
            .storeAddress(params.recipientAddress)
            .storeBit(0)
            .storeCoins(params.slippage ?? params.exactOut)
            .storeCoins(params.exactOut)
            .storeAddress(Addresses.ADMIN)
            .storeMaybeRef(beginCell().storeAddress(params.userAddress).endCell())
            .storeBit(0)
            .storeMaybeRef(beginCell().storeAddress(params.userAddress).endCell())
            .endCell();
    }

    static async getSwapMessageInfo(
        fromAsset: 'WEB3' | 'USDT' | 'TON',
        toAsset: 'WEB3' | 'USDT' | 'TON',
        userAddress: Address,
        recipientAddress: Address,
        requiredGas: bigint,
        targetAmount: bigint,
        jettonWalletAddress?: Address,
        queryId?: number
    ) {
        if (fromAsset === 'WEB3' || (fromAsset === 'USDT' && toAsset !== 'TON')) {
            throw new Error('Unsupported assets');
        }
        const { gasFee, sellAmount, poolAddress } = await getSwapAmount({
            fromAsset,
            toAsset,
            expectedAmount: (targetAmount * 100n) / 96n
        });
        if (fromAsset === 'TON') {
            return new MessageInfo(
                poolAddress,
                requiredGas * 3n + gasFee + (sellAmount * 1005n) / 1000n,
                BidaskPool.tonSwapMessage({
                    queryId,
                    tonAmount: (sellAmount * 101n) / 100n,
                    recipientAddress,
                    exactOut: (targetAmount * 100n) / 96n,
                    userAddress
                })
            );
        }
        return JettonWallet.getTransferMessageInfo(
            jettonWalletAddress!,
            (sellAmount * 1005n) / 1000n,
            poolAddress,
            userAddress,
            requiredGas * 3n + gasFee,
            BidaskPool.jettonSwapPayload({ recipientAddress, exactOut: (targetAmount * 100n) / 96n, userAddress })
        );
    }
}
