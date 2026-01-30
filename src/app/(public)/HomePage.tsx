'use client';

import { useState } from 'react';
import { submitOrder } from '../actions';
import { Skin } from '@prisma/client';
import Link from 'next/link';

export default function HomePage({ skins, upcomingSkins, session }: { skins: (Skin & { _count: { slots: number } })[], upcomingSkins: Skin[], session?: any }) {
  const [selectedSkinId, setSelectedSkinId] = useState<string>('');
  
  const selectedSkin = skins.find(s => s.id === selectedSkinId);

  return (
    <div className="min-h-screen relative pb-20">

      
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center relative overflow-hidden px-4">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyan-500/5 rounded-full blur-[60px] md:blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-fuchsia-500/5 rounded-full blur-[60px] md:blur-[100px]" />
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Instant Delivery Available
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 px-2">
            <span className="heading-gradient">Premium Skins.</span><br />
            <span className="text-cyan-400">Instant Joy.</span>
        </h1>
        <p className="text-base md:text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed px-4">
            The most secure marketplace for Mobile Legends skins. 
            Official gifting service with instant processing and 24/7 support.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Available Skins Section */}
        <section className="mb-24">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Available Now
                    <span className="text-xs font-normal text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full border border-white/5">{skins.length} items</span>
                </h2>
            </div>
            
            <form action={submitOrder} className="space-y-8">
                {/* Skin Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {skins.map((skin) => (
                    <div 
                        key={skin.id}
                        onClick={() => setSelectedSkinId(skin.id)}
                        className={`
                        cursor-pointer p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group
                        ${selectedSkinId === skin.id 
                            ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_0_1px_rgba(6,182,212,0.3)]' 
                            : 'border-white/5 bg-slate-800/20 hover:bg-slate-800/40 hover:border-white/10'}
                        `}
                    >
                        <div className="aspect-[4/3] bg-slate-900/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
                            {skin.imageUrl ? (
                                <img src={skin.imageUrl} alt={skin.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl">🎁</span>
                            )}
                        </div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-lg text-slate-200 group-hover:text-white transition-colors">{skin.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-cyan-400 font-mono font-medium">{skin.price} 💎</span>
                            {skin._count.slots > 0 ? (
                                <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    {skin._count.slots} Available
                                </span>
                            ) : (
                                <span className="text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                    Out of Stock
                                </span>
                            )}
                        </div>
                    </div>
                    ))}
                    {skins.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                            No skins available at the moment.
                        </div>
                    )}
                </div>
                <input type="hidden" name="skinId" value={selectedSkinId} />

                {/* Order Form - Only shows when skin is selected */}
                {selectedSkin && (
                <div className="animate-in fade-in slide-in-from-bottom-4 glass-panel p-6 md:p-8 max-w-4xl mx-auto mt-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-white/5 pb-6 gap-4">
                        <div>
                            <h2 className="text-xl text-white font-bold">Complete Order</h2>
                            <p className="text-slate-400 text-sm mt-1">You are purchasing <span className="text-cyan-400 font-medium">{selectedSkin.name}</span></p>
                        </div>
                        <div className="text-2xl font-mono font-bold text-cyan-400">
                            {selectedSkin.price} 💎
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Your Name</label>
                            <input required name="name" type="text" className="form-input" placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                            <input required name="email" type="email" className="form-input" placeholder="john@example.com" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">In-Game Name (IGN)</label>
                            <input required name="ign" type="text" className="form-input" placeholder="ProPlayer123" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">ML ID</label>
                            <input required name="mlid" type="text" className="form-input" placeholder="123456789" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Server ID</label>
                            <input required name="server" type="text" className="form-input" placeholder="1234" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <button type="submit" className="btn btn-primary w-full md:w-auto text-base px-8 py-3">
                            Confirm Purchase
                        </button>
                    </div>
                </div>
                )}
            </form>
        </section>

        {/* Upcoming Skins Section */}
        <section>
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                Upcoming Releases
                <span className="text-xs font-normal text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full border border-white/5">Soon</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {upcomingSkins.map((skin) => (
                    <div key={skin.id} className="glass-card p-6 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="aspect-video bg-fuchsia-900/10 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-fuchsia-500/10">
                            {skin.imageUrl ? (
                                <img src={skin.imageUrl} alt={skin.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl">🔜</span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold mb-1 text-slate-200">{skin.name}</h3>
                        <p className="text-slate-500 text-xs mb-4 uppercase tracking-wider">Releasing on</p>
                        <div className="text-fuchsia-400 font-mono text-sm bg-fuchsia-500/5 rounded p-2 text-center border border-fuchsia-500/10">
                            {new Date(skin.releaseDate).toLocaleDateString()}
                        </div>
                    </div>
                ))}
                {upcomingSkins.length === 0 && (
                     <div className="col-span-full text-center py-16 text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                        No upcoming releases scheduled.
                    </div>
                )}
            </div>
        </section>

      </div>
    </div>
  );
}
