'use client';

import { useState } from 'react';
import Image from 'next/image';
import JSZip from 'jszip';

const PHOTO_PASSWORD = 'Bijacovce@2026!Futbal'; // Heslo pre prístup k fotkám

export function PhotosView() {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);

  // Generate array of photo filenames (001-168, excluding 003 and 146)
  const photos = Array.from({ length: 168 }, (_, i) => i + 1)
    .filter(num => num !== 3 && num !== 146)
    .map(num => {
      const numStr = String(num).padStart(3, '0');
      return `2026-Bijacovce-Futbalový turnaj-${numStr}.jpg`;
    });

  const togglePhotoSelection = (index: number) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(Array.from({ length: photos.length }, (_, i) => i)));
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PHOTO_PASSWORD) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Nesprávne heslo. Skúste to znova.');
      setPassword('');
    }
  };

  const downloadPhotos = async (photoIndices: number[]) => {
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: photoIndices.length });

    try {
      const zip = new JSZip();
      const folder = zip.folder('Bijacovce-Futbalovy-Turnaj-2026');

      // Download photos in parallel batches (100 at a time for maximum speed)
      const BATCH_SIZE = 100;
      const batches = [];
      for (let i = 0; i < photoIndices.length; i += BATCH_SIZE) {
        batches.push(photoIndices.slice(i, i + BATCH_SIZE));
      }

      let completed = 0;
      for (const batch of batches) {
        await Promise.all(
          batch.map(async (i) => {
            const photoUrl = `/photos/${photos[i]}`;
            try {
              const response = await fetch(photoUrl);
              const blob = await response.blob();
              folder?.file(photos[i], blob);
            } catch (error) {
              console.error(`Failed to download ${photos[i]}:`, error);
            } finally {
              completed++;
              setDownloadProgress({ current: completed, total: photoIndices.length });
            }
          })
        );
      }

      // Generate ZIP file
      setDownloadProgress({ current: photoIndices.length, total: photoIndices.length });
      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Create download link
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      const fileName = photoIndices.length === photos.length
        ? 'Bijacovce-Futbalovy-Turnaj-2026-Fotky.zip'
        : `Bijacovce-Futbalovy-Turnaj-2026-Vyber-${photoIndices.length}-fotiek.zip`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Chyba pri vytváraní ZIP súboru. Skúste to znova.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const downloadAllPhotos = () => {
    downloadPhotos(Array.from({ length: photos.length }, (_, i) => i));
  };

  const downloadSelectedPhotos = () => {
    downloadPhotos(Array.from(selectedPhotos).sort((a, b) => a - b));
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

          <a
            href="https://www.instagram.com/bernardsmihula"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-green-400 text-sm mt-6 inline-flex items-center gap-2 transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Fotograf: Bernard Šmihuľa
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-4 md:p-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-3xl">📸</span>
                Fotky z turnaja
              </h2>
              <a
                href="https://www.instagram.com/bernardsmihula"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-green-400 transition inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Fotograf: Bernard Šmihuľa
              </a>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="flex gap-2">
                <button
                  onClick={downloadAllPhotos}
                  disabled={isDownloading}
                  className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition font-medium flex items-center justify-center gap-2 shadow-lg text-sm md:text-base whitespace-nowrap"
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {downloadProgress ? `${downloadProgress.current}/${downloadProgress.total}` : 'Sťahujem...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Všetky
                    </>
                  )}
                </button>
                {selectedPhotos.size > 0 && (
                  <button
                    onClick={downloadSelectedPhotos}
                    disabled={isDownloading}
                    className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition font-medium flex items-center justify-center gap-2 shadow-lg text-sm md:text-base whitespace-nowrap"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Vybrané ({selectedPhotos.size})
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAllPhotos}
                  className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-xs md:text-sm"
                >
                  Vybrať všetky
                </button>
                <button
                  onClick={clearSelection}
                  className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-xs md:text-sm"
                >
                  Zrušiť výber
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {downloadProgress && (
            <div className="mt-4 bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  Sťahujem fotky...
                </span>
                <span className="text-green-400 text-sm font-bold">
                  {downloadProgress.current} / {downloadProgress.total}
                  {' '}({Math.round((downloadProgress.current / downloadProgress.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => {
            const isSelected = selectedPhotos.has(index);
            return (
              <div
                key={photo}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-900/50"
              >
                {/* Checkbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhotoSelection(index);
                  }}
                  className="absolute top-2 left-2 z-10 cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-green-500 border-green-500'
                      : 'bg-slate-900/70 border-slate-400 hover:border-green-400'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Image */}
                <div
                  onClick={() => openLightbox(index)}
                  className="cursor-pointer group w-full h-full"
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

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute inset-0 border-4 border-green-500 pointer-events-none rounded-lg" />
                )}
              </div>
            );
          })}
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
