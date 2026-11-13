import { RoomCanvas } from '@/components/room/room-canvas';
import { SITE_URL } from '@/lib/site';

export const metadata = {
  title: 'The Room',
  alternates: { canonical: `${SITE_URL}/room/` },
  description: "Walk around Adine Johnson's room: games, sound and tools, presented as a point-and-click space.",
};

export default function RoomPage() {
  return <RoomCanvas />;
}
