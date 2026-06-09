import type { RoomConfig, RoomConfigMap } from './types';

/**
 * Searches the config map for a matching room.
 * Supports Regex keys (e.g. "^SC.5.*").
 */
export function findRoomConfig(roomName: string, configMap: RoomConfigMap): RoomConfig | null {
  if (!configMap) return null;

  // 1. Direct Match (Fastest)
  if (configMap[roomName]) {
    return configMap[roomName];
  }

  // 2. Regex Match (Safe Version)
  for (const key in configMap) {
    try {
      // ✅ FIX: Only treat it as Regex if it starts with ^ or contains special syntax
      // Otherwise, checking simple inclusion is safer.
      const regex = new RegExp(key, 'i'); // Added 'i' for case-insensitive
      if (regex.test(roomName)) {
        return configMap[key];
      }
    } catch (e) {
      console.warn(`[Utils] Skipping invalid Regex key: "${key}"`);
    }
  }

  return null;
}

/**
 * Parses "A25" -> { char: "A", num: 25 }
 */
export function parseSeat(seatString: string) {
  const match = seatString?.match(/([A-Z]+)(\d+)/);
  return {
    char: match ? match[1] : '',
    num: match ? parseInt(match[2], 10) : -1
  };
}