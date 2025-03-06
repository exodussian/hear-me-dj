import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
          Hear Me DJ
        </h1>
        <p className="text-xl mb-12">
          Dinleyicilerinizle gerçek zamanlı etkileşime geçin
        </p>
                <Link
          href="/api/auth/signin/google?callbackUrl=/dashboard"
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-4 rounded-full
                    font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          DJ Olarak Giriş Yap
        </Link>
      </div>
    </div>
  )
}