type ParsedArgs = {
    positionals: string[];
    flags: Record<string, string | boolean | Array<string | boolean>>;
};

function setFlag(
    flags: Record<string, string | boolean | Array<string | boolean>>,
    key: string,
    value: string | boolean
): void {
    const current = flags[key];
    if (current === undefined) {
        flags[key] = value;
        return;
    }
    if (Array.isArray(current)) {
        current.push(value);
        return;
    }
    flags[key] = [current, value];
}

export function parseArgv(argv: string[]): ParsedArgs {
    const positionals: string[] = [];
    const flags: Record<string, string | boolean | Array<string | boolean>> = {};

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index]!;
        if (!token.startsWith('--')) {
            positionals.push(token);
            continue;
        }

        const key = token.slice(2);
        const next = argv[index + 1];
        if (!next || next.startsWith('--')) {
            setFlag(flags, key, true);
            continue;
        }

        setFlag(flags, key, next);
        index += 1;
    }

    return { positionals, flags };
}

export function takeFlag<T extends string | boolean | Array<string | boolean>>(
    flags: Record<string, string | boolean | Array<string | boolean>>,
    key: string
): T | undefined {
    const value = flags[key] as T | undefined;
    delete flags[key];
    return value;
}

export function toObjectParams(flags: Record<string, string | boolean | Array<string | boolean>>): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    for (const [key, rawValue] of Object.entries(flags)) {
        const normalizedKey = key.replace(/-/g, '_');
        params[normalizedKey] = rawValue;
    }

    return params;
}
