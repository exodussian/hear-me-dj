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
  
  // Ekran boyutu için state
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })
  
  // Audio Visualizer için state ve ref'ler
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [audioVisualizerActive, setAudioVisualizerActive] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Ekran boyutu takibi
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    handleResize() // İlk yükleme
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
          const localIpUrl = `https://hear-me-dj-production.up.railway.app/send/${showId}`;
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
  
  useEffect(() => {
    if (!audioVisualizerActive || !analyser || !canvasRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Canvas boyutlarını ayarla
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Frekans verileri için array
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Frekans band tanımları - daha az hesaplama için basitleştirilmiş
    const bands = {
      bass: { low: 0, high: Math.floor(bufferLength * 0.1) },
      mid: { low: Math.floor(bufferLength * 0.1), high: Math.floor(bufferLength * 0.5) },
      treble: { low: Math.floor(bufferLength * 0.5), high: bufferLength }
    };
    
    // Parçacık sistemi - basitleştirilmiş sürüm
    class Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedX: number = 0;
      speedY: number = 0;
      color: string = '';
      life: number = 0;
      
      constructor() {
        this.reset();
      }
      
      reset() {
        // Ekranın merkezinden yayılan parçacıklar
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 20;
        
        this.x = canvas.width / 2 + Math.cos(angle) * distance;
        this.y = canvas.height / 2 + Math.sin(angle) * distance;
        this.size = Math.random() * 4 + 2;
        
        // Merkezden dışarı doğru hareket
        this.speedX = Math.cos(angle) * (Math.random() * 2 + 1);
        this.speedY = Math.sin(angle) * (Math.random() * 2 + 1);
        
        // Rastgele renkler
        const hue = Math.random() * 60 + 180; // Mavi-turkuaz aralığı
        this.color = `hsl(${hue}, 100%, 50%)`;
        
        this.life = 200 + Math.random() * 100;
        
        return this;
      }
      
      update(bassLevel: number) {
        // Temel hareket
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Parçacık boyutu müzikle değişsin
        this.size *= 0.99;
        this.life -= 1;
        
        // Ekran dışına çıkınca veya ömrü bitince sıfırla
        if (this.life <= 0 || this.size < 0.5 || 
            this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
          // Bas seviyesine göre parçacık yenileme oranı
          if (Math.random() < bassLevel * 0.5 + 0.1) {
            this.reset();
          }
        }
      }
      
      draw(ctx: CanvasRenderingContext2D, bassLevel: number) {
        // Alfa değeri parçacığın ömrüne göre değişsin
        const alpha = Math.min(1, this.life / 100);
        
        // Basit glow efekti
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * (1 + bassLevel), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Dalga halkası - basitleştirilmiş sürüm
    class WaveRing {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      color: string;
      speed: number;
      
      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = Math.max(canvas.width, canvas.height) * 0.8;
        this.color = color;
        this.speed = 3;
      }
      
      update() {
        this.radius += this.speed;
        return this.radius < this.maxRadius;
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        const alpha = Math.max(0, 1 - this.radius / this.maxRadius);
        
        ctx.strokeStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // Daha az parçacık
    const particles: Particle[] = [];
    const particleCount = 150; // 400 yerine 150
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    
    // Dalga halkaları
    const waveRings: WaveRing[] = [];
    let lastBeatTime = 0;
    
    // Çizim fonksiyonu
    const draw = () => {
      if (!ctx) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      
      // Mevcut zaman
      const time = Date.now();
      
      // Frekans verilerini al
      analyser.getByteFrequencyData(dataArray);
      
      // Bant seviyelerini hesapla - daha az hesaplama
      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;
      
      for (let i = bands.bass.low; i < bands.bass.high; i++) {
        bassSum += dataArray[i];
      }
      
      for (let i = bands.mid.low; i < bands.mid.high; i++) {
        midSum += dataArray[i];
      }
      
      for (let i = bands.treble.low; i < bands.treble.high; i++) {
        trebleSum += dataArray[i];
      }
      
      const bassLevel = bassSum / ((bands.bass.high - bands.bass.low) * 255);
      const midLevel = midSum / ((bands.mid.high - bands.mid.low) * 255);
      const trebleLevel = trebleSum / ((bands.treble.high - bands.treble.low) * 255);
      
      // Bass darbe algılama - basitleştirilmiş
      const isBeat = bassLevel > 0.6 && time - lastBeatTime > 300;
      
      if (isBeat) {
        lastBeatTime = time;
        
        // Yeni dalga halkası oluştur
        const hue = (time / 40) % 360;
        waveRings.push(new WaveRing(
          canvas.width / 2, 
          canvas.height / 2, 
          `hsl(${hue}, 90%, 60%)`
        ));
      }
      
      // Arka planı kademeli olarak temizle - trail efekti için
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Spektrum çiz - alt kısımda bar'lar
      const barWidth = canvas.width / bufferLength;
      const barHeightMultiplier = canvas.height * 0.4;
      
      for (let i = 0; i < bufferLength; i++) {
        const percent = dataArray[i] / 255;
        const barHeight = percent * barHeightMultiplier;
        
        // Frekans bandına göre renk
        let color;
        if (i < bands.bass.high) {
          color = `hsl(${(time / 50) % 360}, 80%, 50%)`;
        } else if (i < bands.mid.high) {
          color = `hsl(${(time / 50 + 120) % 360}, 80%, 50%)`;
        } else {
          color = `hsl(${(time / 50 + 240) % 360}, 80%, 50%)`;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth * 0.9, barHeight);
      }
      
      // Merkez dalga çiz - daha yumuşak
      ctx.strokeStyle = `hsl(${(time / 50 + 180) % 360}, 90%, 60%)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = canvas.height / 2 + (v - 1) * canvas.height / 4;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
      
      // Bas darbe ise ekrana flash efekti
      if (isBeat) {
        ctx.fillStyle = `rgba(255, 255, 255, ${bassLevel * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Halkaları güncelle ve çiz
      for (let i = waveRings.length - 1; i >= 0; i--) {
        const active = waveRings[i].update();
        if (!active) {
          waveRings.splice(i, 1);
        } else {
          waveRings[i].draw(ctx);
        }
      }
      
      // Parçacıkları güncelle ve çiz - global alpha sıfırla
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(bassLevel);
        particles[i].draw(ctx, bassLevel);
      }
    };
    
    draw();
    
    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioVisualizerActive, analyser]);


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
        if (audioContext && audioContext.state !== 'closed') {
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
        {/* Header - responsive tasarım */}
        <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-6 py-3 md:py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-0">Show Yönetimi</h1>
          <div className="flex items-center gap-2 md:gap-4">
            {showActive && (
              <button
                onClick={endShow}
                disabled={loading}
                className={`bg-red-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm
                          font-semibold hover:bg-red-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? "..." : "SONLANDIR"}
              </button>
            )}
            <Link 
              href="/dashboard"
              className="text-white px-3 md:px-4 py-1.5 md:py-2 rounded hover:text-gray-300 transition-all text-xs md:text-sm"
            >
              Geri Dön
            </Link>
          </div>
        </div>
        
        {/* QR kod bölümü - responsive tasarım */}
        {showActive && (
          <div className="flex justify-center items-center px-4 py-2 md:px-6 md:py-4">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-semibold mb-2 md:mb-4 text-white">Scan Me to Message Me!</h2>
              <div className="bg-white p-3 md:p-6 inline-block rounded-lg mb-2 md:mb-4 shadow-lg">
                <QRCodeSVG 
                  value={showUrl} 
                  size={windowSize.width < 768 ? Math.min(250, windowSize.width - 80) : 450} 
                />
              </div>
              
            </div>
          </div>
        )}
        
        {/* Show başlatma butonu - responsive tasarım */}
        {!showActive && (
          <div className="flex justify-center px-4 md:px-6 py-3 md:py-4">
            <button
              onClick={startShow}
              disabled={loading}
              className={`w-full md:w-1/3 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-full
                        font-semibold hover:opacity-90 transition-opacity ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? "Başlatılıyor..." : "Show Başlat"}
            </button>
          </div>
        )}
        
        {/* Mesajlar kısmı - responsive tasarım */}
        {showActive && (
          <div className="px-4 md:px-6 pt-2 md:pt-4 pb-16 md:pb-20 overflow-y-auto" 
               style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {messages.length > 0 ? (
              <div className="space-y-2">
                {messages.map((msg: { id: string; displayName: string; content: string }, index) => (
                  <div 
                    key={msg.id} 
                    className="p-3 md:p-4 border-l-4 border-red-500/50 rounded flex items-center"
                  >
                    <p className="font-bold text-white text-2xl md:text-5xl mr-2 md:mr-3">{msg.displayName}:</p> 
                    <p className={`text-xl md:text-5xl ${msg.id === lastMessageId ? 'animate-text-pulse' : 'text-gray-200'}`}>
                        {msg.content}
                      </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center text-lg md:text-xl">Henüz mesaj yok...</p>
            )}
          </div>
        )}
        
        {/* Show başlamamışsa QR kod yerinde ne görünsün */}
        {!showActive && (
          <div className="flex h-48 md:h-64 items-center justify-center px-4 md:px-0">
            <p className="text-gray-400 text-lg md:text-xl text-center">Show başlattığınızda burada QR kod görünecek</p>
          </div>
        )}
      </div>
    </div>
  )
}