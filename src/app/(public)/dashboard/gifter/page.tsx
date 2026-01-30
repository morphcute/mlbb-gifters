import { getGifterOrders, getSkinsWithGifterSlots } from '@/lib/order';
import GifterDashboard from '@/app/gifter/GifterDashboard';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await getSession();

  if (!session || session.role !== 'GIFTER') {
      redirect('/login');
  }

  const [orders, skins] = await Promise.all([
    getGifterOrders(session.userId as string),
    getSkinsWithGifterSlots(session.userId as string)
  ]);

  return (
    <main>
      <GifterDashboard orders={orders} skins={skins} />
    </main>
  );
}
