import { buildRtcToken, TOKEN_EXPIRATION_SECONDS } from '@/lib/token';
import { createRtcUid, isValidRoomId, isValidRtcUid } from '@/lib/room-id';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.NEXT_AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return json({ error: 'Agora credentials are not configured.' }, 500);
  }

  let payload: { roomId?: unknown; uid?: unknown };
  try {
    payload = (await request.json()) as { roomId?: unknown; uid?: unknown };
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  if (
    !isValidRoomId(payload.roomId) ||
    (payload.uid !== undefined && !isValidRtcUid(payload.uid))
  ) {
    return json({ error: 'Invalid room ID or UID.' }, 400);
  }

  const uid = payload.uid ?? createRtcUid();

  try {
    const token = buildRtcToken({
      appId,
      appCertificate,
      roomId: payload.roomId,
      uid,
    });

    if (!token) {
      throw new Error('Token builder returned an empty token.');
    }

    return json({
      appId,
      roomId: payload.roomId,
      uid,
      token,
      expiresIn: TOKEN_EXPIRATION_SECONDS,
    });
  } catch {
    return json({ error: 'Unable to issue an RTC token.' }, 500);
  }
}
