import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRtcToken } from '@/lib/token';

const ROOM_ID = '550e8400-e29b-41d4-a716-446655440000';
const APP_ID = '0123456789abcdef0123456789abcdef';
const APP_CERTIFICATE = 'fedcba9876543210fedcba9876543210';

describe('RTC token construction', () => {
  it('uses RTC-only publisher privileges and relative expiration seconds', () => {
    const builder = vi.fn(() => 'rtc-token');

    const token = buildRtcToken({
      appId: APP_ID,
      appCertificate: APP_CERTIFICATE,
      roomId: ROOM_ID,
      uid: 1234,
      builder,
    });

    expect(token).toBe('rtc-token');
    expect(builder).toHaveBeenCalledWith(
      APP_ID,
      APP_CERTIFICATE,
      ROOM_ID,
      1234,
      1,
      3600,
      3600,
    );
  });
});

describe('POST /api/token', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_AGORA_APP_ID = APP_ID;
    process.env.NEXT_AGORA_APP_CERTIFICATE = APP_CERTIFICATE;
  });

  it('generates an initial UID and returns a no-store response', async () => {
    const { POST, runtime } = await import('@/app/api/token/route');
    const response = await POST(
      new Request('http://localhost/api/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomId: ROOM_ID }),
      }),
    );
    const body = await response.json();

    expect(runtime).toBe('nodejs');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).toMatchObject({
      appId: APP_ID,
      roomId: ROOM_ID,
      expiresIn: 3600,
    });
    expect(body.uid).toBeGreaterThan(0);
    expect(body.token).toEqual(expect.any(String));
  });

  it('preserves the requested UID for renewal', async () => {
    const { POST } = await import('@/app/api/token/route');
    const response = await POST(
      new Request('http://localhost/api/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomId: ROOM_ID, uid: 9876 }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.uid).toBe(9876);
  });

  it('rejects invalid room IDs and UIDs', async () => {
    const { POST } = await import('@/app/api/token/route');
    const response = await POST(
      new Request('http://localhost/api/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomId: '../bad-room', uid: -1 }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid room ID or UID.' });
  });

  it('fails without exposing missing credential names or values', async () => {
    delete process.env.NEXT_AGORA_APP_CERTIFICATE;
    const { POST } = await import('@/app/api/token/route');
    const response = await POST(
      new Request('http://localhost/api/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomId: ROOM_ID }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Agora credentials are not configured.' });
  });
});
