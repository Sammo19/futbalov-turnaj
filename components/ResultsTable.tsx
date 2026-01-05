'use client';

import { ChallongeMatch, ChallongeParticipant } from '@/types/challonge';

interface ResultsTableProps {
  matches: (ChallongeMatch & {
    player1?: ChallongeParticipant | null;
    player2?: ChallongeParticipant | null;
  })[];
}

interface TeamStats {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  finalPosition?: number; // 1-4 for playoff positions
}

export function ResultsTable({ matches }: ResultsTableProps) {
  // Calculate team statistics
  const calculateStats = (): TeamStats[] => {
    const stats = new Map<string, TeamStats>();

    // Initialize stats for all teams
    matches.forEach((match) => {
      if (match.player1) {
        const teamName = match.player1.display_name;
        if (!stats.has(teamName)) {
          stats.set(teamName, {
            team: teamName,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          });
        }
      }
      if (match.player2) {
        const teamName = match.player2.display_name;
        if (!stats.has(teamName)) {
          stats.set(teamName, {
            team: teamName,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          });
        }
      }
    });

    // Process matches
    matches.forEach((match) => {
      // Only process completed matches
      if (match.state !== 'complete' || !match.scores_csv) return;

      const scores = match.scores_csv.split('-').map(s => parseInt(s.trim()));
      if (scores.length !== 2 || scores.some(isNaN)) return;

      const [score1, score2] = scores;
      const team1 = match.player1?.display_name;
      const team2 = match.player2?.display_name;

      if (!team1 || !team2) return;

      const stat1 = stats.get(team1)!;
      const stat2 = stats.get(team2)!;

      // Update stats
      stat1.played++;
      stat2.played++;
      stat1.goalsFor += score1;
      stat1.goalsAgainst += score2;
      stat2.goalsFor += score2;
      stat2.goalsAgainst += score1;

      if (score1 > score2) {
        // Team 1 wins
        stat1.won++;
        stat1.points += 3;
        stat2.lost++;
      } else if (score2 > score1) {
        // Team 2 wins
        stat2.won++;
        stat2.points += 3;
        stat1.lost++;
      } else {
        // Draw
        stat1.drawn++;
        stat2.drawn++;
        stat1.points += 1;
        stat2.points += 1;
      }

      stat1.goalDifference = stat1.goalsFor - stat1.goalsAgainst;
      stat2.goalDifference = stat2.goalsFor - stat2.goalsAgainst;
    });

    // Assign final positions based on playoff results
    stats.get('GLAKTICOS')!.finalPosition = 1; // Winner
    stats.get('KAMZÍCI')!.finalPosition = 2; // Runner-up
    stats.get('VLAŠSKY ORECHAČI')!.finalPosition = 3; // 3rd place
    stats.get('DZIVY MIX')!.finalPosition = 4; // 4th place

    return Array.from(stats.values());
  };

  const teamStats = calculateStats();

  // Sort by final position (1-4 first), then by points, goal difference, goals scored
  const sortedStats = teamStats.sort((a, b) => {
    // Playoff teams come first, sorted by position
    if (a.finalPosition && b.finalPosition) {
      return a.finalPosition - b.finalPosition;
    }
    if (a.finalPosition) return -1;
    if (b.finalPosition) return 1;

    // For others, sort by points, goal difference, goals scored
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  const getPositionEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-3xl">🏆</span>
        Konečné výsledky turnaja
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-600">
              <th className="text-left py-3 px-2 md:px-4 text-slate-300 font-bold text-sm md:text-base">#</th>
              <th className="text-left py-3 px-2 md:px-4 text-slate-300 font-bold text-sm md:text-base">Tím</th>
              <th className="text-center py-3 px-2 md:px-4 text-slate-300 font-bold text-xs md:text-sm">Z</th>
              <th className="text-center py-3 px-2 md:px-4 text-slate-300 font-bold text-xs md:text-sm">V</th>
              <th className="text-center py-3 px-2 md:px-4 text-slate-300 font-bold text-xs md:text-sm">R</th>
              <th className="text-center py-3 px-2 md:px-4 text-slate-300 font-bold text-xs md:text-sm">P</th>
              <th className="text-center py-3 px-2 md:px-4 text-slate-300 font-bold text-xs md:text-sm">G+</th>
              <th className="text-center py-3 px-2 md:px-4 text-slate-300 font-bold text-xs md:text-sm">G-</th>
              <th className="text-center py-3 px-2 md:px-4 text-slate-300 font-bold text-xs md:text-sm">GD</th>
              <th className="text-center py-3 px-2 md:px-4 text-slate-300 font-bold text-sm md:text-base">Body</th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((stat, index) => (
              <tr
                key={stat.team}
                className={`border-b border-slate-700 hover:bg-slate-700/30 transition ${
                  index < 4 ? 'bg-green-900/20' : ''
                }`}
              >
                <td className="py-3 px-2 md:px-4 text-white font-bold text-sm md:text-lg">
                  {getPositionEmoji(index)}
                </td>
                <td className="py-3 px-2 md:px-4 text-white font-semibold text-xs md:text-base break-words">
                  {stat.team}
                </td>
                <td className="text-center py-3 px-2 md:px-4 text-slate-300 text-xs md:text-sm">{stat.played}</td>
                <td className="text-center py-3 px-2 md:px-4 text-green-400 text-xs md:text-sm">{stat.won}</td>
                <td className="text-center py-3 px-2 md:px-4 text-yellow-400 text-xs md:text-sm">{stat.drawn}</td>
                <td className="text-center py-3 px-2 md:px-4 text-red-400 text-xs md:text-sm">{stat.lost}</td>
                <td className="text-center py-3 px-2 md:px-4 text-slate-300 text-xs md:text-sm">{stat.goalsFor}</td>
                <td className="text-center py-3 px-2 md:px-4 text-slate-300 text-xs md:text-sm">{stat.goalsAgainst}</td>
                <td className={`text-center py-3 px-2 md:px-4 font-semibold text-xs md:text-sm ${
                  stat.goalDifference > 0 ? 'text-green-400' :
                  stat.goalDifference < 0 ? 'text-red-400' : 'text-slate-300'
                }`}>
                  {stat.goalDifference > 0 ? '+' : ''}{stat.goalDifference}
                </td>
                <td className="text-center py-3 px-2 md:px-4 text-white font-bold text-sm md:text-lg">
                  {stat.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-xs md:text-sm text-slate-400 space-y-1">
        <p><strong>Z</strong> - Zápasy | <strong>V</strong> - Výhry | <strong>R</strong> - Remízy | <strong>P</strong> - Prehry</p>
        <p><strong>G+</strong> - Góly strelené | <strong>G-</strong> - Góly inkasované | <strong>GD</strong> - Gólový rozdiel</p>
        <p className="text-green-400">Top 4 tímy postúpili do playoff</p>
      </div>
    </div>
  );
}
