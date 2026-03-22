import type { CliCommandDefinition, CliParamDefinition } from './types';
import { CLI_GLOBAL_OPTIONS } from './constants';

export function normalizeCommandName(value: string): string {
    return value.replace(/[^a-zA-Z0-9]+/g, '.').replace(/([a-z0-9])([A-Z])/g, '$1.$2').toLowerCase();
}

export function findCliCommand(commands: readonly CliCommandDefinition[], input: string) {
    const normalized = normalizeCommandName(input);

    return (
        commands.find((command) => normalizeCommandName(command.name) === normalized) ??
        commands.find((command) => command.aliases.some((alias) => normalizeCommandName(alias) === normalized)) ??
        null
    );
}

export function cloneParam(param: CliParamDefinition, overrides: Partial<CliParamDefinition> = {}): CliParamDefinition {
    return {
        ...param,
        ...overrides,
        aliases: overrides.aliases ?? param.aliases,
        enum: overrides.enum ?? param.enum
    };
}

function getHandlerAtPath(root: unknown, path: readonly string[]) {
    let current = root as Record<string, unknown>;

    for (const segment of path) {
        const next = current[segment];
        if (next === undefined) {
            return null;
        }
        current = next as Record<string, unknown>;
    }

    return typeof current === 'function' ? (current as (...args: unknown[]) => unknown) : null;
}

export function sdkCommand(args: {
    name: string;
    layer: 'workflow' | 'api';
    summary: string;
    description: string;
    aliases?: string[];
    auth?: boolean;
    acceptsInput?: 'none' | 'object' | 'scalar';
    params?: CliParamDefinition[];
    examples: string[];
    outputDescription: string;
    outputSchema?: Record<string, unknown>;
    sdkPath: readonly string[];
    mapInput?: (input: Record<string, unknown>) => unknown;
}) {
    return {
        name: args.name,
        layer: args.layer,
        summary: args.summary,
        description: args.description,
        aliases: args.aliases ?? [],
        auth: args.auth,
        acceptsInput: args.acceptsInput ?? 'object',
        params: args.params ?? [],
        examples: args.examples,
        outputDescription: args.outputDescription,
        outputSchema: args.outputSchema,
        async handler(sdk, input) {
            const handler = getHandlerAtPath(sdk, args.sdkPath);
            if (!handler) {
                throw new Error(`Unsupported command target: ${args.sdkPath.join('.')}`);
            }

            const preparedInput = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
            const mappedInput = args.mapInput ? args.mapInput(preparedInput) : preparedInput;
            const finalInput = typeof mappedInput === 'object' && mappedInput !== null
                ? Object.fromEntries(Object.entries(mappedInput as Record<string, unknown>).filter(([, value]) => value !== undefined))
                : mappedInput;
            return finalInput === undefined ? await handler() : await handler(finalInput);
        }
    } satisfies CliCommandDefinition;
}

function bareValueSchema(type: 'string' | 'number' | 'boolean' | 'json') {
    return { type } satisfies Record<string, unknown>;
}

function buildInputSchema(command: CliCommandDefinition) {
    if (command.acceptsInput === 'none' || command.params.length === 0) {
        return {
            type: 'object',
            properties: {},
            additionalProperties: false
        } satisfies Record<string, unknown>;
    }

    const properties = Object.fromEntries(command.params.map((param) => {
        const propertySchema: Record<string, unknown> = {
            description: param.description
        };

        if (param.array) {
            propertySchema.type = 'array';
            propertySchema.items = {
                type: param.type === 'bigint' ? 'string' : param.type === 'json' ? 'object' : param.type
            };
        } else {
            propertySchema.type = param.type === 'bigint' ? 'string' : param.type === 'json' ? 'object' : param.type;
        }

        if (param.enum) {
            propertySchema.enum = [...param.enum];
        }
        if (param.aliases?.length) {
            propertySchema.aliases = [...param.aliases];
        }

        return [param.name, propertySchema];
    }));
    const objectSchema = {
        type: 'object',
        properties,
        additionalProperties: false,
        required: command.params.filter((param) => param.required).map((param) => param.name)
    } satisfies Record<string, unknown>;

    if (command.acceptsInput !== 'scalar') {
        return objectSchema;
    }

    const scalarParam = command.params[0];
    if (!scalarParam) {
        return objectSchema;
    }
    const scalarSchema = bareValueSchema(
        scalarParam.type === 'bigint' ? 'string' : scalarParam.type === 'json' ? 'json' : scalarParam.type
    );

    return {
        oneOf: [
            scalarSchema,
            objectSchema
        ]
    } satisfies Record<string, unknown>;
}

function renderParamLine(param: CliParamDefinition) {
    const label = `--${param.name.replace(/_/g, '-')}`;
    const typeLabel = param.array ? `${param.type}[]` : param.type;
    const requirement = param.required ? 'required' : 'optional';
    const aliases = param.aliases?.length ? ` aliases: ${param.aliases.map((alias) => `--${alias.replace(/_/g, '-')}`).join(', ')}` : '';
    const enumValues = param.enum?.length ? ` values: ${param.enum.join(', ')}` : '';

    return `  ${label} <${typeLabel}>  ${requirement}. ${param.description}${aliases}${enumValues}`;
}

function renderCommandExamples(command: CliCommandDefinition) {
    return command.examples.map((example) => `  ${example}`).join('\n');
}

export function renderGeneralHelp(commands: readonly CliCommandDefinition[]) {
    const workflowCommands = commands.filter((command) => command.layer === 'workflow');
    const apiCommands = commands.filter((command) => command.layer === 'api');
    const introspectionCommands = commands.filter((command) => command.layer === 'introspection');
    const lines = [
        'Usage:',
        '  webdom <command> [--flag value] [--input -]',
        '',
        'Introspection:',
        ...introspectionCommands.map((command) => `  ${command.name}  ${command.summary}`),
        '',
        'Workflow Commands:',
        ...workflowCommands.map((command) => `  ${command.name}  ${command.summary}`),
        '',
        'Low-Level API Commands:',
        ...apiCommands.map((command) => `  ${command.name}  ${command.summary}`),
        '',
        'Global Options:',
        ...CLI_GLOBAL_OPTIONS.map((option) => `  --${option.name}  ${option.description}`),
        '',
        'Examples:',
        '  webdom find-domain --query gold --limit 5',
        '  webdom get-domain --domain example.ton',
        '  webdom schema find-domain',
        '  webdom help domains.list-transactions',
        '  echo \'{"domain":"example.ton"}\' | webdom get-domain --input -',
        '',
        'Use `webdom help <command>` for human help or `webdom schema <command>` for machine-readable metadata.'
    ];

    return `${lines.join('\n')}\n`;
}

export function renderCommandHelp(command: CliCommandDefinition) {
    const lines = [
        `${command.name}`,
        `  ${command.summary}`,
        '',
        command.description,
        '',
        `Layer: ${command.layer}`,
        `Auth: ${command.auth ? 'required' : 'not required'}`,
        `Input: ${command.acceptsInput ?? 'object'}`,
        ''
    ];

    if (command.aliases.length > 0) {
        lines.push(`Aliases: ${command.aliases.join(', ')}`, '');
    }

    lines.push('Parameters:');
    if (command.params.length === 0) {
        lines.push('  No command-specific parameters.');
    } else {
        lines.push(...command.params.map(renderParamLine));
    }

    lines.push('', 'Examples:', renderCommandExamples(command), '', 'Output:', `  ${command.outputDescription}`);

    return `${lines.join('\n')}\n`;
}

export function buildCommandSchema(command: CliCommandDefinition) {
    return {
        name: command.name,
        aliases: command.aliases,
        layer: command.layer,
        summary: command.summary,
        description: command.description,
        auth_required: command.auth ?? false,
        accepts_input: command.acceptsInput ?? 'object',
        input_schema: buildInputSchema(command),
        output_schema: command.outputSchema ?? {
            type: 'object',
            description: command.outputDescription
        },
        examples: command.examples,
        global_options: CLI_GLOBAL_OPTIONS
    };
}
