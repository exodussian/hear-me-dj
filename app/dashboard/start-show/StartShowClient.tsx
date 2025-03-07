"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import AudioVisualizer from '@/src/components/show/AudioVisualiser'

export default function StartShowClient() {
  const { data: session, status } = useSession()
  const [showActive, setShowActive] = useState(false)
  const [showId, setShowId] = useState("")
  const [loading, setLoading] = useState(false)
  const [showUrl, setShowUrl] = useState("")
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (showId) {
      const baseUrl = window.location.origin
      setShowUrl(`${baseUrl}/send/${showId}`)
    }
  }, [showId])

  if (status === 'loading') {
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

  const startShow = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Show - ${new Date().toLocaleString('tr-TR')}`
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setShowId(data.id)
        setShowActive(true)
      } else {
        alert('Show başlatılırken bir hata oluştu.')
      }
    } catch (error) {
      console.error('Error starting show:', error)
      alert('Show başlatılırken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const endShow = async () => {
    if (!showId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/shows/${showId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          active: false,
          endedAt: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        setShowActive(false)
        setShowId("")
        setShowUrl("")
      } else {
        alert('Show sonlandırılırken bir hata oluştu.')
      }
    } catch (error) {
      console.error('Error ending show:', error)
      alert('Show sonlandırılırken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Arka plan görselleştirici */}
      <AudioVisualizer />
      
      {/* Sayfa içeriği */}
      <div className="flex justify-between items-center mb-8 z-10 relative">
        <h1 className="text-3xl font-bold">Show Yönetimi</h1>
        <Link 
          href="/dashboard"
          className="bg-gray-600 bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded border-0 hover:bg-gray-700 transition-colors"
        >
          Geri Dön
        </Link>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 z-10 relative">
        {/* Sol panel - Kontroller */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-lg shadow-lg border-0">
          <h2 className="text-2xl font-semibold mb-4">Show Kontrolü</h2>
          
          {!showActive ? (
            <button
              onClick={startShow}
              disabled={loading}
              className={`w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-full
                        font-semibold hover:opacity-90 transition-opacity ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? "Başlatılıyor..." : "Show Başlat"}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-500 text-green-300 p-4 rounded-lg">
                <p className="font-semibold">Show şu anda aktif!</p>
                <p className="text-sm mt-2">Show ID: {showId}</p>
                <p className="text-sm mt-1">Bağlantı: {showUrl}</p>
              </div>
              
              <button
                onClick={endShow}
                disabled={loading}
                className={`w-full bg-red-600 text-white px-6 py-3 rounded-full
                          font-semibold hover:bg-red-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? "Sonlandırılıyor..." : "Show'u Sonlandır"}
              </button>
            </div>
          )}
        </div>
        
        {/* Sağ panel - QR Kod ve Ses Görselleştirme */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-lg shadow-lg border-0">
          {showActive ? (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Katılım QR Kodu</h2>
              <div className="bg-white p-4 inline-block rounded-lg mb-4">
                <QRCodeSVG value={showUrl} size={200} />
              </div>
              <p className="text-sm text-gray-300">
                Katılımcılar bu QR kodu okutarak mesaj gönderebilir
              </p>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-400">Show başlattığınızda burada QR kod görünecek</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Alt kısım - İstatistikler veya Mesajlar */}
      {showActive && (
        <div className="mt-8 bg-slate-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-lg shadow-lg border-0 z-10 relative">
          <h2 className="text-2xl font-semibold mb-4">Canlı Mesajlar</h2>
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map((msg: { id: string; displayName: string; content: string }) => (
                <div key={msg.id} className="p-3 bg-gradient-to-r from-red-900/30 to-red-700/30 border-l-4 border-red-500 rounded">
                  <p className="font-bold">{msg.displayName}:</p>
                  <p>{msg.content}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Henüz mesaj yok...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}