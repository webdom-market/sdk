import { API_COMMANDS, INTROSPECTION_COMMANDS } from './commands/api';
import { WORKFLOW_COMMANDS } from './commands/workflow';
import { findCliCommand } from './command-builder';

export const CLI_COMMANDS = [
    ...INTROSPECTION_COMMANDS,
    ...WORKFLOW_COMMANDS,
    ...API_COMMANDS
];

export function resolveCliCommand(input: string) {
    return findCliCommand(CLI_COMMANDS, input);
}
