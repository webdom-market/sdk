import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const packageName = packageJson.name;
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'webdom-pack-verify-'));

async function run(command, args, cwd) {
    try {
        return await execFileAsync(command, args, { cwd });
    } catch (error) {
        const stdout = typeof error.stdout === 'string' && error.stdout.length > 0 ? `\nstdout:\n${error.stdout}` : '';
        const stderr = typeof error.stderr === 'string' && error.stderr.length > 0 ? `\nstderr:\n${error.stderr}` : '';
        throw new Error(`Command failed: ${command} ${args.join(' ')}${stdout}${stderr}`);
    }
}

try {
    const { stdout: packStdout } = await run('npm', ['pack', '--json', '--pack-destination', tempDir], rootDir);
    const [packResult] = JSON.parse(packStdout);
    const packPath = path.join(tempDir, packResult.filename);
    const consumerDir = path.join(tempDir, 'consumer');

    await mkdir(consumerDir, { recursive: true });
    await run('npm', ['init', '-y'], consumerDir);
    await run('npm', ['install', packPath, `typescript@${packageJson.devDependencies.typescript}`], consumerDir);

    await writeFile(
        path.join(consumerDir, 'index.ts'),
        [
            `import { createWebdomSdk, WebdomApiError } from '${packageName}';`,
            `import { createAgentApi } from '${packageName}/api';`,
            `import { signTonProof } from '${packageName}/auth';`,
            `import { createTxClient } from '${packageName}/tx';`,
            `import { Marketplace } from '${packageName}/contracts';`,
            `import type { Domain } from '${packageName}/types';`,
            '',
            'void createWebdomSdk;',
            'void WebdomApiError;',
            'void createAgentApi;',
            'void signTonProof;',
            'void createTxClient;',
            'void Marketplace;',
            'const domain = null as Domain | null;',
            'void domain;',
            ''
        ].join('\n')
    );

    await writeFile(
        path.join(consumerDir, 'tsconfig.json'),
        JSON.stringify({
            compilerOptions: {
                module: 'NodeNext',
                moduleResolution: 'NodeNext',
                noEmit: true,
                strict: true,
                target: 'ES2022'
            }
        }, null, 4)
    );

    await run('node', [
        '--input-type=module',
        '-e',
        [
            `const mod = await import('${packageName}');`,
            `const api = await import('${packageName}/api');`,
            `const auth = await import('${packageName}/auth');`,
            `const tx = await import('${packageName}/tx');`,
            `const contracts = await import('${packageName}/contracts');`,
            `const types = await import('${packageName}/types');`,
            `const cli = await import('${packageName}/cli');`,
            "if (typeof mod.createWebdomSdk !== 'function' || typeof mod.WebdomApiError !== 'function' || typeof api.createAgentApi !== 'function' || typeof auth.signTonProof !== 'function' || typeof tx.createTxClient !== 'function' || typeof contracts.Marketplace !== 'function' || typeof types !== 'object' || typeof cli.runCli !== 'function') {",
            "  throw new Error('Unexpected ESM export surface');",
            '}'
        ].join(' '),
    ], consumerDir);

    await run('node', [
        '-e',
        [
            `const mod = require('${packageName}');`,
            `const api = require('${packageName}/api');`,
            `const auth = require('${packageName}/auth');`,
            `const tx = require('${packageName}/tx');`,
            `const contracts = require('${packageName}/contracts');`,
            `const cli = require('${packageName}/cli');`,
            "if (typeof mod.createWebdomSdk !== 'function' || typeof mod.WebdomApiError !== 'function' || typeof api.createAgentApi !== 'function' || typeof auth.signTonProof !== 'function' || typeof tx.createTxClient !== 'function' || typeof contracts.Marketplace !== 'function' || typeof cli.runCli !== 'function') {",
            "  throw new Error('Unexpected CJS export surface');",
            '}'
        ].join(' '),
    ], consumerDir);

    await run(path.join(consumerDir, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.json'], consumerDir);
} finally {
    await rm(tempDir, { force: true, recursive: true });
}
