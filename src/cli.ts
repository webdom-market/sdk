#!/usr/bin/env node

export * from './cli-lib/types';
export * from './cli-lib/registry';
export { runCli, type CliIo } from './cli-lib/run';

import { isCliEntrypoint, runCli } from './cli-lib/run';

if (isCliEntrypoint(process.argv[1])) {
    runCli(process.argv.slice(2)).then((exitCode) => {
        process.exitCode = exitCode;
    });
}
