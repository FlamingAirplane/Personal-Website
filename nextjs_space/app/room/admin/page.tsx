import { RoomAdmin } from '@/components/room/admin/room-admin';

export const metadata = {
  title: 'Room admin',
  description: 'Change the numbers, colours, pictures and models the room is made from.',
  robots: { index: false, follow: false },
};

export default function RoomAdminPage() {
  return <RoomAdmin />;
}
