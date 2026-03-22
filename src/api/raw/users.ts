import type { ListUserActivityParams, SearchUsersParams, TransactionListEnvelope, UserEnvelope, UserListEnvelope } from '../../generated/agent-api';
import type { Transport } from '../core/transport';

export function createRawUsersApi(transport: Transport) {
    return {
        search(query: SearchUsersParams): Promise<UserListEnvelope> {
            return transport.get('/users/search', query);
        },
        get(params: { address: string }): Promise<UserEnvelope> {
            return transport.get(`/users/${encodeURIComponent(params.address)}`, undefined, 'optional');
        },
        listActivity(params: ListUserActivityParams): Promise<TransactionListEnvelope> {
            const { address, ...query } = params;
            return transport.get(`/users/${encodeURIComponent(address)}/activity`, query);
        }
    };
}
