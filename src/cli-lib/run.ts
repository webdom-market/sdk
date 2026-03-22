import path from 'node:path';

import { WebdomApiError } from '../api/errors';
import { createWebdomSdk } from '../sdk';
import { renderCommandHelp, renderGeneralHelp } from './command-builder';
import { CLI_COMMANDS, resolveCliCommand } from './registry';
import { parseArgv, takeFlag } from './runtime/args';
import { getAuthDefaults, resolveJsonInput, resolveSdkOptions } from './runtime/config';
import type { CliIo } from './runtime/config';
import { prepareCommandInput, selectResultValue } from './runtime/input';
import { writeJsonOutput } from './runtime/output';

async function invokeCommand(argv: string[], io: CliIo): Promise<void> {
    const parsed = parseArgv(argv);
    const listCommandsFlag = takeFlag(parsed.flags, 'list-commands') === true;
    const helpFlag = takeFlag(parsed.flags, 'help') === true;
    const prettyFlag = takeFlag(parsed.flags, 'pretty') === true;
    const jsonlFlag = takeFlag(parsed.flags, 'jsonl') === true;
    const selectFlag = takeFlag<string>(parsed.flags, 'select');
    const jsonInput = await resolveJsonInput(parsed.flags, io);

    if (listCommandsFlag && parsed.positionals.length === 0) {
        parsed.positionals.push('commands');
    }

    if (parsed.positionals.length === 0) {
        io.stdout(renderGeneralHelp(CLI_COMMANDS));
        return;
    }

    if (parsed.positionals[0] === 'help' && parsed.positionals.length === 1) {
        io.stdout(renderGeneralHelp(CLI_COMMANDS));
        return;
    }

    const command = resolveCliCommand(parsed.positionals[0]!);
    if (!command) {
        throw new Error(`Unknown command: ${parsed.positionals[0]}`);
    }

    if (helpFlag && command.name !== 'help') {
        io.stdout(renderCommandHelp(command));
        return;
    }

    const sdk = createWebdomSdk(await resolveSdkOptions(parsed.flags));
    if (command.auth) {
        const token = await sdk.context.tokenStorage.getToken();
        if (typeof token !== 'string' || token.trim().length === 0) {
            throw new WebdomApiError({
                message: 'Command ' + command.name + ' requires an auth token, but no token is configured.',
                status: 401,
                code: 'AUTH_TOKEN_MISSING',
                retryable: false
            });
        }
    }
    const defaultParams = command.name === 'auth.authenticate' ? getAuthDefaults() : {};
    const input = prepareCommandInput(command, parsed.positionals.slice(1), parsed.flags, jsonInput, defaultParams);
    let result = await command.handler(sdk, input, { registry: CLI_COMMANDS });

    if (selectFlag) {
        result = selectResultValue(result, selectFlag);
    }

    if (command.textOutput) {
        io.stdout(typeof result === 'string' ? result : `${String(result)}\n`);
        return;
    }

    writeJsonOutput(io, result, {
        pretty: prettyFlag,
        jsonl: jsonlFlag
    });
}

export async function runCli(argv: string[], io: CliIo = {
    stdout: (value) => process.stdout.write(value),
    stderr: (value) => process.stderr.write(value)
}): Promise<number> {
    try {
        await invokeCommand(argv, io);
        return 0;
    } catch (error: unknown) {
        if (error instanceof WebdomApiError) {
            io.stderr(
                `${JSON.stringify(
                    {
                        code: error.code,
                        message: error.message,
                        status: error.status,
                        details: error.details,
                        retryable: error.retryable
                    },
                    null,
                    2
                )}\n`
            );
            return 1;
        }

        io.stderr(
            `${JSON.stringify(
                {
                    code: 'CLI_ERROR',
                    message: error instanceof Error ? error.message : String(error)
                },
                null,
                2
            )}\n`
        );
        return 1;
    }
}

export function isCliEntrypoint(argvEntry: string | undefined) {
    if (!argvEntry) {
        return false;
    }

    const entryName = path.basename(argvEntry);
    return entryName === 'webdom' || entryName === 'cli.js' || entryName === 'cli.cjs' || entryName === 'cli.ts';
}

export type { CliIo };
