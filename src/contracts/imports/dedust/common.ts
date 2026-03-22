import type { Builder, Slice, Writable} from '@ton/core';
import { Address, beginCell } from '@ton/core';

export enum AssetType {
    NATIVE = 0b0000,
    JETTON = 0b0001
}

export class AssetError extends Error {
    static notSupported() {
        return new AssetError('Asset is not supported.');
    }
}

export enum ReadinessStatus {
    NOT_DEPLOYED = 'not-deployed',
    NOT_READY = 'not-ready',
    READY = 'ready'
}

export enum ContractType {
    VAULT = 1,
    POOL = 2,
    LIQUIDITY_DEPOSIT = 3
}

export class Asset implements Writable {
    private constructor(
        readonly type: AssetType,
        readonly address?: Address
    ) {}

    static native() {
        return new Asset(AssetType.NATIVE);
    }

    static jetton(minter: Address) {
        return new Asset(AssetType.JETTON, minter);
    }

    static fromSlice(src: Slice): Asset {
        const assetType = src.loadUint(4);
        switch (assetType) {
            case AssetType.NATIVE:
                return Asset.native();

            case AssetType.JETTON:
                return Asset.jetton(new Address(src.loadInt(8), src.loadBuffer(32)));

            default:
                throw AssetError.notSupported();
        }
    }

    equals(other: Asset) {
        return this.toString() === other.toString();
    }

    writeTo(builder: Builder) {
        switch (this.type) {
            case AssetType.NATIVE:
                builder.storeUint(AssetType.NATIVE, 4);
                break;

            case AssetType.JETTON:
                builder.storeUint(AssetType.JETTON, 4).storeInt(this.address!.workChain!, 8).storeBuffer(this.address!.hash!);
                break;

            default:
                throw AssetError.notSupported();
        }
    }

    toSlice(): Slice {
        return beginCell().storeWritable(this).endCell().beginParse();
    }

    toString() {
        switch (this.type) {
            case AssetType.NATIVE:
                return `native`;

            case AssetType.JETTON:
                return `jetton:${this.address!.toString()}`;

            default:
                throw AssetError.notSupported();
        }
    }
}
