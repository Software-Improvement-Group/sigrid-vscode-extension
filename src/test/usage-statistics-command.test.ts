import * as assert from 'assert';
import { UsageStatisticsCommand } from '../commands/usage-statistics-command';
import { VsCodeCommandData } from '../commands/vscode-command-data';

async function executeCommand(customer: string) {
    const command = new UsageStatisticsCommand();
    await command.execute(new VsCodeCommandData({} as any, {} as any, { customer }, {} as any));
}

suite('UsageStatisticsCommand', () => {
    let originalFetch: any;

    setup(() => {
        originalFetch = globalThis.fetch;
    });

    teardown(() => {
        globalThis.fetch = originalFetch;
    });

    const specialCustomerValues = [
        { input: 'acme corp', encoded: 'acme%20corp' },
        { input: 'acme&co', encoded: 'acme%26co' },
        { input: 'acme=co', encoded: 'acme%3Dco' },
        { input: 'acme#co', encoded: 'acme%23co' },
    ];

    for (const { input, encoded } of specialCustomerValues) {
        test(`encodes customer identifier containing "${input}"`, async () => {
            let requestedUrl = '';
            globalThis.fetch = async (url: any) => {
                requestedUrl = url.toString();
                return { ok: true } as any;
            };

            await executeCommand(input);

            assert.ok(requestedUrl.endsWith(encoded), `expected URL to end with "${encoded}", got "${requestedUrl}"`);
            assert.ok(!requestedUrl.includes(input), 'expected raw customer value not to appear unencoded in the URL');
        });
    }
});
