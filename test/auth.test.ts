import { describe, expect, it } from 'vitest';

import { createWebdomSdk } from '../src';
import { TEST_ADDRESS, TEST_PRIVATE_KEY, TEST_PUBLIC_KEY } from './helpers';

describe('ton proof helpers', () => {
    it('builds token exchange requests without global config', async () => {
        const sdk = createWebdomSdk({
            apiBaseUrl: 'https://market.example/api'
        });

        const request = await sdk.auth.buildTokenExchangeRequest({
            challenge: {
                challenge_id: 'challenge-1',
                payload: 'payload-1'
            },
            walletAddress: TEST_ADDRESS,
            privateKey: TEST_PRIVATE_KEY,
            publicKey: TEST_PUBLIC_KEY
        });

        expect(request.challenge_id).toBe('challenge-1');
        expect(request.wallet_address).toBe(TEST_ADDRESS);
        expect(request.wallet_public_key).toBe(TEST_PUBLIC_KEY);
        expect(request.proof.payload).toBe('payload-1');
        expect(request.proof.domain.value).toBe('market.example');
    });

    it('rejects conflicting mnemonic and privateKey inputs', async () => {
        const sdk = createWebdomSdk({
            apiBaseUrl: 'https://market.example/api'
        });

        await expect(
            sdk.auth.buildTokenExchangeRequest({
                challenge: {
                    challenge_id: 'challenge-1',
                    payload: 'payload-1'
                },
                walletAddress: TEST_ADDRESS,
                mnemonic: 'word1 word2 word3',
                privateKey: TEST_PRIVATE_KEY
            })
        ).rejects.toThrow('Provide exactly one of mnemonic or privateKey');
    });

    it('rejects malformed privateKey strings before crypto parsing', async () => {
        const sdk = createWebdomSdk({
            apiBaseUrl: 'https://market.example/api'
        });

        await expect(
            sdk.auth.buildTokenExchangeRequest({
                challenge: {
                    challenge_id: 'challenge-1',
                    payload: 'payload-1'
                },
                walletAddress: TEST_ADDRESS,
                privateKey: 'not-a-valid-key!!'
            })
        ).rejects.toThrow('privateKey must be a valid hex, base64, or base64url string');
    });

    it('rejects valid-looking publicKey encodings with the wrong decoded length', async () => {
        const sdk = createWebdomSdk({
            apiBaseUrl: 'https://market.example/api'
        });
        const invalidPublicKey = Buffer.alloc(31, 1).toString('base64url');

        await expect(
            sdk.auth.buildTokenExchangeRequest({
                challenge: {
                    challenge_id: 'challenge-1',
                    payload: 'payload-1'
                },
                walletAddress: TEST_ADDRESS,
                privateKey: TEST_PRIVATE_KEY,
                publicKey: invalidPublicKey
            })
        ).rejects.toThrow('publicKey must decode to 32 bytes');
    });
});
