"use client"

import React, { useRef, useState, useEffect } from 'react';

export default function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isVisualizerActive, setIsVisualizerActive] = useState(false);
  
  // Mikrofon erişimi isteme ve görselleştirmeyi başlatma
  const handleStartClick = async () => {
    try {
      // Yeni bir AudioContext oluştur
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Mikrofon erişimi iste
      console.log("Mikrofon erişimi isteniyor...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Mikrofon erişimi sağlandı");
      
      // Analyser oluştur
      const audioAnalyser = ctx.createAnalyser();
      audioAnalyser.fftSize = 256;
      
      // Mikrofon kaynağını analyser'a bağla
      const source = ctx.createMediaStreamSource(stream);
      source.connect(audioAnalyser);
      
      setAudioContext(ctx);
      setAnalyser(audioAnalyser);
      setIsVisualizerActive(true);
    } catch (error) {
      console.error("Mikrofon erişim hatası:", error);
      alert("Mikrofon erişimi sağlanamadı. Lütfen izin verdiğinizden emin olun.");
    }
  };
  
  // Görselleştirici çalıştığında canvas'a çizim yap
  useEffect(() => {
    if (!isVisualizerActive || !analyser || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Canvas boyutunu pencerenin boyutuna ayarla
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Frekans datalarını analiz etmek için dizi oluştur
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let animationFrame: number;
    
    // Ses dalga formunu çiz
    const draw = () => {
      animationFrame = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      // Canvas'ı temizle
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Bar genişliği hesapla
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      // Her frekans için bir bar çiz
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.7;
        
        // Kırmızıdan sarıya renk geçişi
        const r = 255;
        const g = Math.floor((i / bufferLength) * 255);
        const b = 0;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
    
    // Temizlik
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, [analyser, isVisualizerActive]);
  
  // Component unmount olduğunda AudioContext'i kapat
  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);
  
  return (
    <div className="absolute inset-0 -z-10">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {!isVisualizerActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handleStartClick}
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xl px-8 py-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            Ses Görselleştirmeyi Başlat
          </button>
        </div>
      )}
    </div>
  );
}