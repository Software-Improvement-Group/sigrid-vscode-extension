import {buildArchitectureExplorerUrl} from './architecture-explorer-url';
import {Configuration} from '../models/configuration';

describe('buildArchitectureExplorerUrl', () => {
  const config = (overrides: Partial<Configuration> = {}) =>
    ({sigridUrl: 'https://sigrid-says.com', customer: 'acme', system: 'shop', ...overrides}) as Configuration;

  it('builds the architecture explorer url of the system', () => {
    expect(buildArchitectureExplorerUrl(config())).toBe('https://sigrid-says.com/acme/shop/-/architecture-quality/explorer');
  });

  it('copes with a trailing slash on the sigrid url', () => {
    expect(buildArchitectureExplorerUrl(config({sigridUrl: 'https://sigrid.example.com/'})))
      .toBe('https://sigrid.example.com/acme/shop/-/architecture-quality/explorer');
  });

  it('encodes the portfolio and system names', () => {
    expect(buildArchitectureExplorerUrl(config({customer: 'a b', system: 'x/y'})))
      .toBe('https://sigrid-says.com/a%20b/x%2Fy/-/architecture-quality/explorer');
  });

  it('returns an empty string when the configuration is incomplete', () => {
    expect(buildArchitectureExplorerUrl(config({customer: ''}))).toBe('');
    expect(buildArchitectureExplorerUrl(config({system: ''}))).toBe('');
    expect(buildArchitectureExplorerUrl(config({sigridUrl: ''}))).toBe('');
  });
});
