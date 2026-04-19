'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Crop {
  id: number;
  type: string;
  emoji: string;
  growth: number;
  maxGrowth: number;
  planted: boolean;
}

interface Fish {
  id: number;
  type: string;
  emoji: string;
  value: number;
}

export default function LoveFarm() {
  const [mounted, setMounted] = useState(false);
  const [hearts, setHearts] = useState(100);
  const [coins, setCoins] = useState(50);
  const [selectedTool, setSelectedTool] = useState<'plant' | 'water' | 'harvest' | 'fish'>('plant');
  const [selectedCrop, setSelectedCrop] = useState<'rose' | 'tulip' | 'sunflower'>('rose');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [caughtFish, setCaughtFish] = useState<Fish[]>([]);
  const [message, setMessage] = useState('');
  const [day, setDay] = useState(1);
  const [weather, setWeather] = useState<'sunny' | 'rainy'>('sunny');

  useEffect(() => {
    setMounted(true);
    // Initialize farm plots
    const initialCrops: Crop[] = [];
    for (let i = 0; i < 12; i++) {
      initialCrops.push({
        id: i,
        type: '',
        emoji: '',
        growth: 0,
        maxGrowth: 3,
        planted: false
      });
    }
    setCrops(initialCrops);
  }, []);

  const getCropInfo = (type: string) => {
    const cropData = {
      rose: { emoji: '🌹', sellPrice: 20, hearts: 5 },
      tulip: { emoji: '🌷', sellPrice: 15, hearts: 3 },
      sunflower: { emoji: '🌻', sellPrice: 25, hearts: 7 }
    };
    return cropData[type as keyof typeof cropData] || { emoji: '🌱', sellPrice: 10, hearts: 2 };
  };

  const plantCrop = (plotId: number) => {
    if (selectedTool !== 'plant') return;
    
    const plot = crops[plotId];
    if (plot.planted) {
      setMessage('This plot is already planted!');
      return;
    }

    if (coins < 10) {
      setMessage('Not enough coins to plant!');
      return;
    }

    const newCrops = [...crops];
    newCrops[plotId] = {
      ...plot,
      type: selectedCrop,
      emoji: '🌱',
      growth: 0,
      planted: true
    };
    setCrops(newCrops);
    setCoins(coins - 10);
    setMessage(`Planted ${selectedCrop}! 💕`);
  };

  const waterCrop = (plotId: number) => {
    if (selectedTool !== 'water') return;
    
    const plot = crops[plotId];
    if (!plot.planted) {
      setMessage('Nothing to water here!');
      return;
    }

    if (plot.growth >= plot.maxGrowth) {
      setMessage('This crop is fully grown!');
      return;
    }

    const newCrops = [...crops];
    newCrops[plotId] = {
      ...plot,
      growth: plot.growth + 1
    };

    if (newCrops[plotId].growth >= plot.maxGrowth) {
      const cropInfo = getCropInfo(plot.type);
      newCrops[plotId].emoji = cropInfo.emoji;
      setMessage('Crop is ready to harvest! 🌟');
    } else {
      setMessage('Watered the crop! 💧');
    }

    setCrops(newCrops);
    setHearts(hearts + 1);
  };

  const harvestCrop = (plotId: number) => {
    if (selectedTool !== 'harvest') return;
    
    const plot = crops[plotId];
    if (!plot.planted || plot.growth < plot.maxGrowth) {
      setMessage('Crop not ready to harvest!');
      return;
    }

    const cropInfo = getCropInfo(plot.type);
    const newCrops = [...crops];
    newCrops[plotId] = {
      ...plot,
      type: '',
      emoji: '',
      growth: 0,
      planted: false
    };
    setCrops(newCrops);
    setCoins(coins + cropInfo.sellPrice);
    setHearts(hearts + cropInfo.hearts);
    setMessage(`Harvested for ${cropInfo.sellPrice} coins and ${cropInfo.hearts} hearts! 🎉`);
  };

  const goFishing = () => {
    if (selectedTool !== 'fish') return;
    
    const fishTypes = [
      { type: 'Goldfish', emoji: '🐠', value: 10 },
      { type: 'Tropical Fish', emoji: '🐟', value: 15 },
      { type: 'Blowfish', emoji: '🐡', value: 25 },
      { type: 'Shark', emoji: '🦈', value: 50 }
    ];
    
    const caught = fishTypes[Math.floor(Math.random() * fishTypes.length)];
    setCaughtFish([...caughtFish, { ...caught, id: Date.now() }]);
    setCoins(coins + caught.value);
    setHearts(hearts + 3);
    setMessage(`Caught a ${caught.type}! ${caught.emoji} +${caught.value} coins!`);
  };

  const nextDay = () => {
    setDay(day + 1);
    setWeather(Math.random() > 0.5 ? 'sunny' : 'rainy');
    setHearts(hearts + 10);
    setMessage(`Day ${day + 1} - Weather: ${weather === 'sunny' ? '☀️ Sunny' : '🌧️ Rainy'}`);
  };

  const getGrowthDisplay = (crop: Crop) => {
    if (!crop.planted) return '';
    const stages = ['🌱', '🌿', '🌾', getCropInfo(crop.type).emoji];
    return stages[Math.min(crop.growth, crop.maxGrowth)];
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-4 text-purple-600 hover:text-purple-800 font-semibold">
            ← Back to Games
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-2">
            🌾 Love Farm 💕
          </h1>
          <p className="text-gray-700">Build a romantic farm together!</p>
        </div>

        {/* Stats */}
        <div className="bg-white/90 rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex flex-wrap justify-around gap-4">
            <div className="text-center">
              <div className="text-2xl mb-1">❤️</div>
              <div className="font-bold text-red-600">{hearts}</div>
              <div className="text-xs text-gray-600">Hearts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🪙</div>
              <div className="font-bold text-yellow-600">{coins}</div>
              <div className="text-xs text-gray-600">Coins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📅</div>
              <div className="font-bold text-blue-600">Day {day}</div>
              <div className="text-xs text-gray-600">Day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">{weather === 'sunny' ? '☀️' : '🌧️'}</div>
              <div className="font-bold text-gray-600">{weather}</div>
              <div className="text-xs text-gray-600">Weather</div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-pink-100 border-2 border-pink-300 rounded-xl p-3 mb-6 text-center text-pink-800 font-medium">
            {message}
          </div>
        )}

        {/* Tools */}
        <div className="bg-white/90 rounded-2xl p-4 mb-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-3">🛠️ Tools</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedTool('plant')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTool === 'plant'
                  ? 'bg-green-500 text-white scale-105'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              🌱 Plant
            </button>
            <button
              onClick={() => setSelectedTool('water')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTool === 'water'
                  ? 'bg-blue-500 text-white scale-105'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              💧 Water
            </button>
            <button
              onClick={() => setSelectedTool('harvest')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTool === 'harvest'
                  ? 'bg-yellow-500 text-white scale-105'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              🌾 Harvest
            </button>
            <button
              onClick={() => setSelectedTool('fish')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTool === 'fish'
                  ? 'bg-cyan-500 text-white scale-105'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              🎣 Fish
            </button>
          </div>

          {/* Crop Selection */}
          {selectedTool === 'plant' && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Select Crop:</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCrop('rose')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedCrop === 'rose'
                      ? 'bg-pink-200 border-2 border-pink-400'
                      : 'bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  🌹 Rose (20 coins)
                </button>
                <button
                  onClick={() => setSelectedCrop('tulip')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedCrop === 'tulip'
                      ? 'bg-pink-200 border-2 border-pink-400'
                      : 'bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  🌷 Tulip (15 coins)
                </button>
                <button
                  onClick={() => setSelectedCrop('sunflower')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedCrop === 'sunflower'
                      ? 'bg-yellow-200 border-2 border-yellow-400'
                      : 'bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  🌻 Sunflower (25 coins)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Farm Area */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Crops */}
          <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
            <h3 className="font-bold text-gray-800 mb-3">🌾 Farm Plots</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {crops.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => {
                    if (selectedTool === 'plant') plantCrop(crop.id);
                    else if (selectedTool === 'water') waterCrop(crop.id);
                    else if (selectedTool === 'harvest') harvestCrop(crop.id);
                  }}
                  className={`aspect-square rounded-lg border-2 flex items-center justify-center text-2xl transition-all hover:scale-105 ${
                    crop.planted
                      ? crop.growth >= crop.maxGrowth
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-green-400 bg-green-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {getGrowthDisplay(crop)}
                </button>
              ))}
            </div>
            <button
              onClick={nextDay}
              className="w-full bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              🌙 Next Day
            </button>
          </div>

          {/* Fishing */}
          <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
            <h3 className="font-bold text-gray-800 mb-3">🎣 Fishing Pond</h3>
            <div className="bg-blue-100 rounded-xl p-8 mb-4 text-center">
              <div className="text-6xl mb-4">🌊</div>
              <button
                onClick={goFishing}
                disabled={selectedTool !== 'fish'}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedTool === 'fish'
                    ? 'bg-cyan-500 text-white hover:bg-cyan-600 scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                🎣 Cast Line
              </button>
            </div>
            
            {/* Caught Fish */}
            {caughtFish.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Today's Catch:</h4>
                <div className="flex flex-wrap gap-2">
                  {caughtFish.slice(-6).map((fish) => (
                    <div key={fish.id} className="bg-blue-50 px-2 py-1 rounded-lg text-sm">
                      {fish.emoji} {fish.type}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/90 rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-2">💕 How to Play:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Plant:</strong> Choose a crop and plant it on empty plots (10 coins)</li>
            <li>• <strong>Water:</strong> Water crops to help them grow (gives hearts!)</li>
            <li>• <strong>Harvest:</strong> Collect fully grown crops for coins and hearts</li>
            <li>• <strong>Fish:</strong> Cast your line to catch valuable fish</li>
            <li>• <strong>Next Day:</strong> Advance to the next day for bonus hearts</li>
            <li>• Work together to build the most romantic farm! 🌾💕</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
