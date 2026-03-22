import { Currencies } from '../constants/currencies';

export function toNano(value: number, currency: Currencies): bigint {
    if (currency === Currencies.TON) {
        return BigInt(Math.ceil(value * 1e9));
    }
    if (currency === Currencies.USDT) {
        return BigInt(Math.ceil(value * 1e6));
    }
    if (currency === Currencies.WEB3) {
        return BigInt(Math.ceil(value * 1e3));
    }
    return BigInt(Math.ceil(value * 1e9));
}

export function fromNano(value: number | bigint, currency: Currencies): number {
    if (currency === Currencies.TON) {
        return Number(value) / 1e9;
    }
    if (currency === Currencies.USDT) {
        return Number(value) / 1e6;
    }
    if (currency === Currencies.WEB3) {
        return Number(value) / 1e3;
    }
    return Number(value) / 1e9;
}
