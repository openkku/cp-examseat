import { describe, it, expect } from 'vitest';
import { parseSeat, findRoomConfig } from '../utils';
import type { RoomConfigMap } from '../types';

describe('parseSeat', () => {
  it('correctly parses normal seats', () => {
    expect(parseSeat('A25')).toEqual({ char: 'A', num: 25 });
    expect(parseSeat('B1')).toEqual({ char: 'B', num: 1 });
  });

  it('correctly parses multi-character seats', () => {
    expect(parseSeat('AA12')).toEqual({ char: 'AA', num: 12 });
  });

  it('returns safe defaults for invalid/empty seats', () => {
    expect(parseSeat('')).toEqual({ char: '', num: -1 });
    expect(parseSeat('12')).toEqual({ char: '', num: -1 });
    expect(parseSeat('A')).toEqual({ char: '', num: -1 });
  });
});

describe('findRoomConfig', () => {
  const mockConfigMap: RoomConfigMap = {
    'CP.9127': { layout: [] },
    '^SC.5.*': { layout: [] },
    'SC.110[1-3]': { layout: [] },
  };

  it('finds direct match', () => {
    const config = findRoomConfig('CP.9127', mockConfigMap);
    expect(config).toBe(mockConfigMap['CP.9127']);
  });

  it('finds regex match', () => {
    const config = findRoomConfig('SC.5101', mockConfigMap);
    expect(config).toBe(mockConfigMap['^SC.5.*']);
  });

  it('finds regex range match', () => {
    const config = findRoomConfig('SC.1102', mockConfigMap);
    expect(config).toBe(mockConfigMap['SC.110[1-3]']);
  });

  it('returns null on mismatch', () => {
    const config = findRoomConfig('OTHER.ROOM', mockConfigMap);
    expect(config).toBeNull();
  });

  it('returns null on null/undefined config map', () => {
    expect(findRoomConfig('CP.9127', null as any)).toBeNull();
  });
});
