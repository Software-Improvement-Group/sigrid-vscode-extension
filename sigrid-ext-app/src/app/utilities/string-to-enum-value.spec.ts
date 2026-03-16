import {stringToEnumValue} from './string-to-enum-value';

enum StringEnum {
  Open = 'OPEN',
  Closed = 'CLOSED',
  InProgress = 'IN_PROGRESS',
}

enum NumericEnum {
  Low = 1,
  Medium = 2,
  High = 3,
}

describe('utilities/stringToEnumValue', () => {
  it('returns the matching value for string enums', () => {
    expect(stringToEnumValue(StringEnum, 'OPEN')).toBe(StringEnum.Open);
    expect(stringToEnumValue(StringEnum, 'CLOSED')).toBe(StringEnum.Closed);
    expect(stringToEnumValue(StringEnum, 'IN_PROGRESS')).toBe(StringEnum.InProgress);
  });

  it('returns undefined for unknown string enum values', () => {
    expect(stringToEnumValue(StringEnum, 'UNKNOWN')).toBeUndefined();
    expect(stringToEnumValue(StringEnum, '')).toBeUndefined();
  });

  it('returns the matching numeric enum value from a numeric string', () => {
    expect(stringToEnumValue(NumericEnum, '1')).toBe(NumericEnum.Low);
    expect(stringToEnumValue(NumericEnum, '2')).toBe(NumericEnum.Medium);
    expect(stringToEnumValue(NumericEnum, '3')).toBe(NumericEnum.High);
  });

  it('returns undefined for unknown numeric enum values', () => {
    expect(stringToEnumValue(NumericEnum, '0')).toBeUndefined();
    expect(stringToEnumValue(NumericEnum, '4')).toBeUndefined();
    expect(stringToEnumValue(NumericEnum, 'not-a-number')).toBeUndefined();
  });

  it('prefers direct string value matches before numeric parsing', () => {
    const mixedEnum = {
      OneAsString: '1',
      TwoAsNumber: 2,
    } as const;

    expect(stringToEnumValue(mixedEnum, '1')).toBe('1');
    expect(stringToEnumValue(mixedEnum, '2')).toBe(2);
  });
});
