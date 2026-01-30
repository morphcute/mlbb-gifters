import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default async function TrackPage(props: { searchParams: Promise<{ id?: string; server?: string }> }) {
  const searchParams = await props.searchParams;
  const { id, server } = searchParams;
  
  let orders: any[] = [];
  let searched = false;

  if (id && server) {
    searched = true;
    orders = await prisma.order.findMany({
      where: {
        buyerMLID: id,
        buyerServer: server,
      },
      include: {
        skin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'ASSIGNED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'FOLLOWED': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'READY_FOR_GIFTING': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'SENT': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <main className="min-h-screen py-12 px-4 flex flex-col items-center relative">
      <div className="w-full max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold heading-gradient">Track Order</h1>
        </div>

        {/* Search Form */}
        <div className="glass-panel p-8 mb-8">
            <form className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">MLBB ID</label>
                    <input 
                        name="id" 
                        type="text" 
                        defaultValue={id || ''} 
                        placeholder="e.g. 12345678"
                        className="form-input bg-slate-900/50 w-full"
                        required 
                    />
                </div>
                <div className="w-full md:w-32">
                    <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Server</label>
                    <input 
                        name="server" 
                        type="text" 
                        defaultValue={server || ''} 
                        placeholder="e.g. 1234"
                        className="form-input bg-slate-900/50 w-full"
                        required 
                    />
                </div>
                <button type="submit" className="btn btn-primary w-full md:w-auto h-[42px]">
                    Track Orders
                </button>
            </form>
        </div>

        {/* Results */}
        {searched && (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-cyan-400">Found {orders.length} orders</span>
                    <span className="text-slate-500 text-sm font-normal">for ID: {id} ({server})</span>
                </h2>

                {orders.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="text-6xl mb-4 opacity-20">🔍</div>
                        <h3 className="text-xl font-bold text-slate-300 mb-2">No orders found</h3>
                        <p className="text-slate-400">We couldn't find any orders matching these details.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {orders.map((order) => (
                            <div key={order.id} className="glass-card p-6 flex flex-col md:flex-row gap-6 items-center md:items-start transition-all hover:bg-white/[0.02]">
                                <div className="w-full md:w-auto flex-shrink-0">
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                                        🎮
                                    </div>
                                </div>
                                
                                <div className="flex-1 w-full text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-white">{order.skin.name}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)} inline-block w-fit mx-auto md:mx-0`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                                        <div className="bg-slate-950/30 p-2 rounded-lg border border-white/5">
                                            <div className="text-slate-500 text-xs mb-1">Order ID</div>
                                            <div className="font-mono text-slate-300 truncate" title={order.id}>#{order.id.slice(-6)}</div>
                                        </div>
                                        <div className="bg-slate-950/30 p-2 rounded-lg border border-white/5">
                                            <div className="text-slate-500 text-xs mb-1">Created</div>
                                            <div className="text-slate-300">{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        {order.followedAt && (
                                            <div className="bg-slate-950/30 p-2 rounded-lg border border-white/5">
                                                <div className="text-slate-500 text-xs mb-1">Followed</div>
                                                <div className="text-slate-300">{new Date(order.followedAt).toLocaleDateString()}</div>
                                            </div>
                                        )}
                                        {order.sentAt && (
                                            <div className="bg-slate-950/30 p-2 rounded-lg border border-white/5">
                                                <div className="text-slate-500 text-xs mb-1">Sent</div>
                                                <div className="text-emerald-400 font-bold">{new Date(order.sentAt).toLocaleDateString()}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar Visual */}
                                    <div className="mt-6 relative pt-4 pb-2">
                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                                                style={{ 
                                                    width: 
                                                        order.status === 'PENDING' ? '20%' :
                                                        order.status === 'ASSIGNED' ? '40%' :
                                                        order.status === 'FOLLOWED' ? '60%' :
                                                        order.status === 'READY_FOR_GIFTING' ? '80%' :
                                                        order.status === 'SENT' ? '100%' : '0%'
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                            <span>Ordered</span>
                                            <span>Processing</span>
                                            <span>Sent</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-shrink-0">
                                    <Link 
                                        href={`/order/track/${order.id}`}
                                        className="btn btn-secondary text-xs h-8 px-3"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </main>
  );
}