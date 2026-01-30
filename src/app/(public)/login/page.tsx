import { loginAction } from './actions';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
       <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1e] to-black" />
      
      <div className="glass-panel p-8 w-full max-w-md border-t border-white/10">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold heading-gradient mb-2">STAFF ACCESS</h1>
            <p className="text-slate-400 text-sm">Restricted Area. Authorized Personnel Only.</p>
        </div>

        <form action={loginAction} className="space-y-6">
            <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">Email Access Key</label>
                <input name="email" type="email" required className="form-input" placeholder="staff@mlbb-gifter.com" />
            </div>

            <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">Password</label>
                <input name="password" type="password" required className="form-input" placeholder="••••••••" />
            </div>

            <div>
                <label className="block text-sm text-slate-300 mb-1.5 font-medium">Select Role</label>
                <div className="grid grid-cols-2 gap-4">
                    <label className="cursor-pointer group">
                        <input type="radio" name="role" value="GIFTER" className="peer sr-only" required />
                        <div className="text-center p-4 rounded-xl border border-white/5 bg-slate-900/50 peer-checked:border-fuchsia-500/50 peer-checked:bg-fuchsia-500/10 peer-checked:text-fuchsia-400 text-slate-400 transition-all hover:bg-slate-800/50 peer-checked:shadow-[0_0_20px_rgba(232,121,249,0.15)]">
                            Gifter
                        </div>
                    </label>
                    <label className="cursor-pointer group">
                        <input type="radio" name="role" value="ADMIN" className="peer sr-only" required />
                        <div className="text-center p-4 rounded-xl border border-white/5 bg-slate-900/50 peer-checked:border-cyan-500/50 peer-checked:bg-cyan-500/10 peer-checked:text-cyan-400 text-slate-400 transition-all hover:bg-slate-800/50 peer-checked:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                            Admin
                        </div>
                    </label>
                </div>
            </div>

            <button type="submit" className="w-full btn btn-primary py-3 font-bold text-base shadow-lg shadow-cyan-500/20">
                Authenticate
            </button>
        </form>

        <div className="mt-8 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-1">
                <span>←</span> Return to Public Marketplace
            </Link>
        </div>
      </div>
    </main>
  );
}
