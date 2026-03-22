import type { BackResolveEnvelope, DomainEnvelope, ListDomainTransactionsParams, ResolveEnvelope, TransactionListEnvelope } from '../../generated/agent-api';
import type { Transport } from '../core/transport';

export function createRawDomainsApi(transport: Transport) {
    return {
        resolve(params: { domain_name: string }): Promise<ResolveEnvelope> {
            return transport.get('/domains/resolve', params);
        },
        backResolve(params: { address: string }): Promise<BackResolveEnvelope> {
            return transport.get('/domains/back-resolve', params);
        },
        get(params: { domain_name: string }): Promise<DomainEnvelope> {
            return transport.get(`/domains/${encodeURIComponent(params.domain_name)}`);
        },
        listTransactions(params: ListDomainTransactionsParams): Promise<TransactionListEnvelope> {
            const { domain_name, ...query } = params;
            return transport.get(`/domains/${encodeURIComponent(domain_name)}/history`, query);
        }
    };
}
