'use client';

import { useState, useEffect } from 'react';
import { ChallongeMatch, ChallongeParticipant } from '@/types/challonge';
import { declineHlas } from '@/lib/slovak';

interface StatsViewProps {
  matches: (ChallongeMatch & {
    player1?: ChallongeParticipant | null;
    player2?: ChallongeParticipant | null;
  })[];
}

interface MatchStat {
  match_id: number;
  predicted_winner_id: number;
  vote_count: number;
}

interface TournamentStat {
  prediction_type: string;
  team_id: number;
  vote_count: number;
}

export function StatsView({ matches }: StatsViewProps) {
  const [matchStats, setMatchStats] = useState<MatchStat[]>([]);
  const [tournamentStats, setTournamentStats] = useState<TournamentStat[]>([]);
  const [loading, setLoading] = useState(true);

  const GROUP_A_ID = 7639200;
  const GROUP_B_ID = 7639201;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [matchStatsRes, tournamentStatsRes] = await Promise.all([
        fetch('/api/predictions/stats'),
        fetch('/api/tournament-predictions/stats'),
      ]);

      if (matchStatsRes.ok) {
        const matchData = await matchStatsRes.json();
        setMatchStats(matchData);
      }

      if (tournamentStatsRes.ok) {
        const tournamentData = await tournamentStatsRes.json();
        setTournamentStats(tournamentData);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamVotes = (teamId: number, groupId: number | null): number => {
    // Sum votes from all group matches where this team is predicted
    return matchStats
      .filter(stat => {
        const match = matches.find(m => m.id === stat.match_id);
        return match && match.group_id === groupId && stat.predicted_winner_id === teamId;
      })
      .reduce((sum, stat) => sum + stat.vote_count, 0);
  };

  const getTournamentVotes = (predictionType: string, teamId: number): number => {
    const stat = tournamentStats.find(
      s => s.prediction_type === predictionType && s.team_id === teamId
    );
    return stat ? stat.vote_count : 0;
  };

  const getUniqueTeams = () => {
    const teamsMap = new Map<number, ChallongeParticipant>();
    matches.forEach(match => {
      if (match.player1) teamsMap.set(match.player1.id, match.player1);
      if (match.player2) teamsMap.set(match.player2.id, match.player2);
    });
    return Array.from(teamsMap.values());
  };

  const allTeams = getUniqueTeams();
  const groupATeams = allTeams.filter(t => t.group_id === GROUP_A_ID);
  const groupBTeams = allTeams.filter(t => t.group_id === GROUP_B_ID);

  // Get top 3 teams by group
  const getTopTeams = (teams: ChallongeParticipant[], groupId: number | null) => {
    return teams
      .map(team => ({
        team,
        votes: getTeamVotes(team.id, groupId),
      }))
      .filter(item => item.votes > 0)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
  };

  // Get top 3 teams for semifinals
  const getTopSemifinalists = () => {
    return allTeams
      .map(team => ({
        team,
        votes: getTournamentVotes('semifinalist', team.id),
      }))
      .filter(item => item.votes > 0)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
  };

  // Get top 3 teams for finals
  const getTopFinalists = () => {
    return allTeams
      .map(team => ({
        team,
        votes: getTournamentVotes('finalist', team.id),
      }))
      .filter(item => item.votes > 0)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
  };

  const topGroupA = getTopTeams(groupATeams, GROUP_A_ID);
  const topGroupB = getTopTeams(groupBTeams, GROUP_B_ID);
  const topSemifinalists = getTopSemifinalists();
  const topFinalists = getTopFinalists();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-4"></div>
        <p className="text-white">Načítavam štatistiky...</p>
      </div>
    );
  }

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '⚽';
    if (index === 1) return '🥅';
    if (index === 2) return '🏃';
    return '';
  };

  return (
    <div className="space-y-8">
      {/* Group A Stats */}
      <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm border border-green-700/50 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="text-3xl">⚽</span>
          Skupina A - Top 3 tímy
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Tímy s najviac hlasmi v skupinovej fáze
        </p>
        {topGroupA.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Zatiaľ žiadne hlasy</p>
        ) : (
          <div className="space-y-3">
            {topGroupA.map((item, index) => (
              <div
                key={item.team.id}
                className="bg-gradient-to-r from-green-800/40 to-green-700/20 border border-green-600/50 rounded-lg p-4 flex items-center justify-between hover:border-green-500/70 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getMedalEmoji(index)}</div>
                  <div>
                    <div className="text-white font-bold text-lg">{item.team.display_name}</div>
                    <div className="text-green-300 text-sm">
                      {item.votes} {declineHlas(item.votes)}
                    </div>
                  </div>
                </div>
                <div className="text-green-400 font-bold text-2xl">#{index + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group B Stats */}
      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-sm border border-blue-700/50 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="text-3xl">⚽</span>
          Skupina B - Top 3 tímy
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Tímy s najviac hlasmi v skupinovej fáze
        </p>
        {topGroupB.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Zatiaľ žiadne hlasy</p>
        ) : (
          <div className="space-y-3">
            {topGroupB.map((item, index) => (
              <div
                key={item.team.id}
                className="bg-gradient-to-r from-blue-800/40 to-blue-700/20 border border-blue-600/50 rounded-lg p-4 flex items-center justify-between hover:border-blue-500/70 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getMedalEmoji(index)}</div>
                  <div>
                    <div className="text-white font-bold text-lg">{item.team.display_name}</div>
                    <div className="text-blue-300 text-sm">
                      {item.votes} {declineHlas(item.votes)}
                    </div>
                  </div>
                </div>
                <div className="text-blue-400 font-bold text-2xl">#{index + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Semifinalists Stats */}
      <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 backdrop-blur-sm border border-emerald-700/50 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="text-3xl">🏟️</span>
          Semifinále - Top 3 tímy
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Tímy s najviac hlasmi na postup do semifinále
        </p>
        {topSemifinalists.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Zatiaľ žiadne hlasy</p>
        ) : (
          <div className="space-y-3">
            {topSemifinalists.map((item, index) => (
              <div
                key={item.team.id}
                className="bg-gradient-to-r from-emerald-800/40 to-emerald-700/20 border border-emerald-600/50 rounded-lg p-4 flex items-center justify-between hover:border-emerald-500/70 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getMedalEmoji(index)}</div>
                  <div>
                    <div className="text-white font-bold text-lg">{item.team.display_name}</div>
                    <div className="text-emerald-300 text-sm">
                      {item.votes} {declineHlas(item.votes)}
                    </div>
                  </div>
                </div>
                <div className="text-emerald-400 font-bold text-2xl">#{index + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finalists Stats */}
      <div className="bg-gradient-to-br from-amber-900/40 to-yellow-900/30 backdrop-blur-sm border border-amber-600/60 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          Finále - Top 3 tímy
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Tímy s najviac hlasmi na postup do finále
        </p>
        {topFinalists.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Zatiaľ žiadne hlasy</p>
        ) : (
          <div className="space-y-3">
            {topFinalists.map((item, index) => (
              <div
                key={item.team.id}
                className="bg-gradient-to-r from-amber-800/50 to-yellow-800/30 border border-amber-500/60 rounded-lg p-4 flex items-center justify-between hover:border-amber-400/80 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getMedalEmoji(index)}</div>
                  <div>
                    <div className="text-white font-bold text-lg">{item.team.display_name}</div>
                    <div className="text-amber-300 text-sm">
                      {item.votes} {declineHlas(item.votes)}
                    </div>
                  </div>
                </div>
                <div className="text-amber-400 font-bold text-2xl">#{index + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
