"use client"

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Session } from 'next-auth'

// Session tipi genişletme
interface ExtendedSession extends Session {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    settings?: {
      artistName?: string;
      // Diğer ayarlar
    } | null;
  } & Record<string, unknown>;
}

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const extendedSession = session as ExtendedSession;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      setLoading(false);
    }
  }, [status]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Yükleniyor...</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
        <Link 
          href="/api/auth/signin/google"
          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded inline-block"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">DJ Dashboard</h1>
        <button 
          onClick={() => {
            window.location.href = '/api/auth/signout?callbackUrl=/';
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Çıkış Yap
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Aktif Show</h2>
          <p className="mb-4">Henüz aktif bir show bulunmuyor.</p>
          <Link 
            href="/dashboard/start-show"
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-full
                     font-semibold hover:opacity-90 transition-opacity inline-block"
          >
            Show Başlat
          </Link>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">DJ Profili</h2>
          <div className="space-y-2 mb-4">
            <p><span className="font-semibold">İsim:</span> {extendedSession.user?.name || 'N/A'}</p>
            <p><span className="font-semibold">Email:</span> {extendedSession.user?.email || 'N/A'}</p>
            <p><span className="font-semibold">Sahne Adı:</span> {extendedSession.user?.settings?.artistName || 'Ayarlanmadı'}</p>
          </div>
          <Link 
            href="/dashboard/settings"
            className="text-purple-400 hover:text-purple-300 transition-colors inline-block"
          >
            Profil Ayarları
          </Link>
          <Link 
          href="/dashboard/stats" 
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          İstatistikler ve Kazançlar
        </Link>
        </div>
      </div>
      
      <div className="mt-8 bg-slate-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Geçmiş Showlar</h2>
        <p>Henüz bir show kaydı bulunmuyor.</p>
      </div>
    </div>
  );
}