"use client"

import { useState } from 'react'
import { Show, User, DJSettings } from '@prisma/client'

type ShowWithUser = Show & {
  user: {
    name: string | null;
    settings: DJSettings | null;
  }
}

export default function SendMessageClient({ show }: { show: ShowWithUser }) {
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [price, setPrice] = useState(0)
  
  // Fiyat hesaplama
  const calculatePrice = () => {
    const pricePerChar = show.user.settings?.pricePerChar || 0.1
    return message.length * pricePerChar
  }
  
  // Mesaj değiştiğinde fiyat güncelleme
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setPrice(calculatePrice())
  }
  
  // Mesaj gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Ödeme simülasyonu - gerçek uygulamada PayPal entegrasyonu olacak
      const simulatePayment = true // Test için her zaman başarılı
      
      if (simulatePayment) {
        // Mesajı kaydet
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            showId: show.id,
            displayName,
            content: message,
            paid: true,
            paymentId: 'simulated-payment-id'
          })
        })
        
        if (response.ok) {
          setSent(true)
          setDisplayName('')
          setMessage('')
          setPrice(0)
        } else {
          alert('Mesaj gönderilirken bir hata oluştu.')
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Mesaj gönderme hatası.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">{show.user.name || 'DJ'}</h1>
          <p className="text-xl mt-2">{show.title}</p>
        </div>
        
        {sent ? (
          <div className="bg-green-900/30 border border-green-500 text-green-300 p-6 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-4">Mesajınız Gönderildi!</h2>
            <p className="mb-6">Mesajınız DJ'e iletildi.</p>
            <button
              onClick={() => setSent(false)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Yeni Mesaj Gönder
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Mesajını Gönder</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block mb-1">İsminiz</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-700 p-3 rounded"
                  placeholder="Görünecek isminiz"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block mb-1">Mesajınız</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={handleMessageChange}
                  className="w-full bg-slate-700 p-3 rounded h-32"
                  placeholder="Mesajınızı yazın..."
                  required
                />
              </div>
              
              <div className="bg-slate-900 p-4 rounded">
                <div className="flex justify-between items-center">
                  <span>Fiyat:</span>
                  <span className="text-xl font-bold">${price.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Her karakter için ${show.user.settings?.pricePerChar || 0.1}
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading || !message || !displayName}
                className={`w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-lg
                          font-semibold hover:opacity-90 transition-opacity ${(loading || !message || !displayName) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? "İşleniyor..." : "Mesaj Gönder ve Öde"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}