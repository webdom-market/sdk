import type {
    JettonPricesEnvelope,
    ListTopSalesParams,
    ListUserRankingsParams,
    MarketChartsEnvelope,
    MarketOverviewEnvelope,
    TopSaleListEnvelope,
    UserRankingEnvelope
} from '../../generated/agent-api';
import type { Transport } from '../core/transport';

export function createRawAnalyticsApi(transport: Transport) {
    return {
        getMarketOverview(params: { domain_zone: 'ton' | 't.me' }): Promise<MarketOverviewEnvelope> {
            return transport.get('/analytics/market/overview', params);
        },
        getMarketCharts(params: { domain_zone: 'ton' | 't.me' }): Promise<MarketChartsEnvelope> {
            return transport.get('/analytics/market/charts', params);
        },
        listTopSales(query: ListTopSalesParams): Promise<TopSaleListEnvelope> {
            return transport.get('/analytics/market/top-sales', query);
        },
        listUserRankings(query: ListUserRankingsParams): Promise<UserRankingEnvelope> {
            return transport.get('/analytics/users/rankings', query);
        },
        getJettonPrices(): Promise<JettonPricesEnvelope> {
            return transport.get('/analytics/prices/jettons');
        }
    };
}
