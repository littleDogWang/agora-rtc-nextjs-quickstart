'use client';

import { useState } from 'react';
import { Camera, CameraOff, Check, Copy, Mic, MicOff, PhoneOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceSelect } from '@/components/device-select';

type CallControlsProps = {
  microphones: MediaDeviceInfo[];
  cameras: MediaDeviceInfo[];
  microphoneId: string;
  cameraId: string;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
  microphoneAvailable: boolean;
  cameraAvailable: boolean;
  onMicrophoneChange: (deviceId: string) => void;
  onCameraChange: (deviceId: string) => void;
  onMicrophoneToggle: () => void;
  onCameraToggle: () => void;
  onLeave: () => void;
};

export function CallControls({
  microphones,
  cameras,
  microphoneId,
  cameraId,
  microphoneEnabled,
  cameraEnabled,
  microphoneAvailable,
  cameraAvailable,
  onMicrophoneChange,
  onCameraChange,
  onMicrophoneToggle,
  onCameraToggle,
  onLeave,
}: CallControlsProps) {
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const copyInvite = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="relative flex justify-center">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card/90 p-2 shadow-lg backdrop-blur-md">
        <Button
          variant="secondary"
          size="icon"
          disabled={!microphoneAvailable}
          onClick={onMicrophoneToggle}
          title={microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
          aria-label={microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {microphoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          disabled={!cameraAvailable}
          onClick={onCameraToggle}
          title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
        >
          {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
        </Button>

        <div className="relative">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => setSettingsOpen((open) => !open)}
            title="Select devices"
            aria-label="Select devices"
            aria-expanded={settingsOpen}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {settingsOpen && (
            <div className="absolute bottom-14 left-1/2 z-30 flex w-[min(88vw,22rem)] -translate-x-1/2 flex-col gap-4 rounded-xl border border-[#353535] bg-[#151515] p-4 text-white shadow-2xl">
              <DeviceSelect
                id="call-microphone"
                label="Microphone"
                devices={microphones}
                value={microphoneId}
                onChange={onMicrophoneChange}
              />
              <DeviceSelect
                id="call-camera"
                label="Camera"
                devices={cameras}
                value={cameraId}
                onChange={onCameraChange}
              />
            </div>
          )}
        </div>

        <Button variant="secondary" size="icon" onClick={copyInvite} title="Copy invite link" aria-label="Copy invite link">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button variant="destructive" size="icon" onClick={onLeave} title="Leave call" aria-label="Leave call">
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
