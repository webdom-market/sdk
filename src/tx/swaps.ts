import type { Cell } from '@ton/core';

import type { AddressLike } from '../config';
import { DomainSwap, Marketplace } from '../contracts';
import type { TxContext } from './shared';
import {
    getMarketplaceDeployConfig,
    parseRequiredBigInt,
    parseAddress,
    prepareSingle
} from './shared';

export function createSwapTransactions(context: TxContext) {
    return {
        async deployDomainSwap(args: {
            leftDomainAddresses: AddressLike[];
            leftPaymentTotal: bigint;
            rightOwnerAddress: AddressLike;
            rightDomainAddresses: AddressLike[];
            rightPaymentTotal: bigint;
            deployFee?: bigint;
            completionCommission?: bigint;
            validUntil: number;
            discountCell?: Cell | null;
            queryId?: number;
            domainNames?: string[];
        }) {
            let deployFee = args.deployFee;
            let completionCommission = args.completionCommission;

            if (deployFee === undefined || completionCommission === undefined) {
                const deployConfig = await getMarketplaceDeployConfig(context, 'multiple_domain_swap');
                deployFee ??= parseRequiredBigInt(
                    deployConfig.deploy_fee?.amount,
                    'Marketplace config for "multiple_domain_swap" does not provide deploy_fee'
                );
                completionCommission ??= parseRequiredBigInt(
                    deployConfig.completion_commission?.amount,
                    'Marketplace config for "multiple_domain_swap" does not provide completion_commission'
                );
            }

            return prepareSingle(
                'DeployDomainSwap',
                Marketplace.getDeployDomainSwapMessageInfo(
                    args.leftDomainAddresses.map(parseAddress),
                    args.leftPaymentTotal,
                    parseAddress(args.rightOwnerAddress),
                    args.rightDomainAddresses.map(parseAddress),
                    args.rightPaymentTotal,
                    deployFee,
                    completionCommission,
                    args.validUntil,
                    args.discountCell ?? null,
                    args.queryId ?? 0,
                    context.contracts.marketplace
                ),
                {
                    queryId: args.queryId,
                    domainNames: args.domainNames
                }
            );
        },

        async transferDomain(args: {
            userAddress: AddressLike;
            domainAddress: AddressLike;
            domainSwapAddress: AddressLike;
            payment?: bigint;
            queryId?: number;
            isTgUsername?: boolean;
        }) {
            const message = await DomainSwap.getTransferDomainMessageInfo(
                parseAddress(args.userAddress),
                parseAddress(args.domainAddress),
                parseAddress(args.domainSwapAddress),
                args.payment ?? 0n,
                args.queryId ?? 0,
                args.isTgUsername ?? false
            );
            return prepareSingle('TransferDomainToDomainSwap', message, {
                queryId: args.queryId,
                contractAddress: args.domainSwapAddress
            });
        },

        addPayment(args: { domainSwapAddress: AddressLike; value: bigint }) {
            return prepareSingle(
                'AddDomainSwapPayment',
                DomainSwap.addPaymentMessageInfo(parseAddress(args.domainSwapAddress), args.value),
                { contractAddress: args.domainSwapAddress }
            );
        },

        changeValidUntil(args: { domainSwapAddress: AddressLike; validUntil: number; queryId?: number }) {
            return prepareSingle(
                'ChangeDomainSwapValidUntil',
                DomainSwap.changeValidUntilMessageInfo(parseAddress(args.domainSwapAddress), args.validUntil, args.queryId ?? 0),
                {
                    queryId: args.queryId,
                    contractAddress: args.domainSwapAddress
                }
            );
        },

        cancel(args: { domainSwapAddress: AddressLike; domainsReceived: number | bigint | boolean }) {
            return prepareSingle(
                'CancelDomainSwap',
                DomainSwap.getCancelDealMessageInfo(parseAddress(args.domainSwapAddress), args.domainsReceived),
                { contractAddress: args.domainSwapAddress }
            );
        }
    };
}
