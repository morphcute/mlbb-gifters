import Link from 'next/link';
import { getSession } from '@/lib/auth';
import BackButton from './BackButton';
import UserMenu from './UserMenu';

export default async function Navbar() {
  const session = await getSession();

  return (
    <nav className="w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <BackButton />
            <Link href="/" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
                <span className="text-cyan-400">⚡</span>
                <span className="heading-gradient">MLBB GIFTER</span>
            </Link>
        </div>

        <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Home
            </Link>
            <Link href="/track" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Track Order
            </Link>
            <UserMenu session={session} />
        </div>
      </div>
    </nav>
  );
}
