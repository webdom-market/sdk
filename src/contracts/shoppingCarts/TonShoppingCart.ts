import type { Address, Cell, ContractProvider, DictionaryValue} from '@ton/core';
import { Dictionary, beginCell, contractAddress, toNano } from '@ton/core';

import { MessageInfo, DefaultContract } from '../imports/DefaultContract';
import { tonShoppingCartCode } from '../imports/codes';
import { OpCodes } from '../imports/constants';
import { packStateInit } from '../imports/dnsUtils';

export type ShoppingCartSwapInfo = {
    swapAmount: bigint;
    poolAddress: Address;
    requiredGas: bigint;
};

export function shoppingCartSwapInfoToCell(swapInfo?: ShoppingCartSwapInfo | null): Cell | null {
    if (!swapInfo) {
        return null;
    }
    return beginCell().storeCoins(swapInfo.swapAmount).storeAddress(swapInfo.poolAddress).storeCoins(swapInfo.requiredGas).endCell();
}

export function shoppingCartSwapInfoFromCell(cell?: Cell | null): ShoppingCartSwapInfo | null {
    if (!cell) {
        return null;
    }
    const slice = cell.beginParse();
    return {
        swapAmount: slice.loadCoins(),
        poolAddress: slice.loadAddress(),
        requiredGas: slice.loadCoins()
    };
}

export type DomainInfoValue = {
    transferred: boolean;
    saleContractAddress: Address;
    price: bigint;
    swapInfo?: ShoppingCartSwapInfo | null;
};

export function domainInfoValueParser(): DictionaryValue<DomainInfoValue> {
    return {
        serialize: (src, buidler) => {
            buidler
                .storeBit(src.transferred)
                .storeAddress(src.saleContractAddress)
                .storeCoins(src.price)
                .storeMaybeRef(shoppingCartSwapInfoToCell(src.swapInfo))
                .endCell();
        },
        parse: (src) => {
            return {
                transferred: src.loadBit(),
                saleContractAddress: src.loadAddress(),
                price: src.loadCoins(),
                swapInfo: shoppingCartSwapInfoFromCell(src.loadMaybeRef())
            };
        }
    };
}

export type ShoppingCartConfig = {
    ownerAddress: Address;
    state: number;
    domainsDict: Dictionary<Address, DomainInfoValue>;
    commission: bigint;
    domainsLeft: number;
};

export function shoppingCartConfigToCell(config: ShoppingCartConfig): Cell {
    return beginCell()
        .storeAddress(config.ownerAddress)
        .storeUint(config.state, 1)
        .storeDict(config.domainsDict, Dictionary.Keys.Address(), domainInfoValueParser())
        .storeCoins(config.commission)
        .storeUint(config.domainsLeft, 8)
        .endCell();
}

export class ShoppingCart extends DefaultContract {
    static readonly PURCHASE = toNano('0.05');
    static readonly DEPLOY = toNano('0.1');
    static readonly DEFAULT_COMMISSION = toNano('0.05');
    static readonly STATE_UNINIT = 0;
    static readonly STATE_ACTIVE = 1;

    static createFromAddress(address: Address) {
        return new ShoppingCart(address);
    }

    static createFromConfig(config: ShoppingCartConfig, code: Cell, workchain = 0) {
        const data = shoppingCartConfigToCell(config);
        const init = { code, data };
        return new ShoppingCart(contractAddress(workchain, init), init);
    }

    static getTotalCost(config: ShoppingCartConfig): bigint {
        let totalCost = ShoppingCart.DEPLOY;
        for (const domain of config.domainsDict.values()) {
            if (domain.swapInfo) {
                totalCost += ShoppingCart.PURCHASE + domain.swapInfo.requiredGas + domain.swapInfo.swapAmount + toNano('0.1'); // last -- dedust swap gas
            } else {
                totalCost += domain.price + ShoppingCart.PURCHASE;
            }
        }
        return totalCost;
    }

    static getDeployMessageInfo(ownerAddress: Address, domainsDict: Dictionary<Address, DomainInfoValue>): MessageInfo {
        const config = {
            ownerAddress,
            state: ShoppingCart.STATE_UNINIT,
            domainsDict,
            commission: ShoppingCart.DEFAULT_COMMISSION,
            domainsLeft: domainsDict.keys().length
        };
        const data = shoppingCartConfigToCell(config);
        const init = { code: tonShoppingCartCode, data };
        const totalCost = ShoppingCart.getTotalCost(config);
        return new MessageInfo(
            contractAddress(0, init),
            totalCost,
            beginCell().storeUint(OpCodes.FILL_UP_BALANCE, 32).storeUint(Math.floor(Date.now()), 64).endCell(),
            packStateInit(tonShoppingCartCode, data)
        );
    }

    async getStorageData(provider: ContractProvider): Promise<ShoppingCartConfig> {
        const { stack } = await provider.get('get_storage_data', []);
        return {
            ownerAddress: stack.readAddress(),
            state: stack.readNumber(),
            domainsDict: ((c: Cell) => c.beginParse().loadDictDirect(Dictionary.Keys.Address(), domainInfoValueParser()))(stack.readCell()),
            commission: stack.readBigNumber(),
            domainsLeft: stack.readNumber()
        };
    }
}
