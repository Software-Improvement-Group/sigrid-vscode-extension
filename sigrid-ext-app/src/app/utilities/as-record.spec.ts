import { asRecord } from './as-record';
import { Property } from '../models/property';

describe('utilities/as-record', () => {
  it('returns an empty record for an empty list', () => {
    expect(asRecord([])).toEqual({});
  });

  it('converts properties array into a Record<string, string>', () => {
    const input: Property[] = [
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
      { name: 'c', value: '' },
    ];

    expect(asRecord(input)).toEqual({
      a: '1',
      b: '2',
      c: '',
    });
  });

  it('uses the last value when property names are duplicated', () => {
    const input: Property[] = [
      { name: 'dup', value: 'first' },
      { name: 'x', value: '1' },
      { name: 'dup', value: 'second' },
    ];

    expect(asRecord(input)).toEqual({
      dup: 'second',
      x: '1',
    });
  });
});
