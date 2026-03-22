import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sdkSpecPath = path.join(rootDir, 'openapi', 'agent-api-openapi.yaml');
const mode = process.argv.includes('--copy') ? 'copy' : 'check';
const strict = process.argv.includes('--strict') || process.env.WEBDOM_OPENAPI_SYNC_STRICT === '1';
const defaultSourceUrl = 'https://webdom.market/api/docs/agent-api/openapi.yaml';
const sourceUrl = process.env.WEBDOM_BACK_OPENAPI_URL || defaultSourceUrl;
const sourceFilePath = process.env.WEBDOM_BACK_OPENAPI_FILE || null;

async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function readSourceSpec() {
    if (sourceFilePath) {
        if (!await fileExists(sourceFilePath)) {
            throw new Error(`Backend OpenAPI source file not found: ${sourceFilePath}`);
        }

        const source = await readFile(sourceFilePath, 'utf8');
        return { source, label: sourceFilePath };
    }

    const response = await fetch(sourceUrl, {
        headers: {
            accept: 'application/yaml, text/yaml, text/plain;q=0.9, */*;q=0.1'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch backend OpenAPI source: ${sourceUrl} (${response.status} ${response.statusText})`);
    }

    const source = await response.text();
    if (!source.trimStart().startsWith('openapi:')) {
        throw new Error(`Fetched backend OpenAPI source does not look like YAML OpenAPI: ${sourceUrl}`);
    }

    return { source, label: sourceUrl };
}

let backendSpec;
let sourceLabel;

try {
    ({ source: backendSpec, label: sourceLabel } = await readSourceSpec());
} catch (error) {
    if (strict) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }

    console.warn(`${error instanceof Error ? error.message : String(error)} Skipping ${mode}.`);
    process.exit(0);
}

if (mode === 'copy') {
    await writeFile(sdkSpecPath, backendSpec);
    process.stdout.write(`Synced ${path.relative(rootDir, sdkSpecPath)} from ${sourceLabel}\n`);
    process.exit(0);
}

const sdkSpec = await readFile(sdkSpecPath, 'utf8');

if (backendSpec !== sdkSpec) {
    console.error([
        'SDK OpenAPI snapshot is out of sync with backend OpenAPI source.',
        `Source: ${sourceLabel}`,
        `SDK: ${sdkSpecPath}`,
        'Run `npm run openapi:sync` and commit the updated snapshot.'
    ].join('\n'));
    process.exit(1);
}

process.stdout.write(`OpenAPI snapshot matches backend source: ${sourceLabel}\n`);
