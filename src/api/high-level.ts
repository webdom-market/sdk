import type {
    ListAuctionBidsParams,
    ListAvailableDomainLabelsParams,
    ListDealBidsParams,
    ListDealsParams,
    ListDomainTransactionsParams,
    ListDomainsParams,
    ListSalesParams,
    ListTopSalesParams,
    ListTransactionsParams,
    ListUserActivityParams,
    ListUserRankingsParams,
    SearchUsersParams,
    TonProofTokenExchangeRequest
} from '../generated/agent-api';
import type { RawAgentApi } from './raw';
import { unwrapData, unwrapPaginated } from './core/unwrap';

export function createAgentApi(raw: RawAgentApi) {
    return {
        auth: {
            async getTonProofPayload() {
                return unwrapData(await raw.auth.getTonProofPayload()).data;
            },
            async exchangeTonProofForToken(body: TonProofTokenExchangeRequest) {
                return unwrapData(await raw.auth.exchangeTonProofForToken(body)).data;
            },
            async revokeCurrentToken() {
                return unwrapData(await raw.auth.revokeCurrentToken()).data;
            }
        },
        catalog: {
            async listDomains(query: ListDomainsParams = {}) {
                return unwrapPaginated(await raw.catalog.listDomains(query));
            },
            async listAvailableDomainLabels(query: ListAvailableDomainLabelsParams) {
                const payload = await raw.catalog.listAvailableDomainLabels(query);
                return {
                    items: payload.data.items,
                    labels: payload.data.items.map((item) => item.label),
                    filterOptions: payload.data.filter_options,
                    pageInfo: {
                        nextCursor: payload.page_info.next_cursor,
                        hasMore: payload.page_info.has_more,
                    },
                    meta: {
                        requestId: payload.meta.request_id,
                        apiVersion: payload.meta.api_version,
                    },
                };
            },
            async listDeals(query: ListDealsParams = {}) {
                return unwrapPaginated(await raw.catalog.listDeals(query));
            }
        },
        domains: {
            async resolve(params: { domain_name: string }) {
                return unwrapData(await raw.domains.resolve(params)).data;
            },
            async backResolve(params: { address: string }) {
                return unwrapData(await raw.domains.backResolve(params)).data;
            },
            async get(params: { domain_name: string }) {
                return unwrapData(await raw.domains.get(params)).data;
            },
            async listTransactions(params: ListDomainTransactionsParams) {
                return unwrapPaginated(await raw.domains.listTransactions(params));
            }
        },
        deals: {
            async get(params: { deal_address: string }) {
                return unwrapData(await raw.deals.get(params)).data;
            },
            async listBids(params: ListDealBidsParams) {
                return unwrapPaginated(await raw.deals.listBids(params));
            }
        },
        offers: {
            async get(params: { offer_address: string }) {
                return unwrapData(await raw.offers.get(params)).data;
            },
            async getBest(params: { domain_name: string }) {
                return unwrapData(await raw.offers.getBest(params)).data;
            },
            async listMine() {
                return unwrapData(await raw.offers.listMine()).data;
            }
        },
        users: {
            async search(query: SearchUsersParams) {
                return unwrapPaginated(await raw.users.search(query));
            },
            async get(params: { address: string }) {
                return unwrapData(await raw.users.get(params)).data;
            },
            async listActivity(params: ListUserActivityParams) {
                return unwrapPaginated(await raw.users.listActivity(params));
            }
        },
        analytics: {
            async getMarketOverview(params: { domain_zone: 'ton' | 't.me' }) {
                return unwrapData(await raw.analytics.getMarketOverview(params)).data;
            },
            async getMarketCharts(params: { domain_zone: 'ton' | 't.me' }) {
                return unwrapData(await raw.analytics.getMarketCharts(params)).data;
            },
            async listTopSales(query: ListTopSalesParams) {
                return unwrapData(await raw.analytics.listTopSales(query)).data;
            },
            async listUserRankings(query: ListUserRankingsParams) {
                return unwrapData(await raw.analytics.listUserRankings(query)).data;
            },
            async getJettonPrices() {
                return unwrapData(await raw.analytics.getJettonPrices()).data;
            }
        },
        marketplace: {
            async getConfig() {
                return unwrapData(await raw.marketplace.getConfig()).data;
            }
        },
        history: {
            async listTransactions(query: ListTransactionsParams = {}) {
                return unwrapPaginated(await raw.history.listTransactions(query));
            },
            async listAuctionBids(query: ListAuctionBidsParams = {}) {
                return unwrapPaginated(await raw.history.listAuctionBids(query));
            },
            async listSales(query: ListSalesParams = {}) {
                return unwrapPaginated(await raw.history.listSales(query));
            }
        }
    };
}

export type WebdomApi = ReturnType<typeof createAgentApi>;
