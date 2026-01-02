'use client';

import { useState } from 'react';
import { ChallongeMatch, ChallongeParticipant } from '@/types/challonge';
import { getOrCreateSessionId } from '@/lib/session';

interface BettingModalProps {
  match: ChallongeMatch & {
    player1?: ChallongeParticipant | null;
    player2?: ChallongeParticipant | null;
  };
  onClose: () => void;
  onBetPlaced: () => void;
  currentPrediction?: number | null;
  username: string;
}

export function BettingModal({ match, onClose, onBetPlaced, currentPrediction, username }: BettingModalProps) {
  const [selectedWinner, setSelectedWinner] = useState<number | null>(currentPrediction || null);
  const [loading, setLoading] = useState(false);

  const handleBet = async (teamId: number) => {
    setSelectedWinner(teamId);
    setLoading(true);

    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          match_id: match.id,
          predicted_winner_id: teamId,
          username: username,
        }),
      });

      if (response.ok) {
        onBetPlaced();
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alert('Chyba pri ukladaní tipu');
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Chyba pri ukladaní tipu');
    } finally {
      setLoading(false);
    }
  };

  if (!match.player1 || !match.player2) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Tipuj víťaza</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl"
          >
            ×
          </button>
        </div>

        {match.scheduled_time && (
          <div className="mb-6 text-center">
            <p className="text-slate-400 text-xs">
              {new Date(match.scheduled_time).toLocaleString('sk-SK')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Team 1 */}
          <button
            onClick={() => handleBet(match.player1!.id)}
            disabled={loading || match.state === 'complete'}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              selectedWinner === match.player1!.id
                ? 'border-blue-500 bg-blue-500/20 scale-105'
                : 'border-slate-600 bg-slate-700/50 hover:border-blue-400 hover:bg-slate-700'
            } ${
              loading || match.state === 'complete'
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-3">🏆</div>
              <div className="text-white font-bold text-lg mb-2">
                {match.player1.display_name}
              </div>
              {match.state === 'complete' && match.winner_id === match.player1.id && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  VÍŤAZ
                </div>
              )}
              {currentPrediction === match.player1.id && (
                <div className="text-blue-400 text-sm mt-2">✓ Váš tip</div>
              )}
            </div>
          </button>

          {/* Team 2 */}
          <button
            onClick={() => handleBet(match.player2!.id)}
            disabled={loading || match.state === 'complete'}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              selectedWinner === match.player2!.id
                ? 'border-red-500 bg-red-500/20 scale-105'
                : 'border-slate-600 bg-slate-700/50 hover:border-red-400 hover:bg-slate-700'
            } ${
              loading || match.state === 'complete'
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-3">🏆</div>
              <div className="text-white font-bold text-lg mb-2">
                {match.player2.display_name}
              </div>
              {match.state === 'complete' && match.winner_id === match.player2.id && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  VÍŤAZ
                </div>
              )}
              {currentPrediction === match.player2.id && (
                <div className="text-red-400 text-sm mt-2">✓ Váš tip</div>
              )}
            </div>
          </button>
        </div>

        {match.state === 'complete' ? (
          <p className="text-center text-slate-400 text-sm">
            Tento zápas už sa skončil
          </p>
        ) : (
          <p className="text-center text-slate-400 text-sm">
            Klikni na tím, ktorý podľa teba vyhrá
          </p>
        )}

        <div className="mt-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
}
