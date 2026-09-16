import * as assert from 'assert';
import { getNonce } from '../utilities/get-nonce';

suite('getNonce', () => {
    test('returns a base64-encoded 16-byte value', () => {
        const nonce = getNonce();

        assert.strictEqual(nonce.length, 24);
        assert.ok(/^[A-Za-z0-9+/]+={0,2}$/.test(nonce));
        assert.strictEqual(Buffer.from(nonce, 'base64').length, 16);
    });

    test('generates unique, high-entropy values across many calls', () => {
        const nonces = new Set(Array.from({ length: 1000 }, () => getNonce()));

        assert.strictEqual(nonces.size, 1000);
    });
});
