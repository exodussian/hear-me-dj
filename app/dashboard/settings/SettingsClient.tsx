"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Session } from 'next-auth'

// Session tipi genişletme
interface ExtendedSession extends Session {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    settings?: {
      artistName?: string;
      pricePerChar?: number;
      starPrice?: number;
      kissPrice?: number;
      heartPrice?: number;
      autoModerate?: boolean;
      paypalEmail?: string;
    } | null;
  } & Record<string, unknown>;
}

export default function SettingsClient() {
  const { data: session, status } = useSession();
  const extendedSession = session as ExtendedSession;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    artistName: '',
    pricePerChar: 0.1,
    starPrice: 1.0,
    kissPrice: 2.0,
    heartPrice: 1.5,
    autoModerate: true,
    paypalEmail: '',
    bannedWords: ''
  });

  useEffect(() => {
    if (status !== 'loading') {
      setLoading(false);
      
      // Mevcut ayarları form'a yükle
      if (extendedSession?.user?.settings) {
        const settings = extendedSession.user.settings;
        setFormData({
          artistName: settings.artistName || '',
          pricePerChar: settings.pricePerChar || 0.1,
          starPrice: settings.starPrice || 1.0,
          kissPrice: settings.kissPrice || 2.0,
          heartPrice: settings.heartPrice || 1.5,
          autoModerate: settings.autoModerate !== false,
          paypalEmail: settings.paypalEmail || '',
          bannedWords: '' // API'den ayrıca yüklenecek
        });
        
        // Yasaklı kelimeleri yükle
        fetchBannedWords();
      }
    }
  }, [status, extendedSession]);

  const fetchBannedWords = async () => {
    try {
      const response = await fetch('/api/settings/banned-words');
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          bannedWords: data.words.join('\n')
        }));
      }
    } catch (error) {
      console.error('Error fetching banned words:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // DJ ayarlarını güncelle
      const settingsResponse = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          artistName: formData.artistName,
          pricePerChar: formData.pricePerChar,
          starPrice: formData.starPrice,
          kissPrice: formData.kissPrice,
          heartPrice: formData.heartPrice,
          autoModerate: formData.autoModerate,
          paypalEmail: formData.paypalEmail
        })
      });
      
      // Yasaklı kelimeleri güncelle
      const bannedWordsResponse = await fetch('/api/settings/banned-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          words: formData.bannedWords.split('\n').filter(word => word.trim() !== '')
        })
      });
      
      if (settingsResponse.ok && bannedWordsResponse.ok) {
        alert('Ayarlar başarıyla kaydedildi!');
      } else {
        alert('Ayarlar kaydedilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ayarlar kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Yükleniyor...</div>;
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">DJ Profil Ayarları</h1>
        <Link 
          href="/dashboard"
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Geri Dön
        </Link>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profil Bilgileri */}
          <div>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Profil Bilgileri</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Google İsim</label>
                <p className="bg-slate-900 p-2 rounded">{extendedSession.user?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">Email</label>
                <p className="bg-slate-900 p-2 rounded">{extendedSession.user?.email || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="artistName" className="block mb-1 font-medium">DJ Sahne Adı</label>
                <input 
                  type="text" 
                  id="artistName" 
                  name="artistName"
                  value={formData.artistName}
                  onChange={handleChange}
                  className="w-full bg-slate-900 p-2 rounded border border-gray-700 text-white"
                  placeholder="DJ Sahne Adınız"
                />
              </div>
            </div>
          </div>
          
          {/* Fiyatlandırma Ayarları */}
          <div>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Fiyatlandırma Ayarları</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pricePerChar" className="block mb-1 font-medium">Karakter Başına Ücret ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  id="pricePerChar" 
                  name="pricePerChar"
                  value={formData.pricePerChar}
                  onChange={handleChange}
                  className="w-full bg-slate-900 p-2 rounded border border-gray-700 text-white"
                />
              </div>
              <div>
                <label htmlFor="paypalEmail" className="block mb-1 font-medium">PayPal Email</label>
                <input 
                  type="email" 
                  id="paypalEmail" 
                  name="paypalEmail"
                  value={formData.paypalEmail}
                  onChange={handleChange}
                  className="w-full bg-slate-900 p-2 rounded border border-gray-700 text-white"
                  placeholder="ornek@email.com"
                />
              </div>
              <div>
                <label htmlFor="starPrice" className="block mb-1 font-medium">Yıldız Fiyatı ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  id="starPrice" 
                  name="starPrice"
                  value={formData.starPrice}
                  onChange={handleChange}
                  className="w-full bg-slate-900 p-2 rounded border border-gray-700 text-white"
                />
              </div>
              <div>
                <label htmlFor="kissPrice" className="block mb-1 font-medium">Öpücük Fiyatı ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  id="kissPrice" 
                  name="kissPrice"
                  value={formData.kissPrice}
                  onChange={handleChange}
                  className="w-full bg-slate-900 p-2 rounded border border-gray-700 text-white"
                />
              </div>
              <div>
                <label htmlFor="heartPrice" className="block mb-1 font-medium">Kalp Fiyatı ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  id="heartPrice" 
                  name="heartPrice"
                  value={formData.heartPrice}
                  onChange={handleChange}
                  className="w-full bg-slate-900 p-2 rounded border border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
          
          {/* İçerik Moderasyonu */}
          <div>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">İçerik Moderasyonu</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="autoModerate" 
                  name="autoModerate"
                  checked={formData.autoModerate}
                  onChange={handleChange}
                  className="mr-2 h-5 w-5"
                />
                <label htmlFor="autoModerate" className="font-medium">Otomatik Moderasyon</label>
              </div>
              
              <div>
                <label htmlFor="bannedWords" className="block mb-1 font-medium">Yasaklı Kelimeler</label>
                <textarea 
                  id="bannedWords" 
                  name="bannedWords"
                  value={formData.bannedWords}
                  onChange={handleChange}
                  className="w-full bg-slate-900 p-2 rounded border border-gray-700 text-white h-32"
                  placeholder="Her satıra bir kelime yazın"
                />
                <p className="text-sm text-gray-400 mt-1">Her satıra bir yasaklı kelime yazın. Bu kelimeler mesajlarda engellenecektir.</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={saving}
              className={`bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-lg
                        font-semibold hover:opacity-90 transition-opacity ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}