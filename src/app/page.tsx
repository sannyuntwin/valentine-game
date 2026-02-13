'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import Head from 'next/head';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mountedClient, setMountedClient] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMountedClient(true);
  }, []);

  // Generate deterministic positions for floating hearts
  const generateHearts = () => {
    const hearts = [];
    for (let i = 0; i < 15; i++) {
      // Use index-based positioning for consistency
      const positions = [
        { left: '10%', top: '20%', delay: '0s', duration: '3s' },
        { left: '30%', top: '60%', delay: '0.5s', duration: '4s' },
        { left: '50%', top: '30%', delay: '1s', duration: '3.5s' },
        { left: '70%', top: '70%', delay: '1.5s', duration: '4.5s' },
        { left: '85%', top: '40%', delay: '2s', duration: '5s' },
        { left: '20%', top: '80%', delay: '2.5s', duration: '3.8s' },
        { left: '60%', top: '15%', delay: '3s', duration: '4.2s' },
        { left: '40%', top: '50%', delay: '3.5s', duration: '4.7s' },
        { left: '80%', top: '25%', delay: '4s', duration: '5.2s' },
        { left: '15%', top: '65%', delay: '4.5s', duration: '4.3s' },
        { left: '55%', top: '85%', delay: '5s', duration: '5.5s' },
        { left: '75%', top: '55%', delay: '5.5s', duration: '4.8s' },
        { left: '25%', top: '35%', delay: '6s', duration: '5.8s' },
        { left: '65%', top: '75%', delay: '6.5s', duration: '6.2s' },
        { left: '45%', top: '45%', delay: '7s', duration: '6.5s' },
        { left: '90%', top: '90%', delay: '7.5s', duration: '7s' }
      ];

      const pos = positions[i % positions.length];
      const emoji = ['💖', '💕', '💗', '💓', '💝'][i % 5];

      hearts.push({
        id: i,
        left: pos.left,
        top: pos.top,
        delay: pos.delay,
        duration: pos.duration,
        emoji
      });
    }
    return hearts;
  };

  const hearts = generateHearts();

  const games = [
    {
      id: "sneaky-valentine",
      emoji: "😏",
      title: "Sneaky Valentine",
      description: "Try to click 'No' if you can! The button moves away, shrinks, and changes text. Only 'Yes' lets you win!",
      color: "pink",
      gradient: "from-pink-400 to-rose-500",
      borderColor: "border-pink-200",
      hoverColor: "group-hover:text-pink-700"
    },
    {
      id: "love-catch",
      emoji: "💕",
      title: "Love Catch",
      description: "Catch falling hearts of love! Play solo, local, or online multiplayer. Compete for the highest score and win romantic kisses!",
      color: "red",
      gradient: "from-red-400 to-pink-500",
      borderColor: "border-red-200",
      hoverColor: "group-hover:text-red-700"
    },
    {
      id: "tic-tac-toe",
      emoji: "🎮",
      title: "Tic Tac Toe",
      description: "Classic strategy game! Take turns placing hearts and sparkles. First to get 3 in a row wins the kiss!",
      color: "green",
      gradient: "from-green-400 to-emerald-500",
      borderColor: "border-green-200",
      hoverColor: "group-hover:text-green-700"
    }
  ];

  return (
    <>
      <Head>
        <title>Valentine's Day Games - Fun Romantic Games for Couples 💕</title>
        <meta name="description" content="Play fun Valentine's Day games together! Sneaky Valentine, Love Catch, and Tic Tac Toe - perfect for couples looking for romantic fun and competition." />
        <meta name="keywords" content="Valentine's Day games, romantic games, couple games, love games, multiplayer games, Valentine games, fun games, couple activities" />
        <meta property="og:title" content="Valentine's Day Games - Fun Romantic Games for Couples 💕" />
        <meta property="og:description" content="Play fun Valentine's Day games together! Sneaky Valentine, Love Catch, and Tic Tac Toe - perfect for couples looking for romantic fun and competition." />
        <meta property="og:image" content="https://your-valentine-game.vercel.app/og-image.jpg" />
        <meta property="og:url" content="https://your-valentine-game.vercel.app" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Valentine's Day Games - Fun Romantic Games for Couples 💕" />
        <meta name="twitter:description" content="Play fun Valentine's Day games together! Sneaky Valentine, Love Catch, and Tic Tac Toe - perfect for couples looking for romantic fun and competition." />
        <meta name="twitter:image" content="https://your-valentine-game.vercel.app/twitter-image.jpg" />
        <link rel="canonical" href="https://your-valentine-game.vercel.app" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {mountedClient && hearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute animate-float opacity-20"
              style={{
                left: heart.left,
                top: heart.top,
                animationDelay: heart.delay,
                animationDuration: heart.duration
              }}
            >
              <div className="text-4xl">{heart.emoji}</div>
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Enhanced Header */}
          <header className="text-center mb-16">
            <div className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 animate-pulse">
                💖 Valentine's Day Games 💕
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Fun and romantic games for couples! Play together and may the best Valentine win!
                <span className="inline-block ml-2 text-pink-600 font-semibold animate-bounce">The loser gets to kiss the winner! 😘</span>
              </p>
            </div>
          </header>

          {/* Enhanced Game Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {games.map((game, index) => (
              <Link href={`/${game.id}`} key={game.id} className="group">
                <div
                  className={`relative bg-white rounded-3xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl hover:scale-105 border-2 ${game.borderColor} overflow-hidden`}
                  onMouseEnter={() => setHoveredCard(game.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    animation: mounted ? 'slideInUp 0.8s ease-out forwards' : 'none'
                  }}
                >
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                  {/* Animated Emoji */}
                  <div className={`text-6xl mb-6 text-center transform transition-all duration-300 ${hoveredCard === game.id ? 'scale-125 rotate-12' : 'scale-100'}`}>
                    {game.emoji}
                  </div>

                  {/* Game Title */}
                  <h3 className={`text-2xl font-bold text-${game.color}-600 mb-3 group-hover:scale-105 transition-transform duration-300`}>
                    {game.title}
                  </h3>

                  {/* Game Description */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {game.description}
                  </p>

                  {/* Play Button */}
                  <div className={`text-${game.color}-500 font-semibold text-lg ${game.hoverColor} flex items-center justify-center gap-2 transition-all duration-300 group-hover:gap-3`}>
                    <span className="transform transition-transform duration-300 group-hover:scale-110">Play Now</span>
                    <span className="transform transition-all duration-300 group-hover:translate-x-2">→</span>
                  </div>

                  {/* Floating Hearts on Hover */}
                  {hoveredCard === game.id && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute text-2xl animate-float-up"
                          style={{
                            left: `${20 + i * 15}%`,
                            bottom: '10%',
                            animationDelay: `${i * 0.1}s`
                          }}
                        >
                          💖
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Enhanced Footer */}
          <footer className="text-center mt-24 text-gray-600">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto shadow-lg">
              <p className="text-lg font-semibold mb-4">
                Made with 💕 for Valentine's Day
              </p>
              <p className="text-sm mb-6">
                Deploy on Vercel for instant sharing with your loved one!
              </p>
              <div className="flex justify-center gap-6 text-sm flex-wrap">
                <span className="px-3 py-1 bg-pink-100 rounded-full text-pink-700 font-medium">🎮 Fun Games</span>
                <span className="px-3 py-1 bg-purple-100 rounded-full text-purple-700 font-medium">💕 Romantic</span>
                <span className="px-3 py-1 bg-indigo-100 rounded-full text-indigo-700 font-medium">🏆 Competitive</span>
                <span className="px-3 py-1 bg-red-100 rounded-full text-red-700 font-medium">😘 Kiss Penalty</span>
              </div>
            </div>
          </footer>
        </div>

        {/* Custom Styles */}
        <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        
        @keyframes float-up {
          0% { transform: translateY(0px) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
      `}</style>
      </div>
    </>
  );
}
