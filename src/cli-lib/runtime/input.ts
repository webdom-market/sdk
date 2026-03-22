import type { CliCommandDefinition, CliParamDefinition, CliPrimitiveType } from '../types';
import { toObjectParams } from './args';

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildPositionalParams(command: CliCommandDefinition, positionals: string[]) {
    const params: Record<string, unknown> = {};
    const indexedParams = command.params
        .filter((param) => param.positionalIndex !== undefined)
        .sort((left, right) => (left.positionalIndex ?? 0) - (right.positionalIndex ?? 0));

    for (const param of indexedParams) {
        if (param.positionalIndex !== undefined && positionals[param.positionalIndex] !== undefined) {
            params[param.name] = positionals[param.positionalIndex];
        }
    }

    const expectedPositionals = indexedParams.length;
    if (positionals.length > expectedPositionals) {
        throw new Error(`Unexpected positional arguments for ${command.name}: ${positionals.slice(expectedPositionals).join(' ')}`);
    }

    return params;
}

function normalizeParamLookup(command: CliCommandDefinition) {
    const lookup = new Map<string, CliParamDefinition>();

    for (const param of command.params) {
        const keys = [param.name, ...(param.aliases ?? [])];
        for (const key of keys) {
            lookup.set(key, param);
            lookup.set(key.replace(/-/g, '_'), param);
        }
    }

    return lookup;
}

function coerceBoolean(value: unknown, fieldName: string) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
    }

    throw new Error(`${fieldName} must be a boolean`);
}

function coerceNumber(value: unknown, fieldName: string) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    throw new Error(`${fieldName} must be a number`);
}

function coerceBigInt(value: unknown, fieldName: string) {
    if (typeof value === 'bigint') {
        return value;
    }
    if (typeof value === 'number' && Number.isInteger(value)) {
        return BigInt(value);
    }
    if (typeof value === 'string' && /^-?\d+$/.test(value)) {
        return BigInt(value);
    }

    throw new Error(`${fieldName} must be an integer`);
}

function coerceJson(value: unknown, fieldName: string) {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`${fieldName} must be valid JSON: ${message}`);
        }
    }

    return value;
}

function coerceValueByType(type: CliPrimitiveType, value: unknown, fieldName: string) {
    if (value === undefined) {
        return undefined;
    }

    switch (type) {
        case 'string':
            return typeof value === 'string' ? value : String(value);
        case 'number':
            return coerceNumber(value, fieldName);
        case 'boolean':
            return coerceBoolean(value, fieldName);
        case 'bigint':
            return coerceBigInt(value, fieldName);
        case 'json':
            return coerceJson(value, fieldName);
        default:
            return value;
    }
}

function validateEnum(param: CliParamDefinition, value: unknown) {
    if (!param.enum) {
        return;
    }

    if (param.array) {
        for (const item of value as unknown[]) {
            if (!param.enum.includes(String(item))) {
                throw new Error(`${param.name} item must be one of: ${param.enum.join(', ')}`);
            }
        }
        return;
    }

    if (!param.enum.includes(String(value))) {
        throw new Error(`${param.name} must be one of: ${param.enum.join(', ')}`);
    }
}

function normalizeCommandInput(command: CliCommandDefinition, rawInput: Record<string, unknown>) {
    const lookup = normalizeParamLookup(command);
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(rawInput)) {
        if (value === undefined) {
            continue;
        }

        const param = lookup.get(key);
        if (!param) {
            throw new Error(`Unknown parameter "${key}" for command ${command.name}`);
        }

        const coerced = param.array
            ? (Array.isArray(value) ? value : [value]).map((item) => coerceValueByType(param.type, item, param.name))
            : coerceValueByType(param.type, value, param.name);
        validateEnum(param, coerced);
        normalized[param.name] = coerced;
    }

    if (command.name === 'auth.authenticate') {
        if (!normalized.wallet_address && !normalized.wallet_version) {
            normalized.wallet_version = 'auto';
        }
        if (normalized.wallet_address && normalized.wallet_version === 'auto') {
            delete normalized.wallet_version;
        }
        if (normalized.mnemonic === undefined && normalized.private_key === undefined) {
            throw new Error(
                'auth.authenticate requires mnemonic or private_key via flags, --json/--input, or ENV (WEBDOM_WALLET_MNEMONIC / WEBDOM_WALLET_PRIVATE_KEY)'
            );
        }
    }

    for (const param of command.params) {
        if (!param.required) {
            continue;
        }
        if (normalized[param.name] === undefined) {
            throw new Error(`Missing required parameter "${param.name}" for command ${command.name}`);
        }
    }

    return normalized;
}

export function prepareCommandInput(
    command: CliCommandDefinition,
    positionals: string[],
    flags: Record<string, string | boolean | Array<string | boolean>>,
    jsonInput: unknown,
    defaultParams: Record<string, unknown>
) {
    const flagParams = toObjectParams(flags);
    const positionalParams = buildPositionalParams(command, positionals);

    let inputParams: Record<string, unknown> = {};
    if (jsonInput !== undefined) {
        if (command.acceptsInput === 'none') {
            throw new Error(`${command.name} does not accept --json or --input`);
        }

        if (isPlainObject(jsonInput)) {
            inputParams = jsonInput;
        } else if (command.acceptsInput === 'scalar') {
            const scalarParam = command.params[0];
            if (!scalarParam) {
                throw new Error(`${command.name} does not accept scalar input`);
            }
            inputParams = {
                [scalarParam.name]: jsonInput
            };
        } else {
            throw new Error(`${command.name} expects object-shaped JSON input`);
        }
    }

    const mergedInput = {
        ...defaultParams,
        ...inputParams,
        ...positionalParams,
        ...flagParams
    };

    return normalizeCommandInput(command, mergedInput);
}

function parseSelectPath(pathValue: string) {
    const normalized = pathValue.replace(/\[(\d+)\]/g, '.$1');
    return normalized.split('.').filter(Boolean);
}

export function selectResultValue(result: unknown, pathValue: string) {
    let current = result as Record<string, unknown> | unknown[];

    for (const segment of parseSelectPath(pathValue)) {
        if (Array.isArray(current)) {
            const index = Number(segment);
            if (!Number.isInteger(index) || current[index] === undefined) {
                throw new Error(`Selection path not found: ${pathValue}`);
            }
            current = current[index] as Record<string, unknown>;
            continue;
        }

        if (!isPlainObject(current) || !(segment in current)) {
            throw new Error(`Selection path not found: ${pathValue}`);
        }
        current = current[segment] as Record<string, unknown>;
    }

    return current;
}
