"use client"

import { useRef, useEffect, useState } from 'react'

export default function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [animationId, setAnimationId] = useState<number | null>(null)

  // Mikrofon erişimi ve görselleştirmeyi başlat
  const startVisualization = async () => {
    try {
      // Kullanıcı etkileşiminden sonra mikrofon erişimi talep et
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("Mikrofon erişimi sağlandı", stream)
      
      // Yeni audio context oluştur
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioAnalyser = context.createAnalyser()
      
      // Analiz ayarları
      audioAnalyser.fftSize = 256
      audioAnalyser.smoothingTimeConstant = 0.8
      
      // Mikrofon kaynağını bağla
      const source = context.createMediaStreamSource(stream)
      source.connect(audioAnalyser)
      
      setAudioContext(context)
      setAnalyser(audioAnalyser)
      setIsActive(true)
      
      // Canvas üzerinde görselleştirmeyi başlat
      renderCanvas(audioAnalyser)
      
    } catch (error) {
      console.error('Mikrofon erişimi hatası:', error)
      alert('Mikrofon erişimi sağlanamadı. Lütfen mikrofon izinlerini kontrol edin.')
    }
  }

  // Canvas'a çizim yapma
  const renderCanvas = (audioAnalyser: AnalyserNode) => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Canvas boyutunu ayarla
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const bufferLength = audioAnalyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const barWidth = (canvas.width / bufferLength) * 2.5
    
    const draw = () => {
      const id = requestAnimationFrame(draw)
      setAnimationId(id)
      
      audioAnalyser.getByteFrequencyData(dataArray)
      
      // Ekranı temizle
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      let x = 0
      
      // Frequency barlarını çiz
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.7
        
        // Kırmızı-sarı gradyan
        const r = 255
        const g = Math.floor((i / bufferLength) * 255)
        const b = 0
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        
        x += barWidth + 1
      }
    }
    
    draw()
  }

  // Görselleştirmeyi durdur
  const stopVisualization = () => {
    if (audioContext) {
      audioContext.close()
      setAudioContext(null)
    }
    
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
    }
    
    setIsActive(false)
  }

  // Component temizliği
  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close()
      }
      if (animationId !== null) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [audioContext, animationId])

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10">
        {!isActive ? (
          <button 
            onClick={startVisualization}
            className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors"
          >
            Görselleştirmeyi Başlat
          </button>
        ) : (
          <button 
            onClick={stopVisualization}
            className="bg-red-600 text-white px-4 py-2 rounded-full text-sm hover:bg-red-700 transition-colors opacity-50 hover:opacity-100"
          >
            Görselleştirmeyi Durdur
          </button>
        )}
      </div>
    </div>
  )
}