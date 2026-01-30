import { autoMarkReady } from '@/lib/order';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify authorization header if needed (e.g. CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In production, uncomment this
    // return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await autoMarkReady();
    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
