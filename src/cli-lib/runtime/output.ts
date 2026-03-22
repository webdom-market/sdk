import type { CliIo } from './config';

export function writeJsonOutput(io: CliIo, value: unknown, options: { pretty: boolean; jsonl: boolean }) {
    const outputValue = value === undefined ? null : value;

    if (options.jsonl) {
        const lines = Array.isArray(outputValue) ? outputValue : [outputValue];
        for (const line of lines) {
            io.stdout(`${JSON.stringify(line)}\n`);
        }
        return;
    }

    io.stdout(`${JSON.stringify(outputValue, null, options.pretty ? 2 : undefined)}\n`);
}
