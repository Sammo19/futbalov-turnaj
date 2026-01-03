'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChallongeTournament, ChallongeMatch, ChallongeParticipant } from '@/types/challonge';
import { MatchCard } from './MatchCard';
import { TeamsView } from './TeamsView';
import { PredictionsView } from './PredictionsView';
import { StatsView } from './StatsView';
import { format } from 'date-fns';
import { declineUcastnik, declineZapas } from '@/lib/slovak';

interface TournamentViewProps {
  tournament: ChallongeTournament;
  matches: (ChallongeMatch & {
    player1?: ChallongeParticipant | null;
    player2?: ChallongeParticipant | null;
  })[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function TournamentView({
  tournament,
  matches,
  onRefresh,
  isRefreshing,
}: TournamentViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'group_a' | 'group_b' | 'semifinal' | 'final' | 'teams' | 'predictions' | 'stats' | 'photos'>('all');

  // Get unique participants from matches
  const getUniqueParticipants = () => {
    const participantsMap = new Map<number, ChallongeParticipant>();

    matches.forEach(match => {
      if (match.player1) {
        participantsMap.set(match.player1.id, match.player1);
      }
      if (match.player2) {
        participantsMap.set(match.player2.id, match.player2);
      }
    });

    return Array.from(participantsMap.values());
  };

  // Check if tournament has group stages
  const hasGroups = tournament.group_stages_enabled && matches.some(m => m.group_id !== null);

  // Group IDs for this tournament
  const GROUP_A_ID = 7639200;
  const GROUP_B_ID = 7639201;

  // Group matches by group_id if groups are enabled, otherwise by round
  const matchesByGroup = matches.reduce((acc, match) => {
    const key = hasGroups ? (match.group_id || 0) : match.round;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(match);
    return acc;
  }, {} as Record<number, typeof matches>);

  // Sort groups/rounds
  const sortedGroups = Object.keys(matchesByGroup)
    .map(Number)
    .sort((a, b) => a - b);

  // Filter matches based on selected tab
  const filteredGroups = sortedGroups.reduce((acc, groupKey) => {
    let includeGroup = false;

    if (filter === 'all') {
      includeGroup = true;
    } else if (filter === 'group_a') {
      includeGroup = groupKey === GROUP_A_ID;
    } else if (filter === 'group_b') {
      includeGroup = groupKey === GROUP_B_ID;
    } else if (filter === 'semifinal') {
      // Playoff matches have group_id = null or 0, and specific rounds
      includeGroup = (groupKey === 0 || !groupKey) && matchesByGroup[groupKey].some(m =>
        m.identifier?.toLowerCase().includes('semi') || m.round === 1
      );
    } else if (filter === 'final') {
      // Final matches
      includeGroup = (groupKey === 0 || !groupKey) && matchesByGroup[groupKey].some(m =>
        m.identifier?.toLowerCase().includes('final') || m.round === 2
      );
    }

    if (includeGroup) {
      acc[groupKey] = matchesByGroup[groupKey];
    }
    return acc;
  }, {} as Record<number, typeof matches>);

  const getGroupName = (groupKey: number) => {
    if (hasGroups) {
      // Map group_id to group name
      const groupNames: Record<number, string> = {
        7639200: 'Skupina A',
        7639201: 'Skupina B',
        0: 'Playoff', // Playoff matches
      };

      if (groupKey === 0) {
        // Check if it's semifinal or final based on matches
        const playoffMatches = matchesByGroup[groupKey] || [];
        const hasSemi = playoffMatches.some(m => m.identifier?.toLowerCase().includes('semi') || m.round === 1);
        const hasFinal = playoffMatches.some(m => m.identifier?.toLowerCase().includes('final') || m.round === 2);

        if (hasFinal && !hasSemi) return 'Finále';
        if (hasSemi && !hasFinal) return 'Semifinále';
        return 'Playoff';
      }

      return groupNames[groupKey] || `Skupina ${groupKey}`;
    } else {
      // Use round numbers
      if (groupKey > 0) {
        return `Finálové kolo ${groupKey}`;
      } else if (groupKey < 0) {
        return `Loser Bracket ${Math.abs(groupKey)}`;
      }
      return 'Zápas';
    }
  };

  const getProgressPercentage = () => {
    if (tournament.progress_meter) {
      return tournament.progress_meter;
    }
    const completed = matches.filter((m) => m.state === 'complete').length;
    return (completed / matches.length) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-green-800/40 backdrop-blur-sm border border-green-700/50 rounded-2xl p-4 md:p-6 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 flex items-start gap-2 md:gap-3">
              <span className="text-3xl md:text-5xl flex-shrink-0">⚽</span>
              <span className="break-words leading-tight">{tournament.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-green-200">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {tournament.state === 'underway' && 'Prebieha'}
                {tournament.state === 'group_stages_underway' && 'Skupinová fáza prebieha'}
                {tournament.state === 'pending' && 'Čaká sa na začiatok'}
                {tournament.state === 'complete' && 'Dokončený'}
              </span>
              <span>{tournament.participants_count} {declineUcastnik(tournament.participants_count)}</span>
              <span>{matches.length} {declineZapas(matches.length)}</span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2 shadow-lg text-sm md:text-base whitespace-nowrap"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Obnoviť dáta
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-green-200 mb-2">
            <span className="flex items-center gap-2">
              <span className="text-lg">🏁</span>
              Priebeh turnaja
            </span>
            <span className="font-bold">{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-green-950/50 border border-green-800/50 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-400 h-3 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {tournament.description && (
          <p className="mt-4 text-slate-300">{tournament.description}</p>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:flex gap-2 mb-6">
        {(['all', 'group_a', 'group_b', 'semifinal', 'final', 'teams', 'predictions', 'stats', 'photos'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 md:px-6 py-2 rounded-lg font-medium text-sm md:text-base whitespace-nowrap transition shadow-md ${
              filter === tab
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-500/50'
                : 'bg-slate-800/50 text-slate-300 hover:bg-green-900/30 hover:text-green-200 border border-slate-700/50'
            }`}
          >
            {tab === 'all' && 'Všetky'}
            {tab === 'group_a' && 'Skupina A'}
            {tab === 'group_b' && 'Skupina B'}
            {tab === 'semifinal' && 'Semifinále'}
            {tab === 'final' && 'Finále'}
            {tab === 'teams' && 'Tímy'}
            {tab === 'predictions' && 'Tipovanie'}
            {tab === 'stats' && 'Výsledky tipovania'}
            {tab === 'photos' && 'Fotky'}
          </button>
        ))}
      </div>

      {/* Teams View */}
      {filter === 'teams' ? (
        <TeamsView
          participants={getUniqueParticipants()}
          onAdminClick={() => router.push('/admin')}
        />
      ) : filter === 'predictions' ? (
        <PredictionsView matches={matches} />
      ) : filter === 'stats' ? (
        <StatsView matches={matches} />
      ) : filter === 'photos' ? (
        <div className="text-center py-16 bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl">
          <div className="text-6xl mb-6">📸</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Fotky z turnaja</h2>
          <div className="max-w-md mx-auto px-4">
            <p className="text-slate-300 text-lg mb-2">
              Táto sekcia bude dostupná po skončení turnaja.
            </p>
            <p className="text-slate-400 text-sm">
              Prístup k fotkám bude možný len so správnym heslom.
            </p>
          </div>
        </div>
      ) : (
        /* Matches */
        <div className="space-y-8">
        {Object.keys(filteredGroups).length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-lg">
            <p className="text-slate-400 text-lg">Žiadne zápasy na zobrazenie</p>
          </div>
        ) : (
          Object.entries(filteredGroups).map(([groupKey, groupMatches]) => (
            <div key={groupKey}>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-1 h-8 bg-blue-500 rounded"></span>
                {getGroupName(Number(groupKey))}
                <span className="text-sm font-normal text-slate-400">
                  ({groupMatches.length} {declineZapas(groupMatches.length)})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupMatches
                  .sort((a, b) => {
                    // Zoraď zápasy podľa scheduled_time (od najskoršieho)
                    if (!a.scheduled_time && !b.scheduled_time) return 0;
                    if (!a.scheduled_time) return 1; // Zápasy bez času idú na koniec
                    if (!b.scheduled_time) return -1;
                    return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
                  })
                  .map((match) => (
                    <MatchCard key={match.id} match={match} readOnly={true} />
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
      )}
    </div>
  );
}
