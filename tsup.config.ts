import { defineConfig } from 'tsup';

export default defineConfig({
    clean: true,
    dts: true,
    entry: {
        index: 'src/index.ts',
        cli: 'src/cli.ts',
        'api/index': 'src/api/index.ts',
        'auth/index': 'src/auth/index.ts',
        'tx/index': 'src/tx/index.ts',
        'contracts/index': 'src/contracts/index.ts',
        'types/index': 'src/types/index.ts'
    },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    sourcemap: true,
    splitting: false,
    target: 'es2022'
});
