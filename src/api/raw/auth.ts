import type { AgentApiTokenEnvelope, TonProofChallengeEnvelope, TonProofTokenExchangeRequest, TokenRevocationEnvelope } from '../../generated/agent-api';
import type { Transport } from '../core/transport';

export function createRawAuthApi(transport: Transport) {
    return {
        getTonProofPayload(): Promise<TonProofChallengeEnvelope> {
            return transport.get('/auth/ton-proof/payload');
        },
        exchangeTonProofForToken(body: TonProofTokenExchangeRequest): Promise<AgentApiTokenEnvelope> {
            return transport.post('/auth/ton-proof/tokens', body);
        },
        revokeCurrentToken(): Promise<TokenRevocationEnvelope> {
            return transport.delete('/auth/tokens/current', 'required');
        }
    };
}
