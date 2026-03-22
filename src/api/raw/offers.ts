import type { BestOfferEnvelope, MyOffersEnvelope, OfferEnvelope } from '../../generated/agent-api';
import type { Transport } from '../core/transport';

export function createRawOffersApi(transport: Transport) {
    return {
        get(params: { offer_address: string }): Promise<OfferEnvelope> {
            return transport.get(`/offers/${encodeURIComponent(params.offer_address)}`);
        },
        getBest(params: { domain_name: string }): Promise<BestOfferEnvelope> {
            return transport.get('/offers/best', params);
        },
        listMine(): Promise<MyOffersEnvelope> {
            return transport.get('/offers/my', undefined, 'required');
        }
    };
}
