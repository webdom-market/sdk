import * as rootExports from '../src';
import * as apiExports from '../src/api';
import * as authExports from '../src/auth';
import * as contractExports from '../src/contracts';
import * as txExports from '../src/tx';
import * as typeExports from '../src/types';

import { describe, expect, it } from 'vitest';

describe('exports', () => {
    it('keeps the root export focused on the primary sdk surface', () => {
        expect(rootExports.createWebdomSdk).toBeTypeOf('function');
        expect(rootExports.WebdomApiError).toBeDefined();
        expect('createAgentApi' in rootExports).toBe(false);
        expect('signTonProof' in rootExports).toBe(false);
    });

    it('exposes advanced surfaces through explicit subpath entrypoints', () => {
        expect(apiExports.createAgentApi).toBeTypeOf('function');
        expect(authExports.signTonProof).toBeTypeOf('function');
        expect(txExports.createTxClient).toBeTypeOf('function');
        expect(contractExports.Marketplace).toBeDefined();
        expect(typeExports).toBeDefined();
    });
});
