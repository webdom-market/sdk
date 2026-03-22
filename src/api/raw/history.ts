import type { BidListEnvelope, ListAuctionBidsParams, ListSalesParams, ListTransactionsParams, TransactionListEnvelope } from '../../generated/agent-api';
import type { Transport } from '../core/transport';

export function createRawHistoryApi(transport: Transport) {
    return {
        listTransactions(query: ListTransactionsParams = {}): Promise<TransactionListEnvelope> {
            return transport.get('/history/transactions', query);
        },
        listAuctionBids(query: ListAuctionBidsParams = {}): Promise<BidListEnvelope> {
            return transport.get('/history/auctions/bids', query);
        },
        listSales(query: ListSalesParams = {}): Promise<TransactionListEnvelope> {
            return transport.get('/history/sales', query);
        }
    };
}
