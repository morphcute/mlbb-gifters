'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { logoutAction } from '@/app/actions';

export default function UserMenu({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session) {
    return (
      <Link href="/login" className="btn btn-secondary text-xs py-2 px-4 h-9">
        Login
      </Link>
    );
  }

  let dashboardLink = '/dashboard/admin';
  if (session.role === 'GIFTER') dashboardLink = '/dashboard/gifter';

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary text-xs py-2 px-4 h-9 flex items-center gap-2"
      >
        <span>My Account ({session.role})</span>
        <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-white/10 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="py-1">
                <Link 
                    href={dashboardLink}
                    className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                >
                    Dashboard
                </Link>
                <Link 
                    href="/profile"
                    className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                >
                    Edit Details
                </Link>
                <button 
                    onClick={() => {
                        setIsOpen(false);
                        logoutAction();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors border-t border-white/5"
                >
                    Logout
                </button>
            </div>
        </div>
      )}
    </div>
  );
}