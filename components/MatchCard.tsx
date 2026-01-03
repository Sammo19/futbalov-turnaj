'use client';

import { useState, useEffect } from 'react';
import { ChallongeMatch, ChallongeParticipant } from '@/types/challonge';
import { getOrCreateSessionId } from '@/lib/session';
import { declineTip } from '@/lib/slovak';

interface MatchCardProps {
  match: ChallongeMatch & {
    player1?: ChallongeParticipant | null;
    player2?: ChallongeParticipant | null;
  };
  readOnly?: boolean;
}

interface PredictionStats {
  predicted_winner_id: number;
  vote_count: number;
  vote_percentage: number;
}

export function MatchCard({ match, readOnly = false }: MatchCardProps) {
  const [myPrediction, setMyPrediction] = useState<number | null>(null);
  const [stats, setStats] = useState<PredictionStats[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!readOnly) {
      loadPrediction();
      loadStats();
    }
  }, [match.id, readOnly]);

  const loadPrediction = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch(`/api/predictions?session_id=${sessionId}`);

      if (response.ok) {
        const predictions = await response.json();
        const prediction = predictions.find((p: any) => p.match_id === match.id);
        if (prediction) {
          setMyPrediction(prediction.predicted_winner_id);
        }
      }
    } catch (error) {
      console.error('Error loading prediction:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/predictions/stats?match_id=${match.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handlePredict = async (winnerId: number) => {
    if (match.state === 'complete') return;

    try {
      setIsSubmitting(true);
      const sessionId = getOrCreateSessionId();

      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          match_id: match.id,
          predicted_winner_id: winnerId,
        }),
      });

      if (response.ok) {
        setMyPrediction(winnerId);
        await loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error saving prediction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStateColor = () => {
    // Zápasy ktoré sú aktívne prebiehajúce (underway_at nie je null) majú zelené pozadie
    if (match.underway_at) {
      return 'bg-gradient-to-br from-green-600/30 to-emerald-600/20 border-green-500/60 shadow-lg shadow-green-500/20';
    }
    // Ostatné zápasy majú normálne pozadie
    return 'bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50';
  };

  const getStateLabel = () => {
    switch (match.state) {
      case 'complete':
        return 'Dokončené';
      case 'open':
        return 'Prebieha';
      case 'pending':
        return 'Čaká';
      default:
        return 'Neznámy';
    }
  };

  const parseScore = (scoresCsv: string) => {
    if (!scoresCsv || scoresCsv.trim() === '') return null;

    // Try different delimiters: "-", ":", ",", " "
    let scores = scoresCsv.split('-');
    if (scores.length !== 2) scores = scoresCsv.split(':');
    if (scores.length !== 2) scores = scoresCsv.split(',');
    if (scores.length !== 2) scores = scoresCsv.split(' ');

    // Clean up and validate
    scores = scores.map(s => s.trim()).filter(s => s !== '');

    return scores.length === 2 ? scores : null;
  };

  const scores = parseScore(match.scores_csv);

  // Debug: log to see what scores_csv contains
  console.log('Match:', match.id, 'scores_csv:', match.scores_csv, 'parsed:', scores);

  const getVotePercentage = (playerId: number) => {
    const stat = stats.find((s) => s.predicted_winner_id === playerId);
    return stat ? Math.round(stat.vote_percentage) : 0;
  };

  const getVoteCount = (playerId: number) => {
    const stat = stats.find((s) => s.predicted_winner_id === playerId);
    return stat ? stat.vote_count : 0;
  };

  const renderPlayer = (
    player: ChallongeParticipant | null | undefined,
    playerId: number | null,
    isPlayer1: boolean
  ) => {
    const playerName = player?.display_name || 'TBD';
    const isWinner = match.winner_id === playerId;
    const isMyPrediction = !readOnly && myPrediction === playerId;
    const canPredict = !readOnly && match.state !== 'complete' && playerId;
    const votePercentage = !readOnly && playerId ? getVotePercentage(playerId) : 0;
    const voteCount = !readOnly && playerId ? getVoteCount(playerId) : 0;

    const Component = readOnly ? 'div' : 'button';

    return (
      <Component
        {...(!readOnly && {
          onClick: () => canPredict && handlePredict(playerId!),
          disabled: !canPredict || isSubmitting,
        })}
        className={`flex-1 p-4 rounded-lg transition-all ${
          !readOnly && canPredict
            ? 'hover:scale-105 cursor-pointer'
            : readOnly
            ? ''
            : 'cursor-not-allowed opacity-75'
        } ${
          isWinner
            ? 'bg-gradient-to-br from-green-600/40 to-emerald-600/30 border-2 border-green-400 shadow-lg shadow-green-500/30'
            : isMyPrediction
            ? 'bg-gradient-to-br from-emerald-600/30 to-green-600/20 border-2 border-emerald-400'
            : 'bg-slate-700/50 border-2 border-slate-600' + (!readOnly ? ' hover:border-green-500 hover:bg-green-900/20' : '')
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-white mb-1 break-words leading-tight">{playerName}</div>
          </div>

          {isWinner && (
            <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Víťaz
            </div>
          )}

          {!readOnly && isMyPrediction && !isWinner && match.state !== 'complete' && (
            <div className="text-emerald-400 text-sm font-medium flex items-center gap-1">
              <span>⚽</span>
              Váš tip
            </div>
          )}

          {!readOnly && voteCount > 0 && (
            <div className="w-full mt-2">
              <div className="flex justify-between text-xs text-green-200 mb-1">
                <span>{voteCount} {declineTip(voteCount)}</span>
                <span className="font-bold">{votePercentage}%</span>
              </div>
              <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all shadow-sm"
                  style={{ width: `${votePercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </Component>
    );
  };

  return (
    <div className={`rounded-xl border-2 ${getStateColor()} p-4 backdrop-blur-sm`}>
      {match.state === 'complete' && (
        <div className="flex justify-center mb-3">
          <span className="text-xs bg-green-500/30 text-green-300 px-3 py-1 rounded-full border border-green-500/50 font-bold flex items-center gap-1">
            <span>🏆</span>
            Dokončený
          </span>
        </div>
      )}

      <div className="flex gap-4">
        {renderPlayer(match.player1, match.player1_id, true)}

        <div className="flex flex-col items-center justify-center px-2 min-w-[80px]">
          {match.state === 'complete' && scores ? (
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-slate-400">Skóre</div>
              <div className="flex items-center gap-2">
                <div className={`text-3xl font-bold ${
                  match.winner_id === match.player1_id ? 'text-green-400' : 'text-slate-300'
                }`}>
                  {scores[0]}
                </div>
                <div className="text-slate-500 font-bold text-xl">:</div>
                <div className={`text-3xl font-bold ${
                  match.winner_id === match.player2_id ? 'text-green-400' : 'text-slate-300'
                }`}>
                  {scores[1]}
                </div>
              </div>
            </div>
          ) : match.state === 'complete' && !scores ? (
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-slate-400 mb-1">Skóre</div>
              <div className="text-lg text-slate-500">—</div>
              <div className="text-xs text-slate-500">Nevyplnené</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {match.scheduled_time && (
                <div className="text-xs text-slate-400">
                  {new Date(match.scheduled_time).toLocaleTimeString('sk-SK', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </div>
              )}
              <div className="text-slate-400 font-bold text-3xl">VS</div>
            </div>
          )}
        </div>

        {renderPlayer(match.player2, match.player2_id, false)}
      </div>

      {!readOnly && match.state !== 'complete' && (
        <div className="mt-4 text-center text-sm text-slate-400">
          Kliknite na hráča pre tipovanie výsledku
        </div>
      )}
    </div>
  );
}
