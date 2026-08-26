'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RotateCcw } from 'lucide-react';
import type {
  ConnectionState,
  IAgoraRTC,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';
import {
  closeLocalMedia,
  createLocalMedia,
  setMediaEnabled,
  subscribeToDeviceChanges,
  switchMediaDevice,
  type LocalMedia,
} from '@/lib/media-devices';
import { requestRtcToken } from '@/lib/token-client';
import { RtcSession } from '@/lib/rtc-session';
import { BrandFooter } from '@/components/brand-footer';
import { Button } from '@/components/ui/button';
import { PreJoin } from '@/components/pre-join';
import { CallView } from '@/components/call-view';

type Phase = 'loading' | 'prejoin' | 'joining' | 'connected' | 'error' | 'left';

export function RoomExperience({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [media, setMedia] = useState<LocalMedia | null>(null);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphoneId, setMicrophoneId] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [error, setError] = useState<string | null>(null);

  const sdkRef = useRef<IAgoraRTC | null>(null);
  const mediaRef = useRef<LocalMedia | null>(null);
  const sessionRef = useRef<RtcSession | null>(null);
  const deviceUnsubscribeRef = useRef<(() => void) | null>(null);
  const initGenerationRef = useRef(0);

  const refreshDevices = useCallback(async (sdk: IAgoraRTC, localMedia: LocalMedia) => {
    const [nextMicrophones, nextCameras] = await Promise.all([
      sdk.getMicrophones(true).catch(() => []),
      sdk.getCameras(true).catch(() => []),
    ]);

    setMicrophones(nextMicrophones);
    setCameras(nextCameras);

    const activeMicrophone = nextMicrophones.find(
      (device) => device.label === localMedia.microphone?.getTrackLabel(),
    );
    const activeCamera = nextCameras.find(
      (device) => device.label === localMedia.camera?.getTrackLabel(),
    );

    const nextMicrophoneId = activeMicrophone?.deviceId ?? nextMicrophones[0]?.deviceId ?? '';
    const nextCameraId = activeCamera?.deviceId ?? nextCameras[0]?.deviceId ?? '';

    if (!activeMicrophone && localMedia.microphone && nextMicrophoneId) {
      await switchMediaDevice(localMedia.microphone, nextMicrophoneId).catch(() => undefined);
    }
    if (!activeCamera && localMedia.camera && nextCameraId) {
      await switchMediaDevice(localMedia.camera, nextCameraId).catch(() => undefined);
    }

    setMicrophoneId(nextMicrophoneId);
    setCameraId(nextCameraId);
  }, []);

  const initializeMedia = useCallback(async () => {
    const generation = ++initGenerationRef.current;
    setPhase('loading');
    setError(null);

    try {
      const rtcModule = await import('agora-rtc-sdk-ng');
      const sdk = rtcModule.default;
      const localMedia = await createLocalMedia(sdk);

      if (generation !== initGenerationRef.current) {
        closeLocalMedia(localMedia);
        return;
      }

      sdkRef.current = sdk;
      mediaRef.current = localMedia;
      setMedia(localMedia);
      setMicrophoneEnabled(Boolean(localMedia.microphone));
      setCameraEnabled(Boolean(localMedia.camera));
      await refreshDevices(sdk, localMedia);

      deviceUnsubscribeRef.current?.();
      deviceUnsubscribeRef.current = subscribeToDeviceChanges(sdk, () => {
        void refreshDevices(sdk, localMedia);
      });
      setPhase('prejoin');
    } catch {
      setError('Unable to initialize camera and microphone access.');
      setPhase('error');
    }
  }, [refreshDevices]);

  useEffect(() => {
    const timer = window.setTimeout(() => void initializeMedia(), 0);

    return () => {
      window.clearTimeout(timer);
      initGenerationRef.current += 1;
      deviceUnsubscribeRef.current?.();
      deviceUnsubscribeRef.current = null;

      if (sessionRef.current) {
        void sessionRef.current.cleanup();
      } else if (mediaRef.current) {
        closeLocalMedia(mediaRef.current);
      }
      sessionRef.current = null;
      mediaRef.current = null;
    };
  }, [initializeMedia]);

  const changeMicrophone = async (deviceId: string) => {
    if (!media?.microphone) return;
    try {
      await switchMediaDevice(media.microphone, deviceId);
      setMicrophoneId(deviceId);
    } catch {
      setError('Unable to switch microphones.');
    }
  };

  const changeCamera = async (deviceId: string) => {
    if (!media?.camera) return;
    try {
      await switchMediaDevice(media.camera, deviceId);
      setCameraId(deviceId);
    } catch {
      setError('Unable to switch cameras.');
    }
  };

  const toggleMicrophone = async () => {
    if (!media?.microphone) return;
    const enabled = !microphoneEnabled;
    await setMediaEnabled(media.microphone, enabled);
    setMicrophoneEnabled(enabled);
  };

  const toggleCamera = async () => {
    if (!media?.camera) return;
    const enabled = !cameraEnabled;
    await setMediaEnabled(media.camera, enabled);
    setCameraEnabled(enabled);
  };

  const join = async () => {
    if (!media || !sdkRef.current) return;
    setPhase('joining');
    setError(null);

    try {
      const credentials = await requestRtcToken(roomId);
      const session = new RtcSession({
        sdk: sdkRef.current,
        appId: credentials.appId,
        roomId,
        uid: credentials.uid,
        token: credentials.token,
        media,
        renewToken: async (renewRoomId, uid) =>
          (await requestRtcToken(renewRoomId, uid)).token,
        onRemoteUsers: setRemoteUsers,
        onConnectionState: setConnectionState,
        onError: (nextError) => setError(nextError.message),
      });
      sessionRef.current = session;
      await session.join();
      setPhase('connected');
    } catch (nextError) {
      await sessionRef.current?.cleanup();
      sessionRef.current = null;
      mediaRef.current = null;
      setMedia(null);
      setError(nextError instanceof Error ? nextError.message : 'Unable to join the room.');
      setPhase('error');
    }
  };

  const leave = async () => {
    await sessionRef.current?.cleanup();
    sessionRef.current = null;
    mediaRef.current = null;
    setMedia(null);
    setRemoteUsers([]);
    setPhase('left');
  };

  if (phase === 'loading') {
    return (
      <main className="relative flex min-h-dvh items-center justify-center bg-background px-4">
        <section className="dark-panel flex w-[min(92vw,26rem)] flex-col items-center rounded-[20px] px-8 py-10 text-center text-white">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <h1 className="mt-5 text-xl font-medium">Preparing your devices</h1>
          <p className="mt-2 text-sm text-[#7f8694]">Allow camera and microphone access when prompted.</p>
        </section>
        <BrandFooter />
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="relative flex min-h-dvh items-center justify-center bg-background px-4">
        <section className="dark-panel flex w-[min(92vw,26rem)] flex-col items-center rounded-[20px] px-8 py-10 text-center text-white">
          <h1 className="text-xl font-medium">Unable to continue</h1>
          <p className="mt-3 text-sm leading-6 text-[#9aa0ac]">{error}</p>
          <Button className="mt-7 w-full" onClick={() => void initializeMedia()}>
            <RotateCcw className="h-4 w-4" /> Retry Device Setup
          </Button>
        </section>
        <BrandFooter />
      </main>
    );
  }

  if (phase === 'left') {
    return (
      <main className="relative flex min-h-dvh items-center justify-center bg-background px-4">
        <section className="dark-panel flex w-[min(92vw,26rem)] flex-col items-center rounded-[20px] px-8 py-10 text-center text-white">
          <h1 className="text-2xl font-medium">You left the call</h1>
          <p className="mt-3 text-sm text-[#858c99]">Your camera and microphone have been released.</p>
          <Button className="mt-8 w-full" onClick={() => router.push('/')}>Create Another Room</Button>
        </section>
        <BrandFooter />
      </main>
    );
  }

  if (!media) return null;

  if (phase === 'prejoin' || phase === 'joining') {
    return (
      <PreJoin
        media={media}
        microphones={microphones}
        cameras={cameras}
        microphoneId={microphoneId}
        cameraId={cameraId}
        microphoneEnabled={microphoneEnabled}
        cameraEnabled={cameraEnabled}
        joining={phase === 'joining'}
        error={error}
        onMicrophoneChange={(value) => void changeMicrophone(value)}
        onCameraChange={(value) => void changeCamera(value)}
        onMicrophoneToggle={() => void toggleMicrophone()}
        onCameraToggle={() => void toggleCamera()}
        onJoin={() => void join()}
      />
    );
  }

  return (
    <CallView
      media={media}
      remoteUsers={remoteUsers}
      connectionState={connectionState}
      error={error}
      microphones={microphones}
      cameras={cameras}
      microphoneId={microphoneId}
      cameraId={cameraId}
      microphoneEnabled={microphoneEnabled}
      cameraEnabled={cameraEnabled}
      onMicrophoneChange={(value) => void changeMicrophone(value)}
      onCameraChange={(value) => void changeCamera(value)}
      onMicrophoneToggle={() => void toggleMicrophone()}
      onCameraToggle={() => void toggleCamera()}
      onLeave={() => void leave()}
    />
  );
}
