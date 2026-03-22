import type { WebdomSdkContext } from '../config';
import { createTransport } from './core/transport';
import { createRawAnalyticsApi } from './raw/analytics';
import { createRawAuthApi } from './raw/auth';
import { createRawCatalogApi } from './raw/catalog';
import { createRawDealsApi } from './raw/deals';
import { createRawDomainsApi } from './raw/domains';
import { createRawHistoryApi } from './raw/history';
import { createRawMarketplaceApi } from './raw/marketplace';
import { createRawOffersApi } from './raw/offers';
import { createRawUsersApi } from './raw/users';

export function createRawAgentApi(context: WebdomSdkContext) {
    const transport = createTransport(context);

    return {
        auth: createRawAuthApi(transport),
        catalog: createRawCatalogApi(transport),
        domains: createRawDomainsApi(transport),
        deals: createRawDealsApi(transport),
        offers: createRawOffersApi(transport),
        users: createRawUsersApi(transport),
        analytics: createRawAnalyticsApi(transport),
        marketplace: createRawMarketplaceApi(transport),
        history: createRawHistoryApi(transport)
    };
}

export type RawAgentApi = ReturnType<typeof createRawAgentApi>;
