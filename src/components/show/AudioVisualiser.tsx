// src/components/show/AudioVisualizer.tsx
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
    
    const width = canvas.width
    const height = canvas.height
    
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const barWidth = width / bufferLength
    
    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame)
      
      analyser.getByteFrequencyData(dataArray)
      
      // Siyah arka plan
      ctx.fillStyle = 'rgb(0, 0, 0)'
      ctx.fillRect(0, 0, width, height)
      
      let x = 0
      
      // Renk geçişli barlar çiz
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height
        
        // Renk geçişi: kırmızı -> turuncu -> sarı
        const r = 255
        const g = Math.floor((i / bufferLength) * 255)
        const b = 0
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)
        
        x += barWidth
      }
    }
    
    renderFrame()
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
    
    // Canvas'ı temizle
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'rgb(0, 0, 0)'
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  return (
    <div className="w-full">
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={200} 
          className="w-full h-48 bg-black rounded-lg"
        />
        
        {!isActive ? (
          <button 
            onClick={startVisualization}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
          >
            Mikrofonu Etkinleştir
          </button>
        ) : (
          <button 
            onClick={stopVisualization}
            className="absolute bottom-2 right-2 bg-red-600 text-white px-2 py-1 
                     rounded text-sm hover:bg-red-700 transition-colors"
          >
            Durdur
          </button>
        )}
      </div>
    </div>
  )
}