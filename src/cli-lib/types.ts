import type { WebdomSdk } from '../sdk';

export type CliPrimitiveType = 'string' | 'number' | 'boolean' | 'bigint' | 'json';

export type CliParamDefinition = {
    name: string;
    type: CliPrimitiveType;
    description: string;
    aliases?: string[];
    required?: boolean;
    array?: boolean;
    enum?: readonly string[];
    positionalIndex?: number;
};

export type CliGlobalOptionDefinition = {
    name: string;
    type: 'string' | 'boolean';
    description: string;
};

export type CliCommandDefinition = {
    name: string;
    layer: 'introspection' | 'workflow' | 'api';
    summary: string;
    description: string;
    aliases: string[];
    auth?: boolean;
    acceptsInput?: 'none' | 'object' | 'scalar';
    textOutput?: boolean;
    params: CliParamDefinition[];
    examples: string[];
    outputDescription: string;
    outputSchema?: Record<string, unknown>;
    handler: (sdk: WebdomSdk, input: unknown, context: CliCommandContext) => Promise<unknown> | unknown;
};

export type CliCommandContext = {
    registry: readonly CliCommandDefinition[];
};
