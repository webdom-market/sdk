import { beginCell } from '@ton/core';

import { Currencies } from './constants/currencies';
import { normalizeAddress } from './config';
import type { AddressLike, WebdomSdkContext } from './config';

export type SupportedBalanceCurrency = Currencies.TON | Currencies.USDT | Currencies.WEB3;

export type AssetBalance = {
    owner_address: string;
    currency: SupportedBalanceCurrency;
    amount: string;
    amount_decimal: string;
    decimals: number;
    jetton_wallet_address?: string;
};

export type AggregatedAssetBalance = Omit<AssetBalance, 'owner_address'>;

export type WalletBalances = {
    owner_address: string;
    ton: AggregatedAssetBalance;
    usdt: AggregatedAssetBalance;
    web3: AggregatedAssetBalance;
};

const CURRENCY_DECIMALS: Record<SupportedBalanceCurrency, number> = {
    [Currencies.TON]: 9,
    [Currencies.USDT]: 6,
    [Currencies.WEB3]: 3
};

function formatAmountDecimal(amount: bigint, decimals: number): string {
    const sign = amount < 0n ? '-' : '';
    const normalizedAmount = amount < 0n ? -amount : amount;

    if (decimals === 0) {
        return `${sign}${normalizedAmount.toString()}`;
    }

    const base = 10n ** BigInt(decimals);
    const whole = normalizedAmount / base;
    const fraction = normalizedAmount % base;
    const fractionText = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');

    return fractionText.length > 0 ? `${sign}${whole.toString()}.${fractionText}` : `${sign}${whole.toString()}`;
}

function createAssetBalance(args: {
    ownerAddress: string;
    currency: SupportedBalanceCurrency;
    amount: bigint;
    jettonWalletAddress?: string;
}): AssetBalance {
    const decimals = CURRENCY_DECIMALS[args.currency];

    return {
        owner_address: args.ownerAddress,
        currency: args.currency,
        amount: args.amount.toString(),
        amount_decimal: formatAmountDecimal(args.amount, decimals),
        decimals,
        jetton_wallet_address: args.jettonWalletAddress
    };
}

async function getJettonWalletAddress(args: {
    context: WebdomSdkContext;
    ownerAddress: AddressLike;
    minterAddress: AddressLike;
    seqno: number;
}) {
    const tonClient = args.context.getTonClient();
    const ownerAddress = normalizeAddress(args.ownerAddress);
    const minterAddress = normalizeAddress(args.minterAddress);
    const response = await tonClient.runMethod(args.seqno, minterAddress, 'get_wallet_address', [
        {
            type: 'slice',
            cell: beginCell().storeAddress(ownerAddress).endCell()
        }
    ]);

    return response.reader.readAddress();
}

async function getTonBalanceAtSeqno(context: WebdomSdkContext, address: AddressLike, seqno: number) {
    const tonClient = context.getTonClient();
    const normalizedAddress = normalizeAddress(address);
    const account = await tonClient.getAccount(seqno, normalizedAddress);
    const amount = BigInt(account.account?.balance.coins ?? '0');

    return createAssetBalance({
        ownerAddress: normalizedAddress.toString(),
        currency: Currencies.TON,
        amount
    });
}

async function getJettonBalanceAtSeqno(args: {
    context: WebdomSdkContext;
    ownerAddress: AddressLike;
    currency: Currencies.USDT | Currencies.WEB3;
    minterAddress: AddressLike;
    seqno: number;
}) {
    const tonClient = args.context.getTonClient();
    const ownerAddress = normalizeAddress(args.ownerAddress);
    const jettonWalletAddress = await getJettonWalletAddress({
        context: args.context,
        ownerAddress,
        minterAddress: args.minterAddress,
        seqno: args.seqno
    });
    const account = await tonClient.getAccount(args.seqno, jettonWalletAddress);
    let amount = 0n;

    if (account.account?.state.type === 'active') {
        const response = await tonClient.runMethod(args.seqno, jettonWalletAddress, 'get_wallet_data', []);
        amount = response.reader.readBigNumber();
    }

    return createAssetBalance({
        ownerAddress: ownerAddress.toString(),
        currency: args.currency,
        amount,
        jettonWalletAddress: jettonWalletAddress.toString()
    });
}

export type WebdomBalances = ReturnType<typeof createBalanceClient>;

function omitOwnerAddress(balance: AssetBalance): AggregatedAssetBalance {
    const { owner_address: _ownerAddress, ...rest } = balance;
    return rest;
}

export function createBalanceClient(context: WebdomSdkContext) {
    return {
        async getTon(args: { address: AddressLike }) {
            const { last } = await context.getTonClient().getLastBlock();
            return getTonBalanceAtSeqno(context, args.address, last.seqno);
        },

        async getUsdt(args: { address: AddressLike }) {
            const { last } = await context.getTonClient().getLastBlock();
            return getJettonBalanceAtSeqno({
                context,
                ownerAddress: args.address,
                currency: Currencies.USDT,
                minterAddress: context.contracts.usdt,
                seqno: last.seqno
            });
        },

        async getWeb3(args: { address: AddressLike }) {
            const { last } = await context.getTonClient().getLastBlock();
            return getJettonBalanceAtSeqno({
                context,
                ownerAddress: args.address,
                currency: Currencies.WEB3,
                minterAddress: context.contracts.web3,
                seqno: last.seqno
            });
        },

        async getAll(args: { address: AddressLike }): Promise<WalletBalances> {
            const ownerAddress = normalizeAddress(args.address);
            const { last } = await context.getTonClient().getLastBlock();
            const [ton, usdt, web3] = await Promise.all([
                getTonBalanceAtSeqno(context, ownerAddress, last.seqno),
                getJettonBalanceAtSeqno({
                    context,
                    ownerAddress,
                    currency: Currencies.USDT,
                    minterAddress: context.contracts.usdt,
                    seqno: last.seqno
                }),
                getJettonBalanceAtSeqno({
                    context,
                    ownerAddress,
                    currency: Currencies.WEB3,
                    minterAddress: context.contracts.web3,
                    seqno: last.seqno
                })
            ]);

            return {
                owner_address: ownerAddress.toString(),
                ton: omitOwnerAddress(ton),
                usdt: omitOwnerAddress(usdt),
                web3: omitOwnerAddress(web3)
            };
        }
    };
}
