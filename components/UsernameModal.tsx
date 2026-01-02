'use client';

import { useState } from 'react';

interface UsernameModalProps {
  onSubmit: (username: string) => Promise<void>;
}

// Zoznam zakázaných slov
const BANNED_WORDS = [
  // Rasistické a offensive výrazy
  'nigger', 'nigga', 'negro', 'coon', 'spic', 'chink', 'gook', 'kike',
  'faggot', 'fag', 'dyke', 'tranny', 'retard', 'retarded',
  // Slovenské vulgarizmy a offensive výrazy
  'kurva', 'kurv', 'kurw', 'piča', 'pica', 'píča', 'kokot', 'kokos',
  'jebať', 'jebat', 'jebo', 'jeban', 'pierdol', 'zasran', 'hovno',
  'cigán', 'cigan', 'cigansky', 'žid', 'zid', 'židák', 'židáci',
  // Čísla namiesto písmen
  'n1gger', 'n1gg3r', 'f4ggot', 'f4g', 'k1ke',
  // Politické a extrémistické
  'hitler', 'nazi', 'neonazi', 'kkk', 'white power', 'heil',
  // Ďalšie offensive
  'bitch', 'whore', 'slut', 'cunt', 'pussy', 'dick', 'cock',
  'asshole', 'shit', 'fuck', 'motherfucker',
];

const isBannedUsername = (username: string): boolean => {
  const normalized = username.toLowerCase()
    .replace(/[0@]/g, 'o')
    .replace(/[1!i]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[8]/g, 'b')
    .replace(/[\s_-]/g, '');

  return BANNED_WORDS.some(word => {
    const normalizedWord = word.toLowerCase().replace(/[\s_-]/g, '');
    return normalized.includes(normalizedWord);
  });
};

export function UsernameModal({ onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Zadaj prosím prezývku');
      return;
    }

    if (username.trim().length < 2) {
      setError('Prezývka musí mať aspoň 2 znaky');
      return;
    }

    if (username.trim().length > 20) {
      setError('Prezývka môže mať maximálne 20 znakov');
      return;
    }

    if (isBannedUsername(username.trim())) {
      setError('Táto prezývka nie je povolená. Vyber si prosím inú.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(username.trim());
    } catch (err: any) {
      setError(err.message || 'Chyba pri ukladaní prezývky');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-white mb-2">Vitaj v tipovaní!</h2>
          <p className="text-slate-300 text-sm">
            Zadaj si prezývku aby sme vedeli komu priradiť tvoje tipy
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
              Tvoja prezývka
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              placeholder="Napríklad: Janko"
              autoFocus
              maxLength={20}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                Overujem...
              </>
            ) : (
              'Začať tipovať'
            )}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Prezývka sa uloží do databázy a môžeš ju neskôr zmeniť
        </p>
      </div>
    </div>
  );
}
