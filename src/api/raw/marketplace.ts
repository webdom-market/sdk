import type { MarketplaceConfigEnvelope } from '../../generated/agent-api';
import type { Transport } from '../core/transport';

export function createRawMarketplaceApi(transport: Transport) {
    return {
        getConfig(): Promise<MarketplaceConfigEnvelope> {
            return transport.get('/marketplace/config');
        }
    };
}
