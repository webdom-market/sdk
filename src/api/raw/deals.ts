import type { BidListEnvelope, DealEnvelope, ListDealBidsParams } from '../../generated/agent-api';
import type { Transport } from '../core/transport';

export function createRawDealsApi(transport: Transport) {
    return {
        get(params: { deal_address: string }): Promise<DealEnvelope> {
            return transport.get(`/deals/${encodeURIComponent(params.deal_address)}`);
        },
        listBids(params: ListDealBidsParams): Promise<BidListEnvelope> {
            const { deal_address, ...query } = params;
            return transport.get(`/deals/${encodeURIComponent(deal_address)}/bids`, query);
        }
    };
}
