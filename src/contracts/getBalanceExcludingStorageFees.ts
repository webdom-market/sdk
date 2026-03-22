import type { Address, TonClient4 } from '@ton/ton';

type TonClientAccount = {
    balance: {
        coins: string;
        currencies: Record<string, string>;
    };
    state:
        | {
            type: 'uninit';
        }
        | {
            data: string | null;
            code: string | null;
            type: 'active';
        }
        | {
            type: 'frozen';
            stateHash: string;
        };
    last: {
        lt: string;
        hash: string;
    } | null;
    storageStat: {
        lastPaid: number;
        duePayment: string | null;
        used: {
            bits: number;
            cells: number;
            publicCells?: number | undefined;
        };
    } | null;
};

export function getStorageFee(account: TonClientAccount) {
    if (account.state.type !== 'active') {
        return 0n;
    }
    return (
        (BigInt(account.storageStat!.used.bits + account.storageStat!.used.cells * 500) *
            BigInt(Math.ceil(Date.now() / 1000) - account.storageStat!.lastPaid)) /
            2n ** 16n
    );
}

export async function getBalanceExcludingStorageFees(tonClient: TonClient4, contractAddress: Address, lastBlockSeqno?: number) {
    if (!lastBlockSeqno) {
        lastBlockSeqno = (await tonClient.getLastBlock()).last.seqno;
    }
    const account = (await tonClient.getAccount(lastBlockSeqno, contractAddress)).account!;
    return BigInt(account.balance.coins) - getStorageFee(account);
}
