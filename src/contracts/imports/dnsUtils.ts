import type { Address, Cell} from '@ton/core';
import { beginCell } from '@ton/core';
import { sha256 } from '@ton/crypto';

import { TG_USERNAMES_CODE, TON_DOMAINS_CODE } from './codes';
import { Addresses, ONE_TON } from './constants';

export function packStateInit(code: Cell, data: Cell): Cell {
    return beginCell().storeUint(0, 2).storeMaybeRef(code).storeMaybeRef(data).storeUint(0, 1).endCell();
}

export function getAddressByStateInit(stateInit: Cell): Address {
    return beginCell()
        .storeUint(1024, 11)
        .storeUint(BigInt('0x' + stateInit.hash().toString('hex')), 256)
        .endCell()
        .beginParse()
        .loadAddress();
}

export function getIndexByDomainName(domainName: string): bigint {
    return BigInt('0x' + beginCell().storeStringTail(domainName).endCell().hash().toString('hex'));
}

export async function getAddressByDomainName(domainName: string): Promise<Address> {
    let domainData: Cell;
    let domainCode: Cell;
    if (domainName.includes('.t.me')) {
        domainName = domainName.split('.t.me')[0]!;
        const domainIndex = BigInt('0x' + (await sha256(domainName)).toString('hex'));
        domainData = beginCell()
            .storeRef(beginCell().storeUint(domainIndex, 256).storeAddress(Addresses.TG_USERNAMES_COLLECTION).endCell())
            .storeUint(0, 1)
            .endCell();
        domainCode = TG_USERNAMES_CODE;
    } else {
        domainName = domainName.toLowerCase().split('.ton')[0]!;
        const domainIndex = getIndexByDomainName(domainName);
        domainData = beginCell().storeUint(domainIndex, 256).storeAddress(Addresses.TON_DNS_COLLECTION).endCell();
        domainCode = TON_DOMAINS_CODE;
    }
    return getAddressByStateInit(packStateInit(domainCode, domainData));
}

export function getMinPrice(domainLength: number) {
    if (domainLength < 4 || domainLength > 126) {
        throw new Error('Domain length must be between 4 and 126 characters');
    }
    if (domainLength === 4) {
        return 100n * ONE_TON;
    }
    if (domainLength === 5) {
        return 50n * ONE_TON;
    }
    if (domainLength === 6) {
        return 40n * ONE_TON;
    }
    if (domainLength === 7) {
        return 30n * ONE_TON;
    }
    if (domainLength === 8) {
        return 20n * ONE_TON;
    }
    if (domainLength === 9) {
        return 10n * ONE_TON;
    }
    if (domainLength === 10) {
        return 5n * ONE_TON;
    }
    return 1n * ONE_TON;
}
