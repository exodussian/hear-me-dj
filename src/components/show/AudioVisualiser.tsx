"use client"

import { useRef, useEffect, useState } from 'react'

export default function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    return () => {
      // Cleanup
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const startVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Audio context oluştur
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      
      // Analiz ayarları
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8
      
      // Mikrofon kaynağını bağla
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      setIsActive(true)
      drawVisualizer()
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Mikrofon erişimi sağlanamadı. Lütfen mikrofon izinlerini kontrol edin.')
    }
  }

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Canvas'ı pencere boyutuna ayarla
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const barWidth = (canvas.width / bufferLength) * 2.5
    
    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame)
      
      analyser.getByteFrequencyData(dataArray)
      
      // Arkaplanı temizle - transparant
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      let x = 0
      
      // Renk geçişli barlar çiz
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.5
        
        // Renk geçişi: kırmızı -> turuncu -> sarı
        const r = 255
        const g = Math.floor((i / bufferLength) * 255)
        const b = 0
        
        // Daha şeffaf renk
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`
        
        // Ekran merkezini referans alarak çiz
        const yPos = canvas.height - barHeight
        ctx.fillRect(x, yPos, barWidth, barHeight)
        
        x += barWidth + 1
      }
    }
    
    renderFrame()
    
    // Pencere boyutu değiştiğinde canvas boyutunu ayarla
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }

  const stopVisualization = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    setIsActive(false)
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {!isActive && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <button 
            onClick={startVisualization}
            className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
          >
            Mikrofonu Etkinleştir
          </button>
        </div>
      )}
      
      {isActive && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <button 
            onClick={stopVisualization}
            className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition-colors opacity-50 hover:opacity-100"
          >
            Visualizer Durdur
          </button>
        </div>
      )}
    </div>
  )
}