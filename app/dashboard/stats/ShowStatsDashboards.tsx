"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Message {
  id: string
  displayName: string
  content: string
  payment: number
  paid: boolean
  createdAt: string
}

interface ShowDetails {
  id: string
  title: string
  createdAt: string
  endedAt: string | null
  messageCount: number
  totalEarnings: number
  messages: Message[]
}

interface PastShow {
  id: string
  title: string
  createdAt: string
  endedAt: string | null
  messageCount: number
  totalEarnings: number
}

export default function ShowStatsDashboard() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [pastShows, setPastShows] = useState<PastShow[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)
  const [selectedShow, setSelectedShow] = useState<ShowDetails | null>(null)

  // Geçmiş showları getir
  useEffect(() => {
    if (session?.user) {
      fetchPastShows()
    }
  }, [session])

  const fetchPastShows = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shows/past')
      
      if (response.ok) {
        const data = await response.json()
        setPastShows(data)
        
        // Toplam kazanç ve mesaj sayısını hesapla
        let earnings = 0
        let messages = 0
        
        data.forEach((show: PastShow) => {
          earnings += show.totalEarnings || 0
          messages += show.messageCount || 0
        })
        
        setTotalEarnings(earnings)
        setTotalMessages(messages)
      } else {
        console.error("Geçmiş showlar alınamadı")
      }
    } catch (error) {
      console.error("Veri alınırken hata:", error)
    } finally {
      setLoading(false)
    }
  }

  // Show detaylarını getir
  const fetchShowDetails = async (showId: string) => {
    try {
      const response = await fetch(`/api/shows/${showId}/details`)
      
      if (response.ok) {
        const data = await response.json()
        setSelectedShow(data)
      } else {
        console.error("Show detayları alınamadı")
      }
    } catch (error) {
      console.error("Detaylar alınırken hata:", error)
    }
  }

  // Tarih formatını düzenle
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('tr-TR')
  }

  // Show süresini hesapla
  const calculateDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return "Devam ediyor"
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) {
      return `${diffMins} dakika`
    } else {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours} saat ${mins} dakika`
    }
  }

  if (status === 'loading' || loading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Show İstatistikleri</h1>
        <Link
          href="/dashboard"
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Dashboard'a Dön
        </Link>
      </div>
      
      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-lg shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-2">Toplam Show</h3>
          <p className="text-4xl font-bold">{pastShows.length}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-teal-600 p-6 rounded-lg shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-2">Toplam Kazanç</h3>
          <p className="text-4xl font-bold">₺{totalEarnings.toFixed(2)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-2">Toplam Mesaj</h3>
          <p className="text-4xl font-bold">{totalMessages}</p>
        </div>
      </div>
      
      {/* Tablo */}
      <div className="mb-8 overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Show Adı</th>
              <th className="py-3 px-4 text-left">Tarih</th>
              <th className="py-3 px-4 text-left">Süre</th>
              <th className="py-3 px-4 text-right">Mesaj Sayısı</th>
              <th className="py-3 px-4 text-right">Kazanç</th>
              <th className="py-3 px-4 text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pastShows.length > 0 ? (
              pastShows.map(show => (
                <tr key={show.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{show.title}</td>
                  <td className="py-3 px-4">{formatDate(show.createdAt)}</td>
                  <td className="py-3 px-4">{calculateDuration(show.createdAt, show.endedAt)}</td>
                  <td className="py-3 px-4 text-right">{show.messageCount || 0}</td>
                  <td className="py-3 px-4 text-right">₺{(show.totalEarnings || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => fetchShowDetails(show.id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Detaylar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                  Henüz geçmiş show bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Seçilen Show Detayları */}
      {selectedShow && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{selectedShow.title} Detayları</h2>
            <button
              onClick={() => setSelectedShow(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Kapat
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Show Bilgileri</h3>
              <p><span className="font-medium">Başlangıç:</span> {formatDate(selectedShow.createdAt)}</p>
              {selectedShow.endedAt && (
                <p><span className="font-medium">Bitiş:</span> {formatDate(selectedShow.endedAt)}</p>
              )}
              <p><span className="font-medium">Süre:</span> {calculateDuration(selectedShow.createdAt, selectedShow.endedAt)}</p>
              <p><span className="font-medium">Toplam Kazanç:</span> ₺{(selectedShow.totalEarnings || 0).toFixed(2)}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Mesaj İstatistikleri</h3>
              <p><span className="font-medium">Toplam Mesaj:</span> {selectedShow.messageCount}</p>
              <p><span className="font-medium">Ödemeli Mesajlar:</span> {selectedShow.messages.filter(m => m.payment > 0).length}</p>
              <p><span className="font-medium">Ortalama Ödeme:</span> ₺{(
                selectedShow.messages.reduce((sum, m) => sum + (m.payment || 0), 0) / 
                Math.max(1, selectedShow.messages.filter(m => m.payment > 0).length)
              ).toFixed(2)}</p>
            </div>
          </div>
          
          {/* Mesaj Listesi */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Mesajlar</h3>
            {selectedShow.messages.length > 0 ? (
             <div className="space-y-2 max-h-96 overflow-y-auto">
             {selectedShow.messages.map(message => (
               <div 
                 key={message.id} 
                 className={`p-3 bg-gray-50 rounded border-l-4 ${message.paid ? 'border-green-500' : 'border-gray-300'}`}
               >
                 <div className="flex justify-between">
                   <p className="font-medium">
                     {message.displayName}
                     {message.paid && (
                       <span className="ml-2 text-sm bg-green-500 text-white px-2 py-1 rounded-full">
                         Ödendi
                       </span>
                     )}
                   </p>
                   <p className="text-sm text-gray-500">{formatDate(message.createdAt)}</p>
                 </div>
                 <p className="mt-1">{message.content}</p>
               </div>
             ))}
           </div>
            ) : (
              <p className="text-gray-500">Bu show'da mesaj bulunmuyor.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}