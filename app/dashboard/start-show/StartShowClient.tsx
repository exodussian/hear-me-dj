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
      
      // Show başlatıldığında otomatik olarak ses görselleştirmeyi başlat
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
      
      // Daha detaylı analiz için FFT boyutunu arttırma
      audioAnalyser.fftSize = 256 // Daha az detay, daha akıcı animasyon için
      audioAnalyser.smoothingTimeConstant = 0.85
      
      const source = context.createMediaStreamSource(stream)
      source.connect(audioAnalyser)
      
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
      return
    }
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    
    // Canvas boyutlarını ayarla
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    
    // Frekans verileri için array
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    // Parçacık sistemi
    const particles: Particle[] = []
    const particleCount = 300
    let hueRotation = 0
    
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
      intensity: number
      
      constructor() {
        this.reset(0)
      }
      
      reset(intensity: number) {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + Math.random() * 100
        this.size = Math.random() * 5 + 2
        this.speedX = (Math.random() - 0.5) * 3
        this.speedY = -Math.random() * 6 - 3 - intensity * 5
        this.color = `hsl(${Math.random() * 60 + hueRotation}, 100%, ${50 + intensity * 50}%)`
        this.intensity = intensity
      }
      
      update(intensity: number) {
        this.x += this.speedX
        this.y += this.speedY
        this.speedY += 0.01 - intensity * 0.05
        this.size -= 0.1
        
        if (this.size <= 0.3 || this.y < 0 || this.x < 0 || this.x > canvas.width) {
          this.reset(intensity)
        }
      }
      
      draw() {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        
        // Parıltı efekti
        ctx.fillStyle = `rgba(255, 255, 100, ${this.intensity * 0.2})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    // Parçacıkları başlat
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }
    
    // Dalganın oluşturduğu dalga örüntüleri
    const wavePoints: {x: number, y: number, size: number, opacity: number}[] = []
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      
      // Frekans verilerini al
      analyser.getByteFrequencyData(dataArray)
      
      // Ses seviyesini hesapla
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength / 255
      
      // Arka planı temizle - Her frame için siyah
      ctx.fillStyle = 'rgba(0, 0, 0, 1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Görsel efektlerin renk hue'sunu yavaşça değiştir
      hueRotation = (hueRotation + 0.2) % 360
      
      // Parçacıkları güncelle ve çiz
      particles.forEach(particle => {
        particle.update(average)
        particle.draw()
      })
      
      // Merkezi dalga efekti - Ana ses dalgası
      ctx.strokeStyle = `hsl(${hueRotation}, 100%, 70%)`
      ctx.lineWidth = 3
      ctx.beginPath()
      
      const sliceWidth = canvas.width / bufferLength
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = canvas.height / 2 + (v - 1) * canvas.height / 4
        
        // Dalga noktalarını kaydet - ilerleyen animasyonlar için
        if (i % 8 === 0 && Math.random() > 0.5) {
          wavePoints.push({
            x: x,
            y: y,
            size: v * 5,
            opacity: 1
          })
        }
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        
        x += sliceWidth
      }
      
      ctx.stroke()
      
      // Dalga noktalarından çıkan enerji dalgaları
      ctx.lineWidth = 1
      wavePoints.forEach((point, i) => {
        point.size += 5
        point.opacity -= 0.02
        
        ctx.beginPath()
        ctx.strokeStyle = `hsla(${hueRotation + 30}, 100%, 70%, ${point.opacity})`
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2)
        ctx.stroke()
        
        // Eskimiş noktaları kaldır
        if (point.opacity <= 0) {
          wavePoints.splice(i, 1)
        }
      })
      
      // Bas seslere göre ekrana puls efekti
      const bassValue = dataArray[0] / 255.0 // En düşük frekans değeri - bas ses
      if (bassValue > 0.6) {
        ctx.fillStyle = `rgba(255, 255, 100, ${bassValue * 0.3})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      // Spektrum çizgilerini oluştur - ekranın altından çıkan dikey çizgiler
      ctx.fillStyle = `hsl(${hueRotation + 60}, 100%, 50%)`
      x = 0
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] * 1.5
        ctx.fillRect(x, canvas.height - barHeight, sliceWidth - 1, barHeight)
        x += sliceWidth
      }
    }
    
    draw()
    
    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
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
  // StartShowClient bileşeninize ekleyin, showId tanımlandıktan hemen sonra

// Canlı mesajları almak için useEffect
useEffect(() => {
  if (showId) {
    // İlk mesajları al
    fetchMessages();
    
    // Mesajları düzenli aralıklarla kontrol et (polling)
    const polling = setInterval(() => {
      fetchMessages();
    }, 3000); // 3 saniyede bir kontrol et
    
    return () => clearInterval(polling); // cleanup
  }
}, [showId]);

// Mesajları getirme fonksiyonu
const fetchMessages = async () => {
  if (!showId) return;
  
  try {
    const response = await fetch(`/api/shows/${showId}/messages`);
    
    if (response.ok) {
      const data = await response.json();
      setMessages(data);
    } else {
      console.log("Mesajlar alınamadı:", response.status);
    }
  } catch (error) {
    console.error("Mesaj alınırken hata:", error);
  }
};

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
    <div className="w-screen fixed inset-0 m-0 p-0 overflow-hidden">
      {/* Arka plan canvas - tüm ekranı kaplar */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Sayfa içeriği */}
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex justify-between items-center mb-8 z-10 relative">
          {/* Başlık sol üstte */}
          <h1 className="text-3xl font-bold text-white">Show Yönetimi</h1>
          {/* Geri Dön sağ üstte */}
          <Link 
            href="/dashboard"
            className="text-white px-4 py-2 rounded hover:text-gray-300 transition-all"
          >
            Geri Dön
          </Link>
        </div>
        
        {/* Mesajlar kısmı başlık kaldırıldı */}
        {showActive && (
          <div className="mb-8 z-10 relative">
            <div className="space-y-4">
              {messages.length > 0 ? (
                messages.map((msg: { id: string; displayName: string; content: string }) => (
                  <div key={msg.id} className="p-3 border-l-4 border-red-500/50 rounded">
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
        
        <div className="grid md:grid-cols-2 gap-8 z-10 relative">
          {/* Sol panel - Show Kontrolü - Sadece sonlandır butonu */}
          <div>
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
                {/* Sadece sonlandır butonu */}
                <button
                  onClick={endShow}
                  disabled={loading}
                  className={`w-full bg-red-600 text-white px-6 py-4 rounded-full text-lg
                            font-semibold hover:bg-red-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? "Sonlandırılıyor..." : "SONLANDIR"}
                </button>
              </div>
            )}
          </div>
          
          {/* Sağ panel - QR Kod - daha da büyütüldü ve yazı değiştirildi */}
          <div className="text-center">
            {showActive ? (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-white">Scan Me to Message Me!</h2>
                {/* QR Kodu daha büyük boyutta gösterme */}
                <div className="bg-white p-6 inline-block rounded-lg mb-4 shadow-lg">
                  <QRCodeSVG value={showUrl} size={450} />
                </div>
                {/* Alt yazı kaldırıldı */}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-400">Show başlattığınızda burada QR kod görünecek</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}