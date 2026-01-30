import { getAvailableSkins, getUpcomingSkins } from '@/lib/order';
import HomePage from './HomePage';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let skins: any[] = [];
  let upcomingSkins: any[] = [];
  const session = await getSession();
  
  try {
    const [available, upcoming] = await Promise.all([
        getAvailableSkins(),
        getUpcomingSkins()
    ]);
    skins = available;
    upcomingSkins = upcoming;
  } catch (error) {
    console.error("Failed to fetch skins:", error);
  }

  return (
    <main>
      <HomePage skins={skins} upcomingSkins={upcomingSkins} session={session} />
    </main>
  );
}
