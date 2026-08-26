import type {
  ConnectionState,
  IAgoraRTC,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalTrack,
} from 'agora-rtc-sdk-ng';
import type { LocalMedia } from '@/lib/media-devices';

type RtcSdk = Pick<IAgoraRTC, 'createClient'>;

type RtcSessionOptions = {
  sdk: RtcSdk;
  appId: string;
  roomId: string;
  uid: number;
  token: string;
  media: LocalMedia;
  renewToken: (roomId: string, uid: number) => Promise<string>;
  onRemoteUsers: (users: IAgoraRTCRemoteUser[]) => void;
  onConnectionState: (state: ConnectionState) => void;
  onError: (error: Error) => void;
};

export class RtcSession {
  private readonly client: IAgoraRTCClient;
  private readonly appId: string;
  private readonly roomId: string;
  private readonly uid: number;
  private readonly token: string;
  private readonly media: LocalMedia;
  private readonly renewTokenCallback: RtcSessionOptions['renewToken'];
  private readonly onRemoteUsers: RtcSessionOptions['onRemoteUsers'];
  private readonly onConnectionState: RtcSessionOptions['onConnectionState'];
  private readonly onError: RtcSessionOptions['onError'];
  private listenersRegistered = false;
  private joined = false;
  private cleanupPromise: Promise<void> | null = null;

  constructor(options: RtcSessionOptions) {
    this.client = options.sdk.createClient({ mode: 'rtc', codec: 'vp8' });
    this.appId = options.appId;
    this.roomId = options.roomId;
    this.uid = options.uid;
    this.token = options.token;
    this.media = options.media;
    this.renewTokenCallback = options.renewToken;
    this.onRemoteUsers = options.onRemoteUsers;
    this.onConnectionState = options.onConnectionState;
    this.onError = options.onError;
  }

  private readonly handleUserJoined = () => {
    this.emitRemoteUsers();
  };

  private readonly handleUserPublished = async (
    user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video',
  ) => {
    try {
      await this.client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
      this.emitRemoteUsers();
    } catch {
      this.onError(new Error(`Unable to subscribe to remote ${mediaType}.`));
    }
  };

  private readonly handleRemoteUserChanged = () => {
    this.emitRemoteUsers();
  };

  private readonly handleConnectionStateChange = (state: ConnectionState) => {
    this.onConnectionState(state);
  };

  private readonly handleTokenWillExpire = async () => {
    try {
      const token = await this.renewTokenCallback(this.roomId, this.uid);
      await this.client.renewToken(token);
    } catch {
      this.onError(new Error('Unable to renew the RTC token.'));
    }
  };

  private readonly handleException = (event: { code: number; msg: string }) => {
    this.onError(new Error(`RTC exception ${event.code}: ${event.msg}`));
  };

  private emitRemoteUsers() {
    this.onRemoteUsers([...this.client.remoteUsers]);
  }

  private registerListeners() {
    if (this.listenersRegistered) return;
    this.client.on('user-joined', this.handleUserJoined);
    this.client.on('user-published', this.handleUserPublished);
    this.client.on('user-unpublished', this.handleRemoteUserChanged);
    this.client.on('user-left', this.handleRemoteUserChanged);
    this.client.on('connection-state-change', this.handleConnectionStateChange);
    this.client.on('token-privilege-will-expire', this.handleTokenWillExpire);
    this.client.on('token-privilege-did-expire', this.handleTokenWillExpire);
    this.client.on('exception', this.handleException);
    this.listenersRegistered = true;
  }

  private unregisterListeners() {
    if (!this.listenersRegistered) return;
    this.client.off('user-joined', this.handleUserJoined);
    this.client.off('user-published', this.handleUserPublished);
    this.client.off('user-unpublished', this.handleRemoteUserChanged);
    this.client.off('user-left', this.handleRemoteUserChanged);
    this.client.off('connection-state-change', this.handleConnectionStateChange);
    this.client.off('token-privilege-will-expire', this.handleTokenWillExpire);
    this.client.off('token-privilege-did-expire', this.handleTokenWillExpire);
    this.client.off('exception', this.handleException);
    this.listenersRegistered = false;
  }

  private get localTracks(): ILocalTrack[] {
    const tracks: ILocalTrack[] = [];
    if (this.media.microphone) tracks.push(this.media.microphone);
    if (this.media.camera) tracks.push(this.media.camera);
    return tracks;
  }

  async join(): Promise<void> {
    this.registerListeners();
    await this.client.join(this.appId, this.roomId, this.token, this.uid);
    this.joined = true;
    if (this.localTracks.length > 0) {
      await this.client.publish(this.localTracks);
    }
    this.emitRemoteUsers();
  }

  cleanup(): Promise<void> {
    if (this.cleanupPromise) return this.cleanupPromise;

    this.cleanupPromise = (async () => {
      this.unregisterListeners();

      if (this.joined && this.localTracks.length > 0) {
        try {
          await this.client.unpublish(this.localTracks);
        } catch {
          // Continue releasing devices even if the network is already gone.
        }
      }

      for (const track of this.localTracks) {
        track.stop();
        track.close();
      }

      if (this.joined) {
        try {
          await this.client.leave();
        } finally {
          this.joined = false;
        }
      }
    })();

    return this.cleanupPromise;
  }
}
