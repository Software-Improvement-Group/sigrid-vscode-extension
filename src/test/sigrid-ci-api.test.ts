import * as assert from 'assert';
import {
    buildBearerAuthHeader,
    buildCiUploadUrl,
    buildLicensesUrl,
    buildSigridApiBaseUrl,
    buildSigridCiUrl,
} from '../utilities/sigrid-ci-api';

suite('sigrid-ci-api', () => {
    test('buildBearerAuthHeader prefixes the API key with "Bearer "', () => {
        assert.strictEqual(buildBearerAuthHeader('my-api-key'), 'Bearer my-api-key');
    });

    test('buildSigridApiBaseUrl strips trailing slashes from sigridUrl', () => {
        assert.strictEqual(
            buildSigridApiBaseUrl('https://sigrid-says.com///'),
            'https://sigrid-says.com/rest/analysis-results/api/v1',
        );
    });

    test('buildLicensesUrl builds the licenses path and encodes the customer', () => {
        assert.strictEqual(
            buildLicensesUrl('https://sigrid-says.com', 'acme corp'),
            'https://sigrid-says.com/rest/analysis-results/api/v1/licenses/acme%20corp',
        );
    });

    test('buildSigridCiUrl builds the CI existence-check path and encodes customer/system', () => {
        assert.strictEqual(
            buildSigridCiUrl('https://sigrid-says.com/', 'acme corp', 'my/system'),
            'https://sigrid-says.com/rest/analysis-results/sigridci/acme%20corp/my%2Fsystem/v1/ci',
        );
    });

    test('buildCiUploadUrl builds the CI upload path and encodes customer/system', () => {
        assert.strictEqual(
            buildCiUploadUrl('https://sigrid-says.com', 'acme corp', 'my/system'),
            'https://sigrid-says.com/rest/inboundresults/sig/acme%20corp/my%2Fsystem/ci/uploads/v1',
        );
    });
});
