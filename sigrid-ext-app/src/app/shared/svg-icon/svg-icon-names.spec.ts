import {describe, expect, it} from 'vitest';
import {isSvgIconName} from './svg-icon-names';

describe('isSvgIconName', () => {
  it.each(['jira', 'azure-devops', 'sigrid-light'])('accepts the bundled icon name "%s"', name => {
    expect(isSvgIconName(name)).toBe(true);
  });

  it.each([
    'missing-icon',
    '',
    '../../etc/passwd',
    'jira/../azure-devops',
    'jira.svg',
    'JIRA',
  ])('rejects the unknown or unsafe icon name "%s"', name => {
    expect(isSvgIconName(name)).toBe(false);
  });
});
