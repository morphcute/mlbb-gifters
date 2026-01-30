'use client';

import { Order, Skin, User } from '@prisma/client';
import { actionMarkFollowed, actionMarkSent, actionAddMySlot } from '../actions';
import { useState } from 'react';

type OrderWithDetails = Order & { skin: Skin; buyer: User };
type SkinWithCount = Skin & { _count: { slots: number } };

export default function GifterDashboard({ orders, skins }: { orders: OrderWithDetails[], skins: SkinWithCount[] }) {
  const [slotQuantity, setSlotQuantity] = useState(1);

  // Filter for orders relevant to gifters (assigned, followed, ready)
  const activeOrders = orders.filter(o => 
    ['ASSIGNED', 'FOLLOWED', 'READY_FOR_GIFTING'].includes(o.status)
  );
  
  const historyOrders = orders.filter(o => o.status === 'SENT');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 md:mb-10 heading-gradient">GIFTER DASHBOARD</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                <span className="text-cyan-400">⚡</span> Active Tasks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeOrders.map((order) => (
                <div key={order.id} className="glass-panel p-6 flex flex-col justify-between min-h-[250px] group hover:border-cyan-500/30 transition-all duration-300">
                    <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {order.status}
                        </span>
                        <span className="text-slate-500 text-xs font-mono">{order.id.slice(-6)}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-200 mb-1 group-hover:text-cyan-400 transition-colors">{order.skin.name}</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        To: <span className="text-slate-200 font-bold">{order.buyerIGN}</span> <span className="text-xs">({order.buyerMLID})</span>
                    </p>
                    
                    {order.status === 'FOLLOWED' && order.readyAt && (
                        <div className="bg-fuchsia-500/10 p-3 rounded-lg border border-fuchsia-500/20 mb-4">
                            <p className="text-xs text-fuchsia-400 mb-1 uppercase tracking-wider font-semibold">Cooldown ends</p>
                            <p className="font-mono text-sm text-slate-200">{new Date(order.readyAt).toLocaleDateString()}</p>
                        </div>
                    )}
                    </div>

                    <div className="mt-4">
                    {order.status === 'ASSIGNED' && (
                        <button 
                        onClick={() => actionMarkFollowed(order.id)}
                        className="w-full btn btn-primary text-sm"
                        >
                        Mark Followed (Start 7 Days)
                        </button>
                    )}
                    
                    {order.status === 'FOLLOWED' && (
                        <button disabled className="w-full btn btn-secondary opacity-50 cursor-not-allowed text-sm">
                        Waiting for Cooldown...
                        </button>
                    )}

                    {order.status === 'READY_FOR_GIFTING' && (
                        <button 
                        onClick={() => actionMarkSent(order.id)}
                        className="w-full btn bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 border-emerald-400/20 text-sm"
                        >
                        Mark Sent
                        </button>
                    )}
                    </div>
                </div>
                ))}

                {activeOrders.length === 0 && (
                <div className="col-span-full text-center py-16 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                    No active tasks found.
                </div>
                )}
            </div>
        </div>

        <div className="lg:col-span-1">
            <div className="glass-panel p-6 sticky top-6">
                <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                    <span className="text-cyan-400">➕</span> Add My Inventory
                </h2>
                <form action={actionAddMySlot} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">I have available:</label>
                        <select name="skinId" className="form-input bg-slate-900 text-slate-200">
                            {skins.map(skin => (
                                <option key={skin.id} value={skin.id}>
                                    {skin.name} ({skin.price}💎) • {skin._count.slots} Available
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Quantity Selector */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Quantity</label>
                        <div className="flex items-center gap-4">
                            <button 
                                type="button" 
                                onClick={() => setSlotQuantity(Math.max(1, slotQuantity - 1))}
                                className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700 flex items-center justify-center text-xl font-bold text-cyan-400"
                            >
                                -
                            </button>
                            <input 
                                type="hidden" 
                                name="quantity" 
                                value={slotQuantity} 
                            />
                            <div className="w-16 text-center font-mono text-xl font-bold text-white">
                                {slotQuantity}
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setSlotQuantity(slotQuantity + 1)}
                                className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700 flex items-center justify-center text-xl font-bold text-cyan-400"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-4">
                        Add to My Inventory
                    </button>
                </form>

                <div className="mt-8 border-t border-white/10 pt-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <span className="text-emerald-400">📦</span> My Inventory
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {skins.filter(s => s._count.slots > 0).length > 0 ? (
                            skins.filter(s => s._count.slots > 0).map(skin => (
                                <div key={skin.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                    <span className="text-slate-300 font-medium text-sm">{skin.name}</span>
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs">{skin._count.slots}</span>
                                </div>
                            ))
                        ) : (
                             <p className="text-slate-500 text-sm italic text-center py-2">No slots added yet.</p>
                        )}
                    </div>
                </div>
                
                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-white/5 text-xs text-slate-400">
                    <p>Adding slots tells the admin you have these skins available to gift. You will be assigned orders based on this inventory.</p>
                </div>
            </div>
        </div>
      </div>

      {historyOrders.length > 0 && (
        <div className="glass-panel overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-slate-900/40">
                <h2 className="text-xl font-bold text-slate-200">History (Sent)</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-cyan-400/80 bg-slate-900/40">
                            <th className="p-4 font-semibold">Skin</th>
                            <th className="p-4 font-semibold">Buyer</th>
                            <th className="p-4 font-semibold">Sent Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {historyOrders.map(order => (
                            <tr key={order.id} className="hover:bg-white/5 transition-colors opacity-75">
                                <td className="p-4 text-fuchsia-400 font-medium">{order.skin.name}</td>
                                <td className="p-4">
                                    <span className="font-bold text-slate-200">{order.buyerIGN}</span>
                                    <span className="text-xs text-slate-500 ml-2">({order.buyerMLID})</span>
                                </td>
                                <td className="p-4 text-sm text-slate-400">
                                    {order.sentAt ? new Date(order.sentAt).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ASSIGNED': return 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10';
    case 'FOLLOWED': return 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10';
    case 'READY_FOR_GIFTING': return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
    case 'SENT': return 'border-slate-500/30 text-slate-400 bg-slate-500/10';
    default: return 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10';
  }
}
