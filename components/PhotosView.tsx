'use client';

import { useState } from 'react';
import Image from 'next/image';

const PHOTO_PASSWORD = 'bijacovce2026'; // Heslo pre prístup k fotkám

export function PhotosView() {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  // Generate array of photo filenames (001-168)
  const photos = Array.from({ length: 168 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return `2026-Bijacovce-Futbalový turnaj-${num}.jpg`;
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase() === PHOTO_PASSWORD) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Nesprávne heslo. Skúste to znova.');
      setPassword('');
    }
  };

  const openLightbox = (index: number) => {
    setSelectedPhoto(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const nextPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto < photos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1);
    }
  };

  const prevPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 md:p-12">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl md:text-8xl mb-6">📸</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Fotky z turnaja
          </h2>
          <p className="text-slate-300 text-lg mb-6">
            Pre zobrazenie fotografií zadajte heslo
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Zadajte heslo"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition font-medium shadow-lg"
            >
              Odomknúť fotky
            </button>
          </form>

          <p className="text-slate-400 text-sm mt-6">
            Fotografie: Bernard Šmihuľa
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="text-3xl">📸</span>
            Fotky z turnaja
          </h2>
          <p className="text-slate-300">
            Fotografie: Bernard Šmihuľa
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo}
              onClick={() => openLightbox(index)}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-slate-900/50"
            >
              <Image
                src={`/photos/${photo}`}
                alt={`Turnaj foto ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedPhoto !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition z-10"
          >
            ×
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              prevPhoto();
            }}
            disabled={selectedPhoto === 0}
            className="absolute left-4 text-white text-4xl hover:text-gray-300 transition disabled:opacity-30 disabled:cursor-not-allowed z-10"
          >
            ‹
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextPhoto();
            }}
            disabled={selectedPhoto === photos.length - 1}
            className="absolute right-4 text-white text-4xl hover:text-gray-300 transition disabled:opacity-30 disabled:cursor-not-allowed z-10"
          >
            ›
          </button>

          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={`/photos/${photos[selectedPhoto]}`}
              alt={`Turnaj foto ${selectedPhoto + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-lg">
            {selectedPhoto + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
