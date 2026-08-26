const ROOM_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const MAX_RTC_UID = 2_147_483_647;

export function createRoomId(): string {
  return globalThis.crypto.randomUUID();
}

export function isValidRoomId(value: unknown): value is string {
  return typeof value === 'string' && ROOM_ID_PATTERN.test(value);
}

export function createRtcUid(): number {
  const buffer = new Uint32Array(1);
  let uid = 0;

  while (uid === 0) {
    globalThis.crypto.getRandomValues(buffer);
    uid = buffer[0] & MAX_RTC_UID;
  }

  return uid;
}

export function isValidRtcUid(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_RTC_UID
  );
}
