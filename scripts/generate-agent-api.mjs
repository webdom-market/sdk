import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import openapiTS, { astToString } from 'openapi-typescript';
import { parse } from 'yaml';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specPath = path.join(rootDir, 'openapi', 'agent-api-openapi.yaml');
const outputPath = path.join(rootDir, 'src', 'generated', 'agent-api.ts');
const checkMode = process.argv.includes('--check');

const specSource = await readFile(specPath, 'utf8');
const openapiDocument = parse(specSource) ?? {};
const componentParameters = openapiDocument.components?.parameters ?? {};
const schemaNames = Object.keys(openapiDocument.components?.schemas ?? {})
    .filter((name) => name !== 'BaseEnvelope' && /^[$A-Z_][0-9A-Z_$]*$/i.test(name))
    .sort((left, right) => left.localeCompare(right));
const operationParamAliases = Object.values(openapiDocument.paths ?? {})
    .flatMap((pathItem) => Object.values(pathItem ?? {}))
    .filter((operation) => typeof operation?.operationId === 'string')
    .map((operation) => {
        const operationId = operation.operationId;
        const resolvedParameters = (operation.parameters ?? []).map((parameter) => {
            if (parameter?.$ref) {
                const parameterName = parameter.$ref.split('/').pop();
                return parameterName ? componentParameters[parameterName] : null;
            }

            return parameter;
        });
        const hasRequestParams = resolvedParameters.some((parameter) => parameter?.in === 'query' || parameter?.in === 'path');

        if (!hasRequestParams) {
            return null;
        }

        const aliasName = `${operationId[0].toUpperCase()}${operationId.slice(1)}Params`;
        return `export type ${aliasName} = MergeOperationParams<operations["${operationId}"]["parameters"]["path"], operations["${operationId}"]["parameters"]["query"]>;`;
    })
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

const schemaAst = await openapiTS(pathToFileURL(specPath), {
    alphabetize: true
});

const generatedSource = `${[
    '/**',
    ' * This file is auto-generated from openapi/agent-api-openapi.yaml.',
    ' * Run `npm run openapi:generate` after updating the OpenAPI spec snapshot.',
    ' */',
    '',
    astToString(schemaAst).trim(),
    '',
    ...schemaNames.map((name) => `export type ${name} = components["schemas"]["${name}"];`),
    '',
    'export type BaseEnvelope<T> = components["schemas"]["BaseEnvelope"] & {',
    '    data: T;',
    '};',
    'export type PaginatedEnvelope<T> = BaseEnvelope<{ items: T[] }> & {',
    '    page_info: PageInfo;',
    '};',
    'type OperationParamsPart<T> = [NonNullable<T>] extends [never] ? Record<never, never> : NonNullable<T>;',
    'type Simplify<T> = { [K in keyof T]: T[K] } & {};',
    'type MergeOperationParams<TPath, TQuery> = Simplify<OperationParamsPart<TPath> & OperationParamsPart<TQuery>>;',
    '',
    ...operationParamAliases,
    ''
].join('\n')}`;

if (checkMode) {
    const currentSource = await readFile(outputPath, 'utf8');

    if (currentSource !== generatedSource) {
        console.error(`OpenAPI generated types are out of sync: ${path.relative(rootDir, outputPath)}`);
        console.error('Run `npm run openapi:generate` and commit the updated generated file.');
        process.exit(1);
    }
} else {
    await writeFile(outputPath, generatedSource);
}
