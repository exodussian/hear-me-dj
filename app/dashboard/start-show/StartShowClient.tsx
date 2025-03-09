"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

export default function StartShowClient() {
  const { data: session, status } = useSession()
  const [showActive, setShowActive] = useState(false)
  const [showId, setShowId] = useState("")
  const [loading, setLoading] = useState(false)
  const [showUrl, setShowUrl] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  
  // Audio Visualizer için state ve ref'ler
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [audioVisualizerActive, setAudioVisualizerActive] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (showId) {
      const baseUrl = window.location.origin
      setShowUrl(`${baseUrl}/send/${showId}`)
      
      // Show başlatıldığında otomatik olarak ses görselleştirmeyi de başlat
      startAudioVisualizer()
    }
  }, [showId])
  
  // Mikrofon erişimi ve görselleştirmeyi başlat
  const startAudioVisualizer = async () => {
    if (audioVisualizerActive) return // Zaten aktifse tekrar başlatma
    
    try {
      console.log("Mikrofon erişimi isteniyor...")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("Mikrofon erişimi sağlandı")
      
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioAnalyser = context.createAnalyser()
      audioAnalyser.fftSize = 128 // Daha az detay, daha büyük barlar
      audioAnalyser.smoothingTimeConstant = 0.5 // Daha akıcı geçişler
      
      const source = context.createMediaStreamSource(stream)
      source.connect(audioAnalyser)
      
      // Test için ses verilerini kontrol et
      const testBuffer = new Uint8Array(audioAnalyser.frequencyBinCount)
      audioAnalyser.getByteFrequencyData(testBuffer)
      console.log("İlk ses verileri:", testBuffer)
      
      setAudioContext(context)
      setAnalyser(audioAnalyser)
      setAudioVisualizerActive(true)
      
    } catch (error) {
      console.error("Mikrofon erişimi hatası:", error)
      alert("Mikrofon erişimi sağlanamadı. Lütfen izinleri kontrol edin.")
    }
  }
  
  // Görselleştirme aktif olduğunda canvas'a çizim yap
  useEffect(() => {
    if (!audioVisualizerActive || !analyser || !canvasRef.current) {
      console.log("Canvas çizimi başlatılamadı:", { 
        active: audioVisualizerActive, 
        hasAnalyser: !!analyser, 
        hasCanvas: !!canvasRef.current 
      })
      return
    }
    
    console.log("Canvas çizim başlatılıyor...")
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Canvas boyutlarını ayarla
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      console.log("Canvas boyutu:", canvas.width, "x", canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    let frameCount = 0
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      
      // Her frame'de ses verilerini al
      analyser.getByteFrequencyData(dataArray)
      
      // Debug için her 60 frame'de bir (yaklaşık 1 saniye) veriyi logla
      frameCount++
      if (frameCount % 60 === 0) {
        console.log("Ses verisi örneği:", dataArray.slice(0, 5))
        frameCount = 0
      }
      
      // Canvas'ı tamamen temizle
      ctx.fillStyle = 'rgb(0, 0, 0)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const barWidth = (canvas.width / bufferLength)
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        // Daha yüksek barlar için çarpan kullan
        const barHeight = dataArray[i] * 2
        
        // Kırmızıdan-sarıya renk gradyanı
        const r = 255
        const g = Math.min(255, Math.floor((i / bufferLength) * 510))
        const b = 0
        
        // Bar çizimi
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
        
        x += barWidth
      }
    }
    
    draw()
    
    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      console.log("Canvas çizimi durduruldu")
    }
  }, [audioVisualizerActive, analyser])
  
  // Component unmount olduğunda AudioContext'i kapat
  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioContext])

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
        // startAudioVisualizer fonksiyonu showId dependency'si sayesinde otomatik tetiklenecek
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
        // Görselleştiriciyi durdur
        if (audioContext) {
          audioContext.close()
          setAudioContext(null)
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setAudioVisualizerActive(false)
        
        // Canvas'ı temizle
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
        }
        
        // State'i güncelle
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
    <div className="min-h-screen w-full">
      {/* Arka plan canvas - tüm ekranı kaplar */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Sayfa içeriği */}
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex justify-between items-center mb-8 z-10 relative">
          <h1 className="text-3xl font-bold text-white">Show Yönetimi</h1>
          <Link 
            href="/dashboard"
            className="bg-black bg-opacity-30 backdrop-blur-sm text-white px-4 py-2 rounded hover:bg-opacity-40 transition-all"
          >
            Geri Dön
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 z-10 relative">
          {/* Sol panel - Kontroller - daha fazla transparan */}
          <div className="bg-black bg-opacity-30 backdrop-blur-sm p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-white">Show Kontrolü</h2>
            
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
                <div className="bg-green-900/20 border border-green-500/50 text-green-300 p-4 rounded-lg">
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
          
          {/* Sağ panel - QR Kod - opak beyaz arka plan */}
          <div className="bg-black bg-opacity-30 backdrop-blur-sm p-6 rounded-lg shadow-lg">
            {showActive ? (
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4 text-white">Katılım QR Kodu</h2>
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
        
        {/* Alt kısım - Mesajlar - transparan */}
        {showActive && (
          <div className="mt-8 bg-black bg-opacity-30 backdrop-blur-sm p-6 rounded-lg shadow-lg z-10 relative">
            <h2 className="text-2xl font-semibold mb-4 text-white">Canlı Mesajlar</h2>
            <div className="space-y-4">
              {messages.length > 0 ? (
                messages.map((msg: { id: string; displayName: string; content: string }) => (
                  <div key={msg.id} className="p-3 bg-red-900/20 border-l-4 border-red-500/50 rounded backdrop-blur-sm">
                    <p className="font-bold text-white">{msg.displayName}:</p>
                    <p className="text-gray-200">{msg.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Henüz mesaj yok...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}