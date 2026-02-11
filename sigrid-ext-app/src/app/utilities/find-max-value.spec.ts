import { findMaxValue } from './find-max-value';

describe('utilities/find-max-value', () => {
  it('returns undefined when called with no values', () => {
    expect(findMaxValue()).toBeUndefined();
  });

  it('returns the value when called with a single value', () => {
    expect(findMaxValue(5)).toBe(5);
    expect(findMaxValue(-3)).toBe(-3);
    expect(findMaxValue(0)).toBe(0);
  });

  it('returns the maximum of multiple values', () => {
    expect(findMaxValue(1, 2, 3)).toBe(3);
    expect(findMaxValue(3, 2, 1)).toBe(3);
    expect(findMaxValue(-10, -5, -7)).toBe(-5);
    expect(findMaxValue(0, -1, -2)).toBe(0);
  });

  it('treats -0 and 0 consistently (max should be 0)', () => {
    expect(findMaxValue(-0, 0)).toBe(0);
    expect(findMaxValue(0, -0)).toBe(0);
  });
});
