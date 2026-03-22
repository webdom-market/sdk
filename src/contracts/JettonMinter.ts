import type { Address, Cell, Contract, ContractProvider} from '@ton/core';
import { beginCell } from '@ton/core';

export class JettonMinter implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new JettonMinter(address);
    }

    async getWalletAddress(provider: ContractProvider, owner: Address): Promise<Address> {
        const res = await provider.get('get_wallet_address', [{ type: 'slice', cell: beginCell().storeAddress(owner).endCell() }]);
        return res.stack.readAddress();
    }

    async getJettonData(provider: ContractProvider) {
        const res = await provider.get('get_jetton_data', []);
        const totalSupply = res.stack.readBigNumber();
        const mintable = res.stack.readBoolean();
        const adminAddress = res.stack.readAddress();
        const content = res.stack.readCell();
        const walletCode = res.stack.readCell();
        return {
            totalSupply,
            mintable,
            adminAddress,
            content,
            walletCode
        };
    }

    async getTotalSupply(provider: ContractProvider) {
        const res = await this.getJettonData(provider);
        return res.totalSupply;
    }

    async getAdminAddress(provider: ContractProvider) {
        const res = await this.getJettonData(provider);
        return res.adminAddress;
    }

    async getContent(provider: ContractProvider) {
        const res = await this.getJettonData(provider);
        return res.content;
    }
}
