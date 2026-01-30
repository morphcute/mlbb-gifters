'use client';

import { Order, Skin, User, GifterSlot } from '@prisma/client';
import { actionAssignGifter, actionAddSlot, actionCreateGifter, actionCreateSkin, actionUpdateSkin, actionRefundOrder, actionDeleteOrder, actionInvalidOrder, actionBanUser, actionUnbanUser } from '../actions';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type OrderWithDetails = Order & { skin: Skin; buyer: User };
type SkinWithCount = Skin & { _count: { slots: number } };
type GifterBasic = { id: string; name: string; email: string };
type UnusedSlot = GifterSlot & { skin: Skin; gifter: GifterBasic };
type BannedUser = User & { banReason: string | null };

export default function AdminDashboard({ orders, skins, gifters, unusedSlots, bannedUsers }: { 
    orders: OrderWithDetails[], 
    skins: SkinWithCount[], 
    gifters: GifterBasic[],
    unusedSlots: UnusedSlot[],
    bannedUsers: BannedUser[]
}) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'archive' | 'gifters' | 'skins' | 'refunds' | 'banned'>('orders');
  const [slotQuantity, setSlotQuantity] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Auto-hide on mobile init
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        } else {
            setIsSidebarOpen(true);
        }
    };

    // Set initial state
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [banModal, setBanModal] = useState<{ isOpen: boolean, userId: string, name: string }>({ isOpen: false, userId: '', name: '' });
  const [editSkinModal, setEditSkinModal] = useState<{ isOpen: boolean, skin: Skin | null }>({ isOpen: false, skin: null });
  const [expandedGifterId, setExpandedGifterId] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean, orderId: string, skinId: string }>({ isOpen: false, orderId: '', skinId: '' });

  const activeOrders = orders.filter(o => !['SENT', 'REFUNDED', 'INVALID'].includes(o.status));
  const archivedOrders = orders.filter(o => o.status === 'SENT');
  const refundedOrders = orders.filter(o => ['REFUNDED', 'INVALID'].includes(o.status));

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'gifter' | null, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const handleSort = (key: 'date' | 'gifter') => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const sortedActiveOrders = [...activeOrders].sort((a, b) => {
      if (sortConfig.key === 'date') {
          return sortConfig.direction === 'asc' 
              ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortConfig.key === 'gifter') {
          const gifterA = gifters.find(g => g.id === a.gifterId)?.name || '';
          const gifterB = gifters.find(g => g.id === b.gifterId)?.name || '';
          if (gifterA === '' && gifterB === '') return 0;
          if (gifterA === '') return 1; // Unassigned at bottom
          if (gifterB === '') return -1;
          return sortConfig.direction === 'asc'
              ? gifterA.localeCompare(gifterB)
              : gifterB.localeCompare(gifterA);
      }
      return 0;
  });

  // Group unused slots by Skin, then by Gifter
  const inventoryBySkin = skins.map(skin => {
      const slotsForSkin = unusedSlots.filter(s => s.skinId === skin.id);
      
      // Group by gifter
      const gifterCounts: Record<string, { name: string, count: number }> = {};
      slotsForSkin.forEach(slot => {
          if (!gifterCounts[slot.gifterId]) {
              gifterCounts[slot.gifterId] = { name: slot.gifter.name, count: 0 };
          }
          gifterCounts[slot.gifterId].count++;
      });

      return {
          ...skin,
          totalSlots: slotsForSkin.length,
          breakdown: Object.values(gifterCounts)
      };
  });

  const NavButton = ({ tab, label, icon }: { tab: typeof activeTab, label: string, icon: string }) => (
      <button 
          onClick={() => {
              setActiveTab(tab);
              // On mobile, close sidebar after selection
              if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-all duration-200 rounded-lg group text-sm ${
              activeTab === tab 
                  ? 'bg-[#212121] text-slate-100' 
                  : 'text-slate-400 hover:bg-[#212121] hover:text-slate-200'
          } ${!isSidebarOpen && window.innerWidth >= 768 ? 'justify-center px-0' : ''}`}
          title={!isSidebarOpen && window.innerWidth >= 768 ? label : undefined}
      >
          <span className="text-base">{icon}</span>
          {/* Hide label if sidebar is closed on Desktop */}
          {(!isSidebarOpen && window.innerWidth >= 768) ? null : (
            <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                {label}
            </span>
          )}
      </button>
  );

  const NavLink = ({ href, label, icon }: { href: string, label: string, icon: string }) => (
      <Link 
          href={href}
          className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-all duration-200 rounded-lg group text-sm text-slate-400 hover:bg-[#212121] hover:text-slate-200 ${!isSidebarOpen && window.innerWidth >= 768 ? 'justify-center px-0' : ''}`}
          title={!isSidebarOpen && window.innerWidth >= 768 ? label : undefined}
      >
          <span className="text-base">{icon}</span>
          {(!isSidebarOpen && window.innerWidth >= 768) ? null : (
            <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                {label}
            </span>
          )}
      </Link>
  );

  return (
    <div className="flex min-h-screen bg-black selection:bg-cyan-500/30">
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-[#171717] flex flex-col fixed h-full z-50 transition-all duration-300 ease-in-out border-r border-[#333]
        ${isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full md:w-[72px] md:translate-x-0'}
      `}>
        <div className={`p-4 relative flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {isSidebarOpen && (
                <h1 className="text-sm font-semibold text-slate-200 px-2 py-2 hover:bg-[#212121] rounded-lg cursor-pointer transition-colors flex items-center gap-2 flex-1 whitespace-nowrap overflow-hidden">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">🤖</span>
                    Admin Console
                </h1>
            )}
            
            {/* Sidebar Toggle (Inside) */}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 text-slate-400 hover:text-white hover:bg-[#212121] rounded-lg transition-colors ${!isSidebarOpen ? 'w-full flex justify-center' : ''}`}
                title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
                <span className="text-xl">◫</span>
            </button>
        </div>
        
        <nav className="flex-1 space-y-1 px-2 py-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
            {isSidebarOpen && <div className="text-xs font-medium text-slate-500 px-3 py-2 animate-in fade-in">General</div>}
            <NavButton tab="orders" label="Active Orders" icon="⚡" />
            <NavButton tab="inventory" label="Inventory" icon="📦" />
            <NavButton tab="gifters" label="Gifters" icon="👥" />
            
            {isSidebarOpen && <div className="text-xs font-medium text-slate-500 px-3 py-2 mt-4 animate-in fade-in">Management</div>}
            <NavButton tab="skins" label="Skins" icon="💎" />
            <NavButton tab="refunds" label="Refunds / Invalid" icon="🚫" />
            <NavButton tab="banned" label="Banned Users" icon="🔨" />
            <NavButton tab="archive" label="Archive" icon="📁" />

            {isSidebarOpen && <div className="text-xs font-medium text-slate-500 px-3 py-2 mt-4 animate-in fade-in">Navigation</div>}
            <NavLink href="/" label="Back to Home" icon="🏠" />
            <NavLink href="/profile" label="My Account" icon="👤" />
        </nav>

        <div className="p-4 border-t border-[#333]">
            <div className={`flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#212121] transition-colors cursor-pointer group ${!isSidebarOpen ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs shrink-0">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                {isSidebarOpen && (
                    <div className="flex flex-col whitespace-nowrap overflow-hidden">
                        <span className="text-sm text-slate-200 font-medium group-hover:text-white">System Online</span>
                        <span className="text-xs text-slate-500">v1.1.0</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 min-h-screen bg-[#212121] transition-all duration-300 ${isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-[88px] ml-0'}`}>
        <div className="max-w-6xl mx-auto p-4 md:p-10 pt-16 md:pt-10">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-200 capitalize">{activeTab} Management</h2>
                </div>
            </div>

            {activeTab === 'orders' && (
                <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-cyan-400/80 bg-slate-900/40">
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Buyer</th>
                        <th className="p-4 font-semibold">Skin</th>
                        <th 
                            className="p-4 font-semibold cursor-pointer hover:text-cyan-300 transition-colors select-none group"
                            onClick={() => handleSort('gifter')}
                        >
                            <div className="flex items-center gap-2">
                                Gifter
                                {sortConfig.key === 'gifter' && (
                                    <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </div>
                        </th>
                        <th className="p-4 font-semibold">Status</th>
                        <th 
                            className="p-4 font-semibold cursor-pointer hover:text-cyan-300 transition-colors select-none group"
                            onClick={() => handleSort('date')}
                        >
                            <div className="flex items-center gap-2">
                                Date
                                {sortConfig.key === 'date' && (
                                    <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </div>
                        </th>
                        <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedActiveOrders.map((order) => {
                            const assignedGifter = gifters.find(g => g.id === order.gifterId);
                            return (
                            <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-mono text-xs text-slate-500">{order.id.slice(-6)}</td>
                                <td className="p-4">
                                <div className="font-bold text-slate-200">{order.buyerIGN}</div>
                                <div className="text-xs text-slate-500">{order.buyerMLID}</div>
                                </td>
                                <td className="p-4 text-fuchsia-400 font-medium">{order.skin.name}</td>
                                <td className="p-4 text-slate-300">
                                    {assignedGifter ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{assignedGifter.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-600 text-xs italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                                </td>
                                <td className="p-4 text-sm text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {(order.status === 'PENDING' || order.status === 'ASSIGNED') && (
                                            <button 
                                                onClick={() => setAssignModal({ isOpen: true, orderId: order.id, skinId: order.skinId })}
                                                className={`text-xs py-1.5 px-3 rounded font-medium transition-colors border whitespace-nowrap ${
                                                    order.status === 'ASSIGNED' 
                                                        ? 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white' 
                                                        : 'bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400'
                                                }`}
                                            >
                                                {order.status === 'ASSIGNED' ? 'Re-assign' : 'Assign'}
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => {
                                                if(confirm('Mark as Refunded?')) actionRefundOrder(order.id);
                                            }}
                                            className="p-1.5 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 transition-colors"
                                            title="Refund"
                                        >
                                            💸
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(confirm('Mark as Invalid?')) actionInvalidOrder(order.id);
                                            }}
                                            className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                                            title="Invalid"
                                        >
                                            🚫
                                        </button>
                                        <button 
                                            onClick={() => setBanModal({ isOpen: true, userId: order.buyerId, name: order.buyerIGN })}
                                            className="p-1.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-500 transition-colors"
                                            title="Ban User"
                                        >
                                            🔨
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                        {activeOrders.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-500">No active orders found.</td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>
                </div>
            )}

            {activeTab === 'refunds' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Refunded & Invalid Orders</h2>
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                                        <th className="p-4">Order ID</th>
                                        <th className="p-4">Buyer</th>
                                        <th className="p-4">Skin</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {refundedOrders.map(order => (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono text-xs text-slate-400">{order.id.slice(0, 8)}</td>
                                            <td className="p-4">
                                                <div className="text-white font-medium">{order.buyerIGN}</div>
                                                <div className="text-xs text-slate-400">{order.buyerMLID} ({order.buyerServer})</div>
                                            </td>
                                            <td className="p-4 text-cyan-400">{order.skin.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    order.status === 'REFUNDED' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => {
                                                        if(confirm('Delete permanently?')) actionDeleteOrder(order.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 transition-colors text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {refundedOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500">No refunded or invalid orders</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'banned' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Banned Users</h2>
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                                        <th className="p-4">User</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Reason</th>
                                        <th className="p-4">Banned At</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {bannedUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-white font-medium">{user.name || 'Unknown'}</td>
                                            <td className="p-4 text-slate-400">{user.email}</td>
                                            <td className="p-4 text-red-300">{user.banReason || 'No reason'}</td>
                                            <td className="p-4 text-slate-500 text-sm">
                                                -
                                            </td>
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => {
                                                        if(confirm(`Unban ${user.name}?`)) actionUnbanUser(user.id);
                                                    }}
                                                    className="px-3 py-1.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors text-xs"
                                                >
                                                    Unban
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {bannedUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500">No banned users</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'archive' && (
                <div className="glass-panel overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-slate-900/40">
                    <h3 className="text-xl font-bold text-slate-200">Archived Orders (Sent)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-cyan-400/80 bg-slate-900/40">
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Buyer</th>
                        <th className="p-4 font-semibold">Skin</th>
                        <th className="p-4 font-semibold">Sent Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {archivedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors opacity-75">
                            <td className="p-4 font-mono text-xs text-slate-500">{order.id.slice(-6)}</td>
                            <td className="p-4">
                            <div className="font-bold text-slate-200">{order.buyerIGN}</div>
                            <div className="text-xs text-slate-500">{order.buyerMLID}</div>
                            </td>
                            <td className="p-4 text-fuchsia-400 font-medium">{order.skin.name}</td>
                            <td className="p-4 text-sm text-slate-400">
                            {order.sentAt ? new Date(order.sentAt).toLocaleDateString() : 'Unknown'}
                            </td>
                        </tr>
                        ))}
                        {archivedOrders.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-500">No archived orders found.</td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>
                </div>
            )}

            {activeTab === 'gifters' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <span className="text-cyan-400">👥</span> Create Gifter Account
                        </h3>
                        <form action={actionCreateGifter} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Full Name</label>
                                <input 
                                    name="name" 
                                    type="text" 
                                    placeholder="e.g. John Doe"
                                    className="form-input bg-slate-900 text-slate-200 w-full"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                                <input 
                                    name="email" 
                                    type="email" 
                                    placeholder="e.g. john@example.com"
                                    className="form-input bg-slate-900 text-slate-200 w-full"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Password</label>
                                <input 
                                    name="password" 
                                    type="password" 
                                    placeholder="••••••••"
                                    className="form-input bg-slate-900 text-slate-200 w-full"
                                    required 
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-4">
                                Create Account
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <span className="text-cyan-400">📋</span> Active Gifters
                        </h3>
                        <div className="space-y-3">
                            {gifters.map(gifter => {
                                const isExpanded = expandedGifterId === gifter.id;
                                const gifterOrders = orders.filter(o => 
                                    o.gifterId === gifter.id && 
                                    ['ASSIGNED', 'FOLLOWED', 'READY_FOR_GIFTING'].includes(o.status)
                                );

                                return (
                                    <div key={gifter.id} className={`rounded-lg bg-slate-900/30 border transition-all duration-200 ${isExpanded ? 'border-cyan-500/30 bg-slate-900/50' : 'border-white/5 hover:bg-slate-900/40'}`}>
                                        <div 
                                            onClick={() => setExpandedGifterId(isExpanded ? null : gifter.id)}
                                            className="flex justify-between items-center p-3 cursor-pointer select-none"
                                        >
                                            <div>
                                                <div className="text-slate-200 font-bold">{gifter.name}</div>
                                                <div className="text-xs text-slate-500">{gifter.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {gifterOrders.length > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                        {gifterOrders.length} Pending
                                                    </span>
                                                )}
                                                <span className={`px-2 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    ▼
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {isExpanded && (
                                            <div className="p-3 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2 duration-200">
                                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pending Tasks</h4>
                                                {gifterOrders.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {gifterOrders.map(order => (
                                                            <div key={order.id} className="flex justify-between items-center p-2 rounded bg-white/5 text-sm hover:bg-white/10 transition-colors">
                                                                <div>
                                                                    <div className="text-slate-300 font-medium">{order.skin.name}</div>
                                                                    <div className="text-xs text-slate-500">
                                                                        ID: <span className="font-mono text-slate-400">{order.id.slice(-6)}</span> • Buyer: {order.buyerIGN}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(order.status)}`}>
                                                                        {order.status}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-600">
                                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-500 text-sm italic text-center py-2">No pending orders assigned.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {gifters.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    No gifters found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'skins' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <span className="text-cyan-400">💎</span> Create New Skin
                        </h3>
                        <form action={actionCreateSkin} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Skin Name</label>
                                <input 
                                    name="name" 
                                    type="text" 
                                    placeholder="e.g. Starlight January 2024"
                                    className="form-input bg-slate-900 text-slate-200 w-full"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Price (Diamonds)</label>
                                <input 
                                    name="price" 
                                    type="number" 
                                    placeholder="e.g. 300"
                                    className="form-input bg-slate-900 text-slate-200 w-full"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Display Price (e.g. 2800 PHP)</label>
                                <input 
                                    name="displayPrice" 
                                    type="text" 
                                    placeholder="e.g. 2800 PHP"
                                    className="form-input bg-slate-900 text-slate-200 w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Description</label>
                                <textarea 
                                    name="description" 
                                    placeholder="e.g. Requires 7 days friendship..."
                                    className="form-input bg-slate-900 text-slate-200 w-full min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Image URL (Optional)</label>
                                <input 
                                    name="imageUrl" 
                                    type="url" 
                                    placeholder="https://..."
                                    className="form-input bg-slate-900 text-slate-200 w-full"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-4">
                                Create Skin
                            </button>
                        </form>
                    </div>
                    
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <span className="text-cyan-400">📋</span> Existing Skins
                        </h3>
                        <div className="space-y-2">
                            {skins.map(skin => (
                                <div key={skin.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-900/30 border border-white/5 hover:border-cyan-500/30 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                                            {skin.imageUrl ? (
                                                <img src={skin.imageUrl} alt={skin.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg">🎁</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-slate-300 font-medium">{skin.name}</div>
                                            <div className="text-cyan-400 font-mono text-xs">{skin.price} 💎</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setEditSkinModal({ isOpen: true, skin })}
                                        className="p-2 rounded bg-slate-800 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Edit Skin"
                                    >
                                        ✎
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <span className="text-cyan-400">➕</span> Add Gifter Slot
                        </h3>
                        <form action={actionAddSlot} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Select Skin</label>
                                <select name="skinId" className="form-input bg-slate-900 text-slate-200">
                                    {skins.map(skin => (
                                        <option key={skin.id} value={skin.id}>
                                            {skin.name} ({skin.price}💎)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Select Gifter</label>
                                <select name="gifterId" className="form-input bg-slate-900 text-slate-200" required defaultValue="">
                                    <option value="" disabled>Select a Gifter</option>
                                    {gifters.map(gifter => (
                                        <option key={gifter.id} value={gifter.id}>
                                            {gifter.name} ({gifter.email})
                                        </option>
                                    ))}
                                </select>
                                {gifters.length === 0 && (
                                    <p className="text-xs text-red-400 mt-2">No gifters found. Please create a Gifter account in DB.</p>
                                )}
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
                                Add {slotQuantity} Slot{slotQuantity > 1 ? 's' : ''}
                            </button>
                        </form>
                    </div>
                    
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                            <span className="text-cyan-400">📦</span> Inventory Status
                        </h3>
                        <div className="space-y-4">
                            {inventoryBySkin.map(skin => (
                                <div key={skin.id} className="p-4 rounded-lg bg-slate-900/30 border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-slate-200 font-bold">{skin.name}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-mono border ${
                                            skin.totalSlots > 0 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {skin.totalSlots} Total
                                        </span>
                                    </div>
                                    
                                    {/* Breakdown by Gifter */}
                                    {skin.breakdown.length > 0 ? (
                                        <div className="mt-2 space-y-1 pl-2 border-l-2 border-white/5">
                                            {skin.breakdown.map((g, i) => (
                                                <div key={i} className="flex justify-between text-xs text-slate-400">
                                                    <span>{g.name}</span>
                                                    <span className="text-cyan-400 font-mono">{g.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-600 italic mt-1">No active slots</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      {/* Ban Modal */}
      {banModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent rounded-xl pointer-events-none" />
                <button 
                    onClick={() => setBanModal({ ...banModal, isOpen: false })}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
                >
                    ✕
                </button>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">Ban User</h3>
                <p className="text-slate-400 text-sm mb-6 relative z-10">
                    Are you sure you want to ban <span className="text-white font-bold">{banModal.name}</span>? 
                    This will prevent them from placing new orders.
                </p>
                <form action={(formData) => {
                    actionBanUser(formData);
                    setBanModal({ ...banModal, isOpen: false });
                }} className="relative z-10">
                    <input type="hidden" name="userId" value={banModal.userId} />
                    <div className="mb-4">
                        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">Reason for Ban</label>
                        <textarea 
                            name="reason" 
                            required
                            placeholder="e.g. Fake orders, Prank, Payment fraud"
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-red-500/50 min-h-[100px] placeholder:text-slate-600"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setBanModal({ ...banModal, isOpen: false })}
                            className="px-4 py-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-medium shadow-lg shadow-red-500/20 transition-all"
                        >
                            Ban User
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
      {/* Edit Skin Modal */}
      {editSkinModal.isOpen && editSkinModal.skin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
                <button 
                    onClick={() => setEditSkinModal({ ...editSkinModal, isOpen: false })}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    ✕
                </button>
                <h3 className="text-xl font-bold text-white mb-6">Edit Skin</h3>
                <form action={(formData) => {
                    actionUpdateSkin(formData);
                    setEditSkinModal({ ...editSkinModal, isOpen: false });
                }} className="space-y-4">
                    <input type="hidden" name="id" value={editSkinModal.skin.id} />
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Skin Name</label>
                        <input 
                            name="name" 
                            type="text" 
                            defaultValue={editSkinModal.skin.name}
                            className="form-input bg-slate-950/50"
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Price (Diamonds)</label>
                        <input 
                            name="price" 
                            type="number" 
                            defaultValue={editSkinModal.skin.price}
                            className="form-input bg-slate-950/50"
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Display Price (e.g. 2800 PHP)</label>
                        <input 
                            name="displayPrice" 
                            type="text" 
                            defaultValue={(editSkinModal.skin as any).displayPrice || ''}
                            placeholder="e.g. 2800 PHP"
                            className="form-input bg-slate-950/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Description</label>
                        <textarea 
                            name="description" 
                            defaultValue={(editSkinModal.skin as any).description || ''}
                            placeholder="e.g. Requires 7 days friendship..."
                            className="form-input bg-slate-950/50 min-h-[80px]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Image URL</label>
                        <input 
                            name="imageUrl" 
                            type="url" 
                            defaultValue={editSkinModal.skin.imageUrl || ''}
                            placeholder="https://..."
                            className="form-input bg-slate-950/50"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-4">
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Assign Gifter Modal */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] rounded-xl border border-white/10 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-200">Assign Gifter</h3>
                    <button 
                        onClick={() => setAssignModal({ isOpen: false, orderId: '', skinId: '' })}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="space-y-4">
                    <button 
                        onClick={() => {
                            actionAssignGifter(assignModal.orderId);
                            setAssignModal({ isOpen: false, orderId: '', skinId: '' });
                        }}
                        className="w-full p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-left flex justify-between items-center group"
                    >
                        <div className="flex flex-col">
                            <span className="font-bold">Auto Assign</span>
                            <span className="text-xs opacity-70">Pick any available gifter</span>
                        </div>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </button>

                    <div className="border-t border-white/10 pt-4">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Available Gifters</label>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                            {(() => {
                                // Find gifters with unused slots for this skin
                                const relevantSlots = unusedSlots.filter(s => s.skinId === assignModal.skinId);
                                // Group by gifter
                                const gifterCounts = relevantSlots.reduce((acc, slot) => {
                                    if (!acc[slot.gifterId]) {
                                        acc[slot.gifterId] = { ...slot.gifter, count: 0 };
                                    }
                                    acc[slot.gifterId].count++;
                                    return acc;
                                }, {} as Record<string, { id: string, name: string, email: string, count: number }>);
                                
                                const availableGifters = Object.values(gifterCounts);

                                if (availableGifters.length === 0) {
                                    return <div className="text-sm text-slate-500 italic text-center py-4 bg-slate-900/30 rounded-lg">No gifters have slots for this skin.</div>;
                                }

                                return availableGifters.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => {
                                            actionAssignGifter(assignModal.orderId, g.id);
                                            setAssignModal({ isOpen: false, orderId: '', skinId: '' });
                                        }}
                                        className="w-full p-3 rounded-lg bg-slate-800/50 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-800 transition-colors text-left flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="text-slate-200 font-medium text-sm group-hover:text-cyan-300 transition-colors">{g.name}</div>
                                            <div className="text-xs text-slate-500">{g.email}</div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                            {g.count} slots
                                        </span>
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10';
    case 'ASSIGNED': return 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10';
    case 'FOLLOWED': return 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10';
    case 'READY_FOR_GIFTING': return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
    case 'SENT': return 'border-slate-500/30 text-slate-400 bg-slate-500/10';
    default: return 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10';
  }
}