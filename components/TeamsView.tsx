'use client';

import { useState, useEffect } from 'react';
import { ChallongeParticipant } from '@/types/challonge';

interface Player {
  id: string;
  team_name: string;
  player_name: string;
  player_number: number | null;
  position: string | null;
}

interface TeamsViewProps {
  participants: ChallongeParticipant[];
  onAdminClick: () => void;
}

export function TeamsView({ participants, onAdminClick }: TeamsViewProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group players by team
  const playersByTeam = players.reduce((acc, player) => {
    if (!acc[player.team_name]) {
      acc[player.team_name] = [];
    }
    acc[player.team_name].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  // Get team info from participants
  const getTeamInfo = (teamName: string) => {
    return participants.find(p => p.display_name === teamName);
  };

  // Group participants by group_id
  const GROUP_A_ID = 7639200;
  const GROUP_B_ID = 7639201;

  const groupATeams = participants.filter(p => p.group_id === GROUP_A_ID);
  const groupBTeams = participants.filter(p => p.group_id === GROUP_B_ID);

  const renderTeamCard = (team: ChallongeParticipant) => {
    const teamPlayers = playersByTeam[team.display_name] || [];

    return (
      <div key={team.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">{team.display_name}</h3>
          <span className="text-sm text-slate-400">#{team.seed}</span>
        </div>

        {teamPlayers.length === 0 ? (
          <p className="text-slate-500 italic text-sm">Žiadni hráči</p>
        ) : (
          <div className="space-y-2">
            {teamPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3"
              >
                {player.player_number && (
                  <span className="text-xl font-bold text-blue-400 w-8">
                    #{player.player_number}
                  </span>
                )}
                <div className="flex-1">
                  <div className="text-white font-medium">{player.player_name}</div>
                  {player.position && (
                    <div className="text-sm text-slate-400">{player.position}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
          {teamPlayers.length} {teamPlayers.length === 1 ? 'hráč' : 'hráčov'}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Načítavam tímy...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with Admin button */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">Tímy a hráči</h2>
        <button
          onClick={onAdminClick}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm"
        >
          ⚙️ Admin
        </button>
      </div>

      {/* Group A */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-blue-500 rounded"></span>
          Skupina A
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupATeams.map(renderTeamCard)}
        </div>
      </div>

      {/* Group B */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-green-500 rounded"></span>
          Skupina B
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupBTeams.map(renderTeamCard)}
        </div>
      </div>
    </div>
  );
}
