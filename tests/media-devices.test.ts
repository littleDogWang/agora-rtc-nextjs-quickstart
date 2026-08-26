import { describe, expect, it, vi } from 'vitest';
import {
  closeLocalMedia,
  createLocalMedia,
  setMediaEnabled,
  subscribeToDeviceChanges,
  switchMediaDevice,
} from '@/lib/media-devices';
import type {
  DeviceChangeSdk,
  LocalMedia,
  MediaSdk,
} from '@/lib/media-devices';

function createTrack(label: string) {
  return {
    label,
    play: vi.fn(),
    stop: vi.fn(),
    close: vi.fn(),
    setEnabled: vi.fn().mockResolvedValue(undefined),
    setDevice: vi.fn().mockResolvedValue(undefined),
    getTrackLabel: vi.fn(() => label),
  };
}

describe('local media devices', () => {
  it('keeps the working track when the other device fails', async () => {
    const microphone = createTrack('Built-in microphone');
    const sdk = {
      createMicrophoneAudioTrack: vi.fn().mockResolvedValue(microphone),
      createCameraVideoTrack: vi.fn().mockRejectedValue(new Error('camera blocked')),
    };

    const media = await createLocalMedia(sdk as unknown as MediaSdk);

    expect(media.microphone).toBe(microphone);
    expect(media.camera).toBeNull();
    expect(media.errors.camera).toBe('Camera is unavailable.');
  });

  it('switches and enables existing tracks', async () => {
    const track = createTrack('USB device');

    await switchMediaDevice(track, 'device-2');
    await setMediaEnabled(track, false);

    expect(track.setDevice).toHaveBeenCalledWith('device-2');
    expect(track.setEnabled).toHaveBeenCalledWith(false);
  });

  it('stops then closes every owned track', () => {
    const order: string[] = [];
    const microphone = createTrack('microphone');
    const camera = createTrack('camera');
    microphone.stop.mockImplementation(() => order.push('mic-stop'));
    microphone.close.mockImplementation(() => order.push('mic-close'));
    camera.stop.mockImplementation(() => order.push('camera-stop'));
    camera.close.mockImplementation(() => order.push('camera-close'));

    closeLocalMedia({ microphone, camera, errors: {} } as unknown as LocalMedia);

    expect(order).toEqual(['mic-stop', 'mic-close', 'camera-stop', 'camera-close']);
  });

  it('installs and removes Agora device listeners', () => {
    const sdk: {
      onMicrophoneChanged?: (device: unknown) => void;
      onCameraChanged?: (device: unknown) => void;
    } = {};
    const onChange = vi.fn();

    const unsubscribe = subscribeToDeviceChanges(
      sdk as unknown as DeviceChangeSdk,
      onChange,
    );
    sdk.onMicrophoneChanged?.({ state: 'ACTIVE' });
    sdk.onCameraChanged?.({ state: 'INACTIVE' });

    expect(onChange).toHaveBeenCalledTimes(2);
    unsubscribe();
    expect(sdk.onMicrophoneChanged).toBeUndefined();
    expect(sdk.onCameraChanged).toBeUndefined();
  });
});
