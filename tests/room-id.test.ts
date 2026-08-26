import { describe, expect, it } from 'vitest';
import { createRoomId, createRtcUid, isValidRoomId, isValidRtcUid } from '@/lib/room-id';

describe('room identifiers', () => {
  it('creates canonical lowercase UUID room IDs', () => {
    const roomId = createRoomId();
    expect(isValidRoomId(roomId)).toBe(true);
    expect(roomId).toBe(roomId.toLowerCase());
  });

  it('rejects malformed or uppercase room IDs', () => {
    expect(isValidRoomId('not-a-room')).toBe(false);
    expect(isValidRoomId('550E8400-E29B-41D4-A716-446655440000')).toBe(false);
  });

  it('creates cross-platform-safe positive numeric UIDs', () => {
    for (let index = 0; index < 20; index += 1) {
      const uid = createRtcUid();
      expect(isValidRtcUid(uid)).toBe(true);
      expect(uid).toBeGreaterThan(0);
      expect(uid).toBeLessThanOrEqual(2_147_483_647);
    }
  });
});
