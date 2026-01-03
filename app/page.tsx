'use client';

import { useEffect, useState } from 'react';
import { TournamentView } from '@/components/TournamentView';
import { Sponsors } from '@/components/Sponsors';
import { ChallongeTournament, ChallongeMatch, ChallongeParticipant } from '@/types/challonge';

export default function Home() {
  const [tournament, setTournament] = useState<ChallongeTournament | null>(null);
  const [matches, setMatches] = useState<(ChallongeMatch & { player1?: ChallongeParticipant | null; player2?: ChallongeParticipant | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [tournamentRes, matchesRes] = await Promise.all([
        fetch('/api/tournament'),
        fetch('/api/matches'),
      ]);

      if (!tournamentRes.ok || !matchesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const tournamentData = await tournamentRes.json();
      const matchesData = await matchesRes.json();

      setTournament(tournamentData);
      setMatches(matchesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Nepodarilo sa načítať údaje z turnaja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-slate-900 to-emerald-950">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
          <p className="mt-4 text-green-100 text-lg">Načítavam turnaj...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-slate-900 to-emerald-950">
        <div className="text-center bg-red-500/10 border border-red-500 rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Chyba</h2>
          <p className="text-white">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition"
          >
            Skúsiť znova
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-950 via-slate-900 to-emerald-950">
      <TournamentView
        tournament={tournament!}
        matches={matches}
        onRefresh={fetchData}
        isRefreshing={loading}
      />
      <Sponsors />
    </main>
  );
}
