import * as AgoraToken from 'agora-token';

export const TOKEN_EXPIRATION_SECONDS = 3600;

type TokenBuilder = (
  appId: string,
  appCertificate: string,
  roomId: string,
  uid: number,
  role: number,
  tokenExpire: number,
  privilegeExpire: number,
) => string;

type BuildRtcTokenInput = {
  appId: string;
  appCertificate: string;
  roomId: string;
  uid: number;
  builder?: TokenBuilder;
};

export function buildRtcToken({
  appId,
  appCertificate,
  roomId,
  uid,
  builder,
}: BuildRtcTokenInput): string {
  const build =
    builder ??
    ((...args: Parameters<TokenBuilder>) =>
      AgoraToken.RtcTokenBuilder.buildTokenWithUid(...args));

  return build(
    appId,
    appCertificate,
    roomId,
    uid,
    AgoraToken.RtcRole.PUBLISHER,
    TOKEN_EXPIRATION_SECONDS,
    TOKEN_EXPIRATION_SECONDS,
  );
}
