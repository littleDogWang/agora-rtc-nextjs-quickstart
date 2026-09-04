'use client';

import { useState } from 'react';
import { Camera, CameraOff, Loader2, Mic, MicOff, PhoneCall, Settings } from 'lucide-react';
import type { LocalMedia } from '@/lib/media-devices';
import { BrandFooter } from '@/components/brand-footer';
import { Button } from '@/components/ui/button';
import { DeviceSelect } from '@/components/device-select';
import { InviteButton } from '@/components/invite-button';
import { VideoTile } from '@/components/video-tile';

type PreJoinProps = {
  media: LocalMedia;
  microphones: MediaDeviceInfo[];
  cameras: MediaDeviceInfo[];
  microphoneId: string;
  cameraId: string;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
  joining: boolean;
  error: string | null;
  onMicrophoneChange: (deviceId: string) => void;
  onCameraChange: (deviceId: string) => void;
  onMicrophoneToggle: () => void;
  onCameraToggle: () => void;
  onJoin: () => void;
};

export function PreJoin({
  media,
  microphones,
  cameras,
  microphoneId,
  cameraId,
  microphoneEnabled,
  cameraEnabled,
  joining,
  error,
  onMicrophoneChange,
  onCameraChange,
  onMicrophoneToggle,
  onCameraToggle,
  onJoin,
}: PreJoinProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-background px-4 py-16 text-foreground">
      <section className="dark-panel grid w-full max-w-4xl animate-fade-up gap-6 rounded-[20px] p-5 md:grid-cols-[1.35fr_1fr] md:p-7">
        <div className="flex min-w-0 items-center">
          <VideoTile
            label="You"
            localTrack={media.camera}
            videoEnabled={cameraEnabled}
            waitingMessage={media.camera ? 'Camera is off' : 'No camera available'}
            compact
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center text-white">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Ready to join</p>
          <h1 className="mt-2 text-2xl font-medium">Check your camera and microphone</h1>
          <p className="mt-2 text-sm leading-6 text-[#858c99]">
            Your media stays local until you join the room.
          </p>

          <div className="mt-6 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={!media.microphone}
              onClick={onMicrophoneToggle}
              title={microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
              aria-label={microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {microphoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={!media.camera}
              onClick={onCameraToggle}
              title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
              aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
            >
              {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setSettingsOpen((open) => !open)}
              title="Select devices"
              aria-label="Select devices"
              aria-expanded={settingsOpen}
              aria-controls="prejoin-device-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {settingsOpen && (
            <div
              id="prejoin-device-settings"
              className="mt-5 flex flex-col gap-4 rounded-lg border border-[#343434] bg-[#151515] p-4"
            >
              <DeviceSelect
                id="prejoin-microphone"
                label="Microphone"
                devices={microphones}
                value={microphoneId}
                onChange={onMicrophoneChange}
              />
              <DeviceSelect
                id="prejoin-camera"
                label="Camera"
                devices={cameras}
                value={cameraId}
                onChange={onCameraChange}
              />
            </div>
          )}

          {Object.values(media.errors).map((message) => (
            <p key={message} className="mt-3 text-xs text-amber-300">{message}</p>
          ))}
          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <InviteButton className="w-full" />
            <Button className="w-full" onClick={onJoin} disabled={joining || (!media.microphone && !media.camera)}>
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
              {joining ? 'Joining...' : 'Join Call'}
            </Button>
          </div>
        </div>
      </section>
      <BrandFooter />
    </main>
  );
}
