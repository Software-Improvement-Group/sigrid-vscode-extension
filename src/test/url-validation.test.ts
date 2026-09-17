import * as assert from 'assert';
import { parseExternalUrl } from '../utilities/url-validation';

suite('url-validation', () => {
    test('accepts https URLs', () => {
        const uri = parseExternalUrl('https://sigrid-says.com/finding/1');
        assert.strictEqual(uri.scheme, 'https');
    });

    test('accepts http URLs', () => {
        const uri = parseExternalUrl('http://jira.internal/browse/APP-1');
        assert.strictEqual(uri.scheme, 'http');
    });

    test('rejects file: URLs', () => {
        assert.throws(() => parseExternalUrl('file:///etc/passwd'));
    });

    test('rejects vscode: URLs', () => {
        assert.throws(() => parseExternalUrl('vscode://foo/bar'));
    });

    test('rejects command: URLs', () => {
        assert.throws(() => parseExternalUrl('command:workbench.action.something'));
    });

    test('rejects javascript: URLs', () => {
        assert.throws(() => parseExternalUrl('javascript:alert(1)'));
    });

    test('rejects malformed URLs under strict parsing', () => {
        assert.throws(() => parseExternalUrl('not a url'));
    });
});
