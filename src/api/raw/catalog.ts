import type { DealListEnvelope, DomainListEnvelope, ListDealsParams, ListDomainsParams } from '../../generated/agent-api';
import type { Transport } from '../core/transport';

export function createRawCatalogApi(transport: Transport) {
    return {
        listDomains(query: ListDomainsParams = {}): Promise<DomainListEnvelope> {
            return transport.get('/catalog/domains', query);
        },
        listDeals(query: ListDealsParams = {}): Promise<DealListEnvelope> {
            return transport.get('/catalog/deals', query);
        }
    };
}
