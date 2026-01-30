import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { updateProfileAction } from './actions';

export default async function ProfilePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect('/login');
  }

  const success = searchParams.success;
  const error = searchParams.error;

  return (
    <main className="min-h-screen py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl glass-panel p-8">
        <h1 className="text-3xl font-bold mb-8 text-center heading-gradient">My Profile</h1>
        
        <div className="space-y-6">
            {/* Header Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-cyan-500/20">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-200">{user.name}</h2>
                    <p className="text-slate-400 text-sm font-mono">{user.email}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400">
                        {user.role}
                    </span>
                </div>
            </div>

             {/* Alerts */}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span>✓</span> {success}
                </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span>⚠</span> {error}
                </div>
            )}

            {/* Edit Form */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-slate-300 mb-6 border-b border-white/5 pb-2">Edit Details</h3>
                <form action={updateProfileAction} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Full Name</label>
                            <input 
                                name="name" 
                                type="text" 
                                defaultValue={user.name || ''} 
                                className="form-input bg-slate-900/50 w-full"
                                required 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Email Address</label>
                            <input 
                                name="email" 
                                type="email" 
                                defaultValue={user.email || ''} 
                                className="form-input bg-slate-900/50 w-full"
                                required 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">New Password</label>
                            <input 
                                name="password" 
                                type="password" 
                                placeholder="Leave blank to keep current password"
                                className="form-input bg-slate-900/50 w-full" 
                            />
                            <p className="text-xs text-slate-500 mt-1">Only enter a value if you wish to change your password.</p>
                        </div>
                        
                        <div className="md:col-span-2 pt-4 flex justify-end">
                            <button type="submit" className="btn btn-primary w-full md:w-auto">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="text-center text-xs text-slate-600">
                Account ID: <span className="font-mono">{user.id}</span> • Member since {new Date(user.createdAt).toLocaleDateString()}
            </div>
        </div>
      </div>
    </main>
  );
}