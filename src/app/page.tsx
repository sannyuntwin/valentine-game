import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-pink-600 mb-4">
            💖 Valentine's Day Games 💕
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Fun and romantic games for couples! Play together and may the best Valentine win! 
            The loser gets to kiss the winner! 😘
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Link href="/sneaky-valentine" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-pink-200">
              <div className="text-4xl mb-4 text-center">😏</div>
              <h3 className="text-xl font-bold text-pink-600 mb-2">Sneaky Valentine</h3>
              <p className="text-gray-600 text-sm">
                Try to click "No" if you can! The button moves away, shrinks, and changes text. 
                Only "Yes" lets you win! 
              </p>
              <div className="mt-4 text-pink-500 font-semibold text-sm group-hover:text-pink-700">
                Play Now →
              </div>
            </div>
          </Link>

          <Link href="/heart-chase" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-purple-200">
              <div className="text-4xl mb-4 text-center">🏃‍♀️</div>
              <h3 className="text-xl font-bold text-purple-600 mb-2">Heart Chase</h3>
              <p className="text-gray-600 text-sm">
                Single player action! Catch the moving hearts as fast as you can. 
                Build combos and beat your high score!
              </p>
              <div className="mt-4 text-purple-500 font-semibold text-sm group-hover:text-purple-700">
                Play Now →
              </div>
            </div>
          </Link>

          <Link href="/couple-chase" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-indigo-200">
              <div className="text-4xl mb-4 text-center">👫</div>
              <h3 className="text-xl font-bold text-indigo-600 mb-2">Couple Chase</h3>
              <p className="text-gray-600 text-sm">
                Turn-based competition! Take turns catching hearts. 
                3 rounds each - highest score wins the kiss!
              </p>
              <div className="mt-4 text-indigo-500 font-semibold text-sm group-hover:text-indigo-700">
                Play Now →
              </div>
            </div>
          </Link>

          <Link href="/simultaneous-chase" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-red-200">
              <div className="text-4xl mb-4 text-center">⚡</div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Simultaneous Chase</h3>
              <p className="text-gray-600 text-sm">
                Real-time multiplayer! Both players compete at once using keyboard controls. 
                Fastest fingers win the romantic prize!
              </p>
              <div className="mt-4 text-red-500 font-semibold text-sm group-hover:text-red-700">
                Play Now →
              </div>
            </div>
          </Link>
        </div>

        <footer className="text-center mt-16 text-gray-600">
          <p className="text-sm">
            Made with 💕 for Valentine's Day | Deploy on Vercel for instant sharing
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            <span>🎮 Fun Games</span>
            <span>💕 Romantic</span>
            <span>🏆 Competitive</span>
            <span>😘 Kiss Penalty</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
