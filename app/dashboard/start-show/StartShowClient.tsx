"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

export default function StartShowClient() {
  // Tüm state ve ref hook'ları önce gelir
  const { data: session, status } = useSession()
  const [showActive, setShowActive] = useState(false)
  const [showId, setShowId] = useState("")
  const [loading, setLoading] = useState(false)
  const [showUrl, setShowUrl] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  
  // Audio Visualizer için state ve ref'ler
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [audioVisualizerActive, setAudioVisualizerActive] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Mesajları getirme fonksiyonu
  const fetchMessages = async () => {
    if (!showId) return;
    
    try {
      const response = await fetch(`/api/shows/${showId}/messages`);
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Mesajları en son gelen en üstte olacak şekilde sırala
          const sortedMessages = [...data].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          // Eğer yeni bir mesaj geldiyse, son mesaj ID'sini güncelle
          if (sortedMessages.length > 0 && (!lastMessageId || sortedMessages[0].id !== lastMessageId)) {
            setLastMessageId(sortedMessages[0].id);
          }
          
          setMessages(sortedMessages);
        }
      } else {
        console.log("Mesajlar alınamadı:", response.status);
      }
    } catch (error) {
      console.error("Mesaj alınırken hata:", error);
    }
  };

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

  /// Show ID değiştiğinde URL'i ayarla ve visualizer'ı başlat
useEffect(() => {
  if (showId) {
    // Yerel IP adresini almak için fonksiyon
    const getLocalIpAddress = async () => {
      try {
        // Public STUN sunucusu kullanarak yerel IP adresi alma
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });
        
        pc.createDataChannel("");
        await pc.createOffer().then(offer => pc.setLocalDescription(offer));
        
        // ICE adaylarını bekle
        const ip = await new Promise((resolve) => {
          pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            
            // IP adresini regex ile çıkar
            const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
            const ipAddress = ipRegex.exec(event.candidate.candidate)?.[1];
            
            if (ipAddress) {
              resolve(ipAddress);
              pc.onicecandidate = null;
              pc.close();
            }
          };
        });
        
        // Yerel IP üzerinden URL oluştur
        const localIpUrl = `http://${ip}:3000/send/${showId}`;
        setShowUrl(localIpUrl);
        console.log("Local IP URL:", localIpUrl);
      } catch (error) {
        console.error("IP adresi alınamadı:", error);
        // Fallback olarak window.location.origin kullan
        const baseUrl = window.location.origin;
        setShowUrl(`${baseUrl}/send/${showId}`);
      }
    };
    
    getLocalIpAddress();
    
    // Show başlatıldığında otomatik olarak ses görselleştirmeyi başlat
    startAudioVisualizer();
  }
}, [showId]);
  
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
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      intensity: number;
      
      constructor() {
        // Tüm değişkenleri constructor'da başlatıyoruz
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.color = '';
        this.intensity = 0;
        
        this.reset(0);
      }
      
      reset(intensity: number) {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + Math.random() * 100
        this.size = Math.random() * 5 + 2
        this.speedX = (Math.random() - 0.5) * 3
        this.speedY = -Math.random() * 6 - 3 - intensity * 5
        this.color = `hsl(${Math.random() * 60 + hueRotation}, 100%, ${50 + intensity * 50}%)`
        this.intensity = intensity
        
        return this;
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
        if (!ctx) return;
        
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
      if (!ctx) return;
      
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
    if (!showId) return;
  
    setLoading(true);
    try {
      const response = await fetch(`/api/shows/${showId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: false,
          endedAt: new Date().toISOString(),
        }),
      });
  
      if (response.ok) {
        // Görselleştiriciyi durdur
        if (audioContext) {
          audioContext.close();
          setAudioContext(null);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioVisualizerActive(false);
  
        // Canvas'ı temizle
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
  
        // State'i güncelle
        setShowActive(false);
        setShowId('');
        setShowUrl('');
      } else {
        alert('Show sonlandırılırken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error ending show:', error);
      alert('Show sonlandırılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="fixed inset-0 w-screen h-screen flex items-center justify-center">Yükleniyor...</div>
  }

  if (!session) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center">
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
    // Ana container - ekranın tamamını kaplamak için özel sınıflar
    <div className="fixed inset-0 w-screen h-screen overflow-hidden m-0 p-0">
      {/* Arka plan canvas - tüm ekranı kaplar */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Sayfa içeriği - ana layout'u override etmek için özel stil */}
      <div className="fixed inset-0 w-full h-full p-0 z-10">
        {/* Header - sol başlık, sağ geri dön ve sonlandır butonu */}
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-3xl font-bold text-white">Show Yönetimi</h1>
          <div className="flex items-center gap-4">
            {showActive && (
              <button
                onClick={endShow}
                disabled={loading}
                className={`bg-red-600 text-white px-4 py-2 rounded-full text-sm
                          font-semibold hover:bg-red-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? "..." : "SONLANDIR"}
              </button>
            )}
            <Link 
              href="/dashboard"
              className="text-white px-4 py-2 rounded hover:text-gray-300 transition-all"
            >
              Geri Dön
            </Link>
          </div>
        </div>
        
        {/* QR kod bölümü */}
        {showActive && (
          <div className="flex justify-center items-center px-6 py-4">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-white">Scan Me to Message Me!</h2>
              <div className="bg-white p-6 inline-block rounded-lg mb-4 shadow-lg">
                <QRCodeSVG value={showUrl} size={450} />
              </div>
            </div>
          </div>
        )}
        
        {/* Show başlatma butonu - show aktif değilse */}
        {!showActive && (
          <div className="flex justify-center px-6 py-4">
            <button
              onClick={startShow}
              disabled={loading}
              className={`w-1/3 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-full
                        font-semibold hover:opacity-90 transition-opacity ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? "Başlatılıyor..." : "Show Başlat"}
            </button>
          </div>
        )}
        
        {/* Mesajlar kısmı */}
        {showActive && (
          <div className="px-6 pt-4 pb-20 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {messages.length > 0 ? (
              <div className="space-y-2">
                {messages.map((msg: { id: string; displayName: string; content: string }, index) => (
                  <div 
                    key={msg.id} 
                    className="p-4 border-l-4 border-red-500/50 rounded flex items-center"
                  >
                    <p className="font-bold text-white text-5xl mr-3">{msg.displayName}:</p> 
                    <p className={`text-5xl ${msg.id === lastMessageId ? 'animate-text-pulse' : 'text-gray-200'}`}>
                        {msg.content}
                      </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center text-xl">Henüz mesaj yok...</p>
            )}
          </div>
        )}
        
        {/* Show başlamamışsa QR kod yerinde ne görünsün */}
        {!showActive && (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-400 text-xl">Show başlattığınızda burada QR kod görünecek</p>
          </div>
        )}
      </div>
    </div>
  )
}