import { notFound } from 'next/navigation';
import { RoomExperience } from '@/components/room-experience';
import { isValidRoomId } from '@/lib/room-id';

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!isValidRoomId(roomId)) notFound();

  return <RoomExperience roomId={roomId} />;
}
