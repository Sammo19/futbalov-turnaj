'use client';

import Image from 'next/image';
import { sponsors } from '@/lib/sponsors-config';

export function Sponsors() {
  // Don't render if no sponsors configured
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-4 md:p-6 shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 text-center flex items-center justify-center gap-2">
          <span className="text-2xl md:text-3xl">🤝</span>
          Sponzori
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {sponsors.map((sponsor, index) => (
            <SponsorCard key={index} sponsor={sponsor} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SponsorCard({ sponsor }: { sponsor: typeof sponsors[0] }) {
  const content = (
    <div className="bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 rounded-lg p-3 md:p-4 transition-all hover:scale-105 flex flex-col items-center justify-center min-h-[140px] md:min-h-[160px] gap-2">
      {sponsor.type === 'image' && sponsor.image ? (
        <>
          <div className="relative w-full h-20 md:h-24 flex-shrink-0">
            <Image
              src={`/sponsors/${sponsor.image}`}
              alt={sponsor.name}
              fill
              className="object-contain p-1"
            />
          </div>
          {sponsor.text && (
            <div className="text-center px-1">
              <p className="text-xs md:text-sm font-semibold text-white break-words leading-tight">
                {sponsor.text}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center px-2">
          <p className="text-xs md:text-sm font-bold text-white break-words leading-tight">
            {sponsor.text || sponsor.name}
          </p>
        </div>
      )}
    </div>
  );

  // Wrap in link if provided
  if (sponsor.link) {
    return (
      <a
        href={sponsor.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}
