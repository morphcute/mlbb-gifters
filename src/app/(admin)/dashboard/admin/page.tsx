import { getAllOrders, getAllSkins, getAllGifters, getUnusedSlots, getBannedUsers } from '@/lib/order';
import AdminDashboard from '@/app/admin/AdminDashboard';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
      redirect('/login');
  }

  const [orders, skins, gifters, unusedSlots, bannedUsers] = await Promise.all([
    getAllOrders(),
    getAllSkins(),
    getAllGifters(),
    getUnusedSlots(),
    getBannedUsers()
  ]);

  return (
    <main>
      <AdminDashboard 
        orders={orders} 
        skins={skins} 
        gifters={gifters} 
        unusedSlots={unusedSlots}
        bannedUsers={bannedUsers}
      />
    </main>
  );
}
