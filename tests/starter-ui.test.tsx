import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import type { LocalMedia } from '@/lib/media-devices';
import { RoomHome } from '@/components/room-home';
import { PreJoin } from '@/components/pre-join';
import { CallView } from '@/components/call-view';

const push = vi.fn();
const writeText = vi.fn().mockResolvedValue(undefined);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { priority: _priority, ...imageProps } = props;
    void _priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...imageProps} alt={String(props.alt ?? '')} />;
  },
}));

afterEach(() => {
  cleanup();
  push.mockReset();
  writeText.mockClear();
});

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: { writeText },
});

const emptyMedia = {
  microphone: null,
  camera: null,
  errors: {},
} as LocalMedia;

describe('starter UI', () => {
  it('creates a room from the starter-aligned entry card', () => {
    render(<RoomHome />);

    fireEvent.click(screen.getByRole('button', { name: /create room/i }));

    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/room\/[0-9a-f-]{36}$/));
    expect(screen.getByText(/powered by/i)).toBeInTheDocument();
  });

  it('keeps media local until the explicit Join Call command', () => {
    const onJoin = vi.fn();
    render(
      <PreJoin
        media={emptyMedia}
        microphones={[]}
        cameras={[]}
        microphoneId=""
        cameraId=""
        microphoneEnabled={false}
        cameraEnabled={false}
        joining={false}
        error={null}
        onMicrophoneChange={vi.fn()}
        onCameraChange={vi.fn()}
        onMicrophoneToggle={vi.fn()}
        onCameraToggle={vi.fn()}
        onJoin={onJoin}
      />,
    );

    expect(screen.getByText(/stays local until you join/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join call/i })).toBeDisabled();
    expect(onJoin).not.toHaveBeenCalled();
  });

  it('keeps invite copy visible before joining', async () => {
    render(
      <PreJoin
        media={emptyMedia}
        microphones={[]}
        cameras={[]}
        microphoneId=""
        cameraId=""
        microphoneEnabled={false}
        cameraEnabled={false}
        joining={false}
        error={null}
        onMicrophoneChange={vi.fn()}
        onCameraChange={vi.fn()}
        onMicrophoneToggle={vi.fn()}
        onCameraToggle={vi.fn()}
        onJoin={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(window.location.href));
    expect(screen.getByRole('button', { name: /invite link copied/i })).toBeInTheDocument();
  });

  it('uses automatic devices until manual selection is requested', () => {
    render(
      <PreJoin
        media={emptyMedia}
        microphones={[{ deviceId: 'mic-1', label: 'Studio microphone' } as MediaDeviceInfo]}
        cameras={[{ deviceId: 'cam-1', label: 'Desk camera' } as MediaDeviceInfo]}
        microphoneId="mic-1"
        cameraId="cam-1"
        microphoneEnabled={false}
        cameraEnabled={false}
        joining={false}
        error={null}
        onMicrophoneChange={vi.fn()}
        onCameraChange={vi.fn()}
        onMicrophoneToggle={vi.fn()}
        onCameraToggle={vi.fn()}
        onJoin={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Microphone')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Camera')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /select devices/i }));

    expect(screen.getByLabelText('Microphone')).toBeInTheDocument();
    expect(screen.getByLabelText('Camera')).toBeInTheDocument();
  });

  it('treats single-client waiting as a connected call state', () => {
    render(
      <CallView
        media={emptyMedia}
        remoteUsers={[]}
        connectionState="CONNECTED"
        error={null}
        microphones={[]}
        cameras={[]}
        microphoneId=""
        cameraId=""
        microphoneEnabled={false}
        cameraEnabled={false}
        onMicrophoneChange={vi.fn()}
        onCameraChange={vi.fn()}
        onMicrophoneToggle={vi.fn()}
        onCameraToggle={vi.fn()}
        onLeave={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/waiting for another participant/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invite participant/i })).toBeInTheDocument();

    for (const label of [
      'Unmute microphone',
      'Turn camera on',
      'Select devices',
      'Copy invite link',
      'Leave call',
    ]) {
      const button = screen.getByRole('button', { name: label });
      const tooltip = screen.getByRole('tooltip', { name: label });

      expect(tooltip).toHaveAttribute('id');
      expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    }
  });

  it('shows the complete two-participant state when a peer joins', () => {
    render(
      <CallView
        media={emptyMedia}
        remoteUsers={[{ uid: 77 } as IAgoraRTCRemoteUser]}
        connectionState="CONNECTED"
        error={null}
        microphones={[]}
        cameras={[]}
        microphoneId=""
        cameraId=""
        microphoneEnabled={false}
        cameraEnabled={false}
        onMicrophoneChange={vi.fn()}
        onCameraChange={vi.fn()}
        onMicrophoneToggle={vi.fn()}
        onCameraToggle={vi.fn()}
        onLeave={vi.fn()}
      />,
    );

    expect(screen.getByText('2 participants')).toBeInTheDocument();
    expect(screen.getByText('Participant 77')).toBeInTheDocument();
  });
});
