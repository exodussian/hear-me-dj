"use client"

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardClient() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setLoading(false)
    }
  }, [status])

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Yükleniyor...</div>
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
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">DJ Dashboard</h1>
        <button 
          onClick={() => {
            window.location.href = "/api/auth/signout?callbackUrl=/";
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
            <p><span className="font-semibold">İsim:</span> {session.user?.name || 'N/A'}</p>
            <p><span className="font-semibold">Email:</span> {session.user?.email || 'N/A'}</p>
            <p><span className="font-semibold">Sahne Adı:</span> {session.user?.settings?.artistName || 'Ayarlanmadı'}</p>
          </div>
          <Link 
            href="/dashboard/settings"
            className="text-purple-400 hover:text-purple-300 transition-colors inline-block"
          >
            Profil Ayarları
          </Link>
        </div>
      </div>
      
      <div className="mt-8 bg-slate-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Geçmiş Showlar</h2>
        <p>Henüz bir show kaydı bulunmuyor.</p>
      </div>
    </div>
  )
}