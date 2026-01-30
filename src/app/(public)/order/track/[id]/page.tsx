import { getOrder } from '@/lib/order';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let order;
  try {
    order = await getOrder(id);
  } catch (error) {
    console.error(error);
  }

  if (!order) {
    return notFound();
  }

  const steps = [
    { status: 'PENDING', label: 'Order Placed' },
    { status: 'ASSIGNED', label: 'Gifter Assigned' },
    { status: 'FOLLOWED', label: 'Friend Request Sent' },
    { status: 'READY_FOR_GIFTING', label: 'Ready to Gift' },
    { status: 'SENT', label: 'Skin Sent' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);

  return (
    <main className="min-h-screen py-8 md:py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl glass-panel p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center heading-gradient">Order Tracking</h1>
        <p className="text-center text-slate-500 mb-8 font-mono text-xs md:text-sm tracking-wider break-all">{order.id}</p>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 px-6 py-4 bg-slate-900/40 rounded-xl border border-white/5">
            <div className="w-full md:w-auto">
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Skin</p>
                <p className="font-bold text-lg text-cyan-400">{order.skin.name}</p>
            </div>
            <div className="w-full md:w-auto md:text-right">
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">IGN</p>
                <p className="font-bold text-slate-200">{order.buyerIGN}</p>
            </div>
        </div>

        {/* Status Timeline */}
        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.status} className="relative pl-12 flex items-center group">
                <div className={`
                  absolute left-0 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300
                  ${isCompleted ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 bg-slate-900 text-slate-700'}
                  ${isCurrent ? 'shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-110 border-cyan-400 bg-cyan-950' : ''}
                `}>
                  {index + 1}
                </div>
                <div className="transition-all duration-300">
                  <h3 className={`font-bold text-lg ${isCompleted ? 'text-slate-200' : 'text-slate-600'}`}>{step.label}</h3>
                  {isCurrent && order.status === 'FOLLOWED' && order.readyAt && (
                     <p className="text-sm text-fuchsia-400 mt-1 font-medium bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20 inline-block">
                        Ready in: {Math.ceil((new Date(order.readyAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                     </p>
                  )}
                  {isCurrent && order.status === 'READY_FOR_GIFTING' && (
                      <p className="text-sm text-emerald-400 mt-1 font-medium">Your skin is ready! It will be sent shortly.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center border-t border-white/5 pt-8">
            <Link href="/order" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Place another order
            </Link>
        </div>
      </div>
    </main>
  );
}
