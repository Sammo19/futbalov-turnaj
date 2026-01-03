'use client';

import { useState, useEffect } from 'react';
import { ChallongeMatch, ChallongeParticipant } from '@/types/challonge';
import { BettingModal } from './BettingModal';
import { UsernameModal } from './UsernameModal';
import { getOrCreateSessionId } from '@/lib/session';
import { declineTip, declineVybrane } from '@/lib/slovak';

interface PredictionsViewProps {
  matches: (ChallongeMatch & {
    player1?: ChallongeParticipant | null;
    player2?: ChallongeParticipant | null;
  })[];
}

interface UserPrediction {
  match_id: number;
  predicted_winner_id: number;
}

interface TournamentPrediction {
  prediction_type: string;
  team_id: number;
}

interface TournamentPredictionStat {
  prediction_type: string;
  team_id: number;
  vote_count: number;
}

export function PredictionsView({ matches }: PredictionsViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<typeof matches[0] | null>(null);
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);
  const [tournamentPredictions, setTournamentPredictions] = useState<TournamentPrediction[]>([]);
  const [tournamentStats, setTournamentStats] = useState<TournamentPredictionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsernameState] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  const GROUP_A_ID = 7639200;
  const GROUP_B_ID = 7639201;

  // Get unique teams
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

  useEffect(() => {
    loadUsername();
  }, []);

  // Auto-refresh stats every 5 seconds for live updates
  useEffect(() => {
    // Only poll if username is set (user is actively using the app)
    if (!username) return;

    const interval = setInterval(() => {
      loadTournamentStats();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [username]);

  const loadUsername = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch(`/api/user?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.username) {
          setUsernameState(data.username);
          loadPredictions();
          loadTournamentPredictions();
          loadTournamentStats();
        } else {
          setShowUsernameModal(true);
          setLoading(false);
        }
      } else {
        setShowUsernameModal(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading username:', error);
      setShowUsernameModal(true);
      setLoading(false);
    }
  };

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch(`/api/predictions?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setUserPredictions(data);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentPredictions = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch(`/api/tournament-predictions?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setTournamentPredictions(data);
      }
    } catch (error) {
      console.error('Error loading tournament predictions:', error);
    }
  };

  const loadTournamentStats = async () => {
    try {
      const response = await fetch('/api/tournament-predictions/stats');
      if (response.ok) {
        const data = await response.json();
        setTournamentStats(data);
      }
    } catch (error) {
      console.error('Error loading tournament stats:', error);
    }
  };

  const handleUsernameSubmit = async (newUsername: string) => {
    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          username: newUsername,
        }),
      });

      if (response.ok) {
        setUsernameState(newUsername);
        setShowUsernameModal(false);
        loadPredictions();
        loadTournamentPredictions();
        loadTournamentStats();
      } else {
        const data = await response.json();
        if (response.status === 409) {
          // Username is already taken
          throw new Error(data.message || 'Táto prezývka je už obsadená');
        } else {
          throw new Error('Chyba pri ukladaní prezývky');
        }
      }
    } catch (error) {
      console.error('Error saving username:', error);
      throw error; // Re-throw so UsernameModal can handle it
    }
  };

  const handleMatchClick = (match: typeof matches[0]) => {
    setSelectedMatch(match);
  };

  const handleBetPlaced = () => {
    loadPredictions();
  };

  const handleTournamentPrediction = async (predictionType: 'semifinalist' | 'finalist', teamId: number) => {
    const sessionId = getOrCreateSessionId();
    const existing = tournamentPredictions.find(
      p => p.prediction_type === predictionType && p.team_id === teamId
    );

    if (existing) {
      // Remove prediction
      const response = await fetch(
        `/api/tournament-predictions?session_id=${sessionId}&prediction_type=${predictionType}&team_id=${teamId}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        await loadTournamentPredictions();
        await loadTournamentStats();
      }
    } else {
      // Check limits before adding
      const selectedTeam = allTeams.find(t => t.id === teamId);

      if (predictionType === 'semifinalist' && selectedTeam) {
        // Limit: max 2 per group
        const samGroupPredictions = tournamentPredictions.filter(p => {
          if (p.prediction_type !== 'semifinalist') return false;
          const predTeam = allTeams.find(t => t.id === p.team_id);
          return predTeam?.group_id === selectedTeam.group_id;
        });

        if (samGroupPredictions.length >= 2) {
          // Remove oldest (first in array)
          const oldest = samGroupPredictions[0];
          await fetch(
            `/api/tournament-predictions?session_id=${sessionId}&prediction_type=${predictionType}&team_id=${oldest.team_id}`,
            { method: 'DELETE' }
          );
        }
      } else if (predictionType === 'finalist') {
        // Limit: max 2 total
        const finalistPredictions = tournamentPredictions.filter(
          p => p.prediction_type === 'finalist'
        );

        if (finalistPredictions.length >= 2) {
          // Remove oldest (first in array)
          const oldest = finalistPredictions[0];
          await fetch(
            `/api/tournament-predictions?session_id=${sessionId}&prediction_type=${predictionType}&team_id=${oldest.team_id}`,
            { method: 'DELETE' }
          );
        }
      }

      // Add new prediction
      const response = await fetch('/api/tournament-predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          prediction_type: predictionType,
          team_id: teamId,
          username: username,
        }),
      });
      if (response.ok) {
        await loadTournamentPredictions();
        await loadTournamentStats();
      }
    }
  };

  const isTeamSelected = (predictionType: string, teamId: number) => {
    return tournamentPredictions.some(
      p => p.prediction_type === predictionType && p.team_id === teamId
    );
  };

  const getTeamVotes = (predictionType: string, teamId: number) => {
    const stat = tournamentStats.find(
      s => s.prediction_type === predictionType && s.team_id === teamId
    );
    return stat ? stat.vote_count : 0;
  };

  const getGroupSemifinalistCount = (groupId: number) => {
    return tournamentPredictions.filter(p => {
      if (p.prediction_type !== 'semifinalist') return false;
      const predTeam = allTeams.find(t => t.id === p.team_id);
      return predTeam?.group_id === groupId;
    }).length;
  };

  const getFinalistCount = () => {
    return tournamentPredictions.filter(p => p.prediction_type === 'finalist').length;
  };

  // Group matches by group and sort by scheduled_time
  const groupMatches = matches
    .filter(m => m.group_id && (m.group_id === GROUP_A_ID || m.group_id === GROUP_B_ID))
    .sort((a, b) => {
      if (!a.scheduled_time && !b.scheduled_time) return 0;
      if (!a.scheduled_time) return 1;
      if (!b.scheduled_time) return -1;
      return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
    });

  const playoffMatches = matches
    .filter(m => !m.group_id || (m.group_id !== GROUP_A_ID && m.group_id !== GROUP_B_ID))
    .sort((a, b) => {
      if (!a.scheduled_time && !b.scheduled_time) return 0;
      if (!a.scheduled_time) return 1;
      if (!b.scheduled_time) return -1;
      return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
    });

  // Separate semifinals and final matches
  const semifinalMatches = playoffMatches.filter(m =>
    m.round === 1 || m.identifier?.toLowerCase().includes('semi')
  );
  const finalMatch = playoffMatches.find(m =>
    m.round === 2 || m.identifier?.toLowerCase().includes('final')
  );
  const thirdPlaceMatch = playoffMatches.find(m =>
    m.identifier?.toLowerCase().includes('3rd') ||
    m.identifier?.toLowerCase().includes('third')
  );

  if (showUsernameModal) {
    return <UsernameModal onSubmit={handleUsernameSubmit} />;
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-4"></div>
        <p className="text-white">Načítavam...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User info */}
      {username && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">👤</div>
            <div>
              <p className="text-sm text-slate-400">Tipuješ ako</p>
              <p className="text-white font-bold">{username}</p>
            </div>
          </div>
          <button
            onClick={() => setShowUsernameModal(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
          >
            Zmeniť prezývku
          </button>
        </div>
      )}
      {/* Group Stage Matches */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="w-1 h-8 bg-blue-500 rounded"></span>
          Tipuj zápasy - Skupinová fáza
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Klikni na zápas a vyber víťaza
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupMatches.map((match) => {
            const prediction = userPredictions.find(p => p.match_id === match.id);
            const player1Name = match.player1?.display_name || 'TBD';
            const player2Name = match.player2?.display_name || 'TBD';
            return (
              <button
                key={match.id}
                onClick={() => handleMatchClick(match)}
                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-blue-500 rounded-lg p-3 md:p-4 transition cursor-pointer"
              >
                {match.state === 'complete' && (
                  <div className="flex justify-center mb-2">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Dokončený
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-4 md:gap-6">
                  <div className={`flex-1 text-center flex flex-col justify-center ${
                    prediction?.predicted_winner_id === match.player1?.id ? 'text-blue-400 font-bold' : 'text-white'
                  }`}>
                    <div className="text-sm md:text-lg break-words leading-tight">
                      {player1Name === 'GLAKTICOS' ? (
                        <>
                          <span className="block md:inline">GLAK</span>
                          <span className="block md:inline">TICOS</span>
                        </>
                      ) : (
                        player1Name
                      )}
                    </div>
                    {prediction?.predicted_winner_id === match.player1?.id && (
                      <div className="text-xs mt-1">✓ Váš tip</div>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center px-2 md:px-4">
                    {match.scheduled_time && (
                      <div className="text-slate-400 text-xs mb-1">
                        {new Date(match.scheduled_time).toLocaleTimeString('sk-SK', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </div>
                    )}
                    <div className="text-slate-500 font-bold text-xl">VS</div>
                  </div>
                  <div className={`flex-1 text-center flex flex-col justify-center ${
                    prediction?.predicted_winner_id === match.player2?.id ? 'text-blue-400 font-bold' : 'text-white'
                  }`}>
                    <div className="text-sm md:text-lg break-words leading-tight">
                      {player2Name === 'GLAKTICOS' ? (
                        <>
                          <span className="block md:inline">GLAK</span>
                          <span className="block md:inline">TICOS</span>
                        </>
                      ) : (
                        player2Name
                      )}
                    </div>
                    {prediction?.predicted_winner_id === match.player2?.id && (
                      <div className="text-xs mt-1">✓ Váš tip</div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Playoff Matches */}
      {playoffMatches.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-1 h-8 bg-purple-500 rounded"></span>
            Tipuj zápasy - Playoff
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playoffMatches.map((match) => {
              const prediction = userPredictions.find(p => p.match_id === match.id);
              const player1Name = match.player1?.display_name || 'TBD';
              const player2Name = match.player2?.display_name || 'TBD';
              return (
                <button
                  key={match.id}
                  onClick={() => handleMatchClick(match)}
                  className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-purple-500 rounded-lg p-3 md:p-4 transition cursor-pointer"
                >
                  {match.state === 'complete' && (
                    <div className="flex justify-center mb-2">
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Dokončený
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-4 md:gap-6">
                    <div className={`flex-1 text-center flex flex-col justify-center ${
                      prediction?.predicted_winner_id === match.player1?.id ? 'text-purple-400 font-bold' : 'text-white'
                    }`}>
                      <div className="text-sm md:text-lg break-words leading-tight">
                        {player1Name === 'GLAKTICOS' ? (
                          <>
                            <span className="block md:inline">GLAK</span>
                            <span className="block md:inline">TICOS</span>
                          </>
                        ) : (
                          player1Name
                        )}
                      </div>
                      {prediction?.predicted_winner_id === match.player1?.id && (
                        <div className="text-xs mt-1">✓ Váš tip</div>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center px-2 md:px-4">
                      {match.scheduled_time && (
                        <div className="text-slate-400 text-xs mb-1">
                          {new Date(match.scheduled_time).toLocaleTimeString('sk-SK', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </div>
                      )}
                      <div className="text-slate-500 font-bold text-xl">VS</div>
                    </div>
                    <div className={`flex-1 text-center flex flex-col justify-center ${
                      prediction?.predicted_winner_id === match.player2?.id ? 'text-purple-400 font-bold' : 'text-white'
                    }`}>
                      <div className="text-sm md:text-lg break-words leading-tight">
                        {player2Name === 'GLAKTICOS' ? (
                          <>
                            <span className="block md:inline">GLAK</span>
                            <span className="block md:inline">TICOS</span>
                          </>
                        ) : (
                          player2Name
                        )}
                      </div>
                      {prediction?.predicted_winner_id === match.player2?.id && (
                        <div className="text-xs mt-1">✓ Váš tip</div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Semifinals Winner Prediction */}
      {semifinalMatches.length > 0 && semifinalMatches.some(m => m.player1 && m.player2) && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-1 h-8 bg-purple-500 rounded"></span>
            Kto vyhrá semifinále?
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Vyber víťazov semifinálových zápasov
          </p>
          <div className="space-y-4">
            {semifinalMatches.map((match, index) => {
              if (!match.player1 || !match.player2) return null;
              const prediction = userPredictions.find(p => p.match_id === match.id);
              return (
                <div key={match.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                  <h3 className="text-white font-bold mb-3 text-center">
                    Semifinále {index + 1}
                    {match.scheduled_time && (
                      <span className="text-slate-400 text-sm ml-2">
                        ({new Date(match.scheduled_time).toLocaleTimeString('sk-SK', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })})
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMatchClick(match)}
                      className={`p-4 rounded-lg border-2 transition ${
                        prediction?.predicted_winner_id === match.player1.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-slate-600 bg-slate-700/50 hover:border-purple-400'
                      }`}
                    >
                      <div className="text-white font-medium text-sm mb-1">
                        {match.player1.display_name}
                      </div>
                      {prediction?.predicted_winner_id === match.player1.id && (
                        <div className="text-purple-400 text-xs">✓ Váš tip</div>
                      )}
                    </button>
                    <button
                      onClick={() => handleMatchClick(match)}
                      className={`p-4 rounded-lg border-2 transition ${
                        prediction?.predicted_winner_id === match.player2.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-slate-600 bg-slate-700/50 hover:border-purple-400'
                      }`}
                    >
                      <div className="text-white font-medium text-sm mb-1">
                        {match.player2.display_name}
                      </div>
                      {prediction?.predicted_winner_id === match.player2.id && (
                        <div className="text-purple-400 text-xs">✓ Váš tip</div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Third Place Match Winner Prediction */}
      {thirdPlaceMatch && thirdPlaceMatch.player1 && thirdPlaceMatch.player2 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-1 h-8 bg-amber-500 rounded"></span>
            Kto vyhrá zápas o 3. miesto?
          </h2>
          {thirdPlaceMatch.scheduled_time && (
            <p className="text-slate-400 text-sm mb-4">
              {new Date(thirdPlaceMatch.scheduled_time).toLocaleString('sk-SK')}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {(() => {
              const prediction = userPredictions.find(p => p.match_id === thirdPlaceMatch.id);
              return (
                <>
                  <button
                    onClick={() => handleMatchClick(thirdPlaceMatch)}
                    className={`p-6 rounded-lg border-2 transition ${
                      prediction?.predicted_winner_id === thirdPlaceMatch.player1!.id
                        ? 'border-amber-500 bg-amber-500/20'
                        : 'border-slate-600 bg-slate-700/50 hover:border-amber-400'
                    }`}
                  >
                    <div className="text-white font-bold text-lg mb-1">
                      {thirdPlaceMatch.player1!.display_name}
                    </div>
                    {prediction?.predicted_winner_id === thirdPlaceMatch.player1!.id && (
                      <div className="text-amber-400 text-sm">✓ Váš tip</div>
                    )}
                  </button>
                  <button
                    onClick={() => handleMatchClick(thirdPlaceMatch)}
                    className={`p-6 rounded-lg border-2 transition ${
                      prediction?.predicted_winner_id === thirdPlaceMatch.player2!.id
                        ? 'border-amber-500 bg-amber-500/20'
                        : 'border-slate-600 bg-slate-700/50 hover:border-amber-400'
                    }`}
                  >
                    <div className="text-white font-bold text-lg mb-1">
                      {thirdPlaceMatch.player2!.display_name}
                    </div>
                    {prediction?.predicted_winner_id === thirdPlaceMatch.player2!.id && (
                      <div className="text-amber-400 text-sm">✓ Váš tip</div>
                    )}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Final Winner Prediction */}
      {finalMatch && finalMatch.player1 && finalMatch.player2 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-1 h-8 bg-yellow-500 rounded"></span>
            Kto vyhrá finále?
          </h2>
          {finalMatch.scheduled_time && (
            <p className="text-slate-400 text-sm mb-4">
              {new Date(finalMatch.scheduled_time).toLocaleString('sk-SK')}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {(() => {
              const prediction = userPredictions.find(p => p.match_id === finalMatch.id);
              return (
                <>
                  <button
                    onClick={() => handleMatchClick(finalMatch)}
                    className={`p-6 rounded-lg border-2 transition ${
                      prediction?.predicted_winner_id === finalMatch.player1!.id
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : 'border-slate-600 bg-slate-700/50 hover:border-yellow-400'
                    }`}
                  >
                    <div className="text-white font-bold text-lg mb-1">
                      {finalMatch.player1!.display_name}
                    </div>
                    {prediction?.predicted_winner_id === finalMatch.player1!.id && (
                      <div className="text-yellow-400 text-sm">✓ Váš tip</div>
                    )}
                  </button>
                  <button
                    onClick={() => handleMatchClick(finalMatch)}
                    className={`p-6 rounded-lg border-2 transition ${
                      prediction?.predicted_winner_id === finalMatch.player2!.id
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : 'border-slate-600 bg-slate-700/50 hover:border-yellow-400'
                    }`}
                  >
                    <div className="text-white font-bold text-lg mb-1">
                      {finalMatch.player2!.display_name}
                    </div>
                    {prediction?.predicted_winner_id === finalMatch.player2!.id && (
                      <div className="text-yellow-400 text-sm">✓ Váš tip</div>
                    )}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Semifinalists Selection */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="w-1 h-8 bg-orange-500 rounded"></span>
          Kto postupí do semifinále?
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Vyber tímy, ktoré podľa teba postúpia do semifinále (2 z každej skupiny)
        </p>

        {/* Group A */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Skupina A</h3>
            <span className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full whitespace-nowrap ${
              getGroupSemifinalistCount(GROUP_A_ID) >= 2
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {getGroupSemifinalistCount(GROUP_A_ID)}/2 {declineVybrane(getGroupSemifinalistCount(GROUP_A_ID))}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {groupATeams.map((team) => {
              const selected = isTeamSelected('semifinalist', team.id);
              const votes = getTeamVotes('semifinalist', team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => handleTournamentPrediction('semifinalist', team.id)}
                  className={`p-3 md:p-4 rounded-lg border-2 transition ${
                    selected
                      ? 'border-orange-500 bg-orange-500/20'
                      : 'border-slate-600 bg-slate-700/50 hover:border-orange-400'
                  }`}
                >
                  <div className="text-white font-medium text-xs md:text-sm mb-1 break-words leading-tight">
                    {team.display_name}
                  </div>
                  {selected && <div className="text-orange-400 text-xs">✓ Váš tip</div>}
                  {votes > 0 && (
                    <div className="text-slate-400 text-xs mt-1">{votes} {declineTip(votes)}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Group B */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Skupina B</h3>
            <span className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full whitespace-nowrap ${
              getGroupSemifinalistCount(GROUP_B_ID) >= 2
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {getGroupSemifinalistCount(GROUP_B_ID)}/2 {declineVybrane(getGroupSemifinalistCount(GROUP_B_ID))}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {groupBTeams.map((team) => {
              const selected = isTeamSelected('semifinalist', team.id);
              const votes = getTeamVotes('semifinalist', team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => handleTournamentPrediction('semifinalist', team.id)}
                  className={`p-3 md:p-4 rounded-lg border-2 transition ${
                    selected
                      ? 'border-orange-500 bg-orange-500/20'
                      : 'border-slate-600 bg-slate-700/50 hover:border-orange-400'
                  }`}
                >
                  <div className="text-white font-medium text-xs md:text-sm mb-1 break-words leading-tight">
                    {team.display_name}
                  </div>
                  {selected && <div className="text-orange-400 text-xs">✓ Váš tip</div>}
                  {votes > 0 && (
                    <div className="text-slate-400 text-xs mt-1">{votes} {declineTip(votes)}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Finalists Selection */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
            <span className="w-1 h-6 md:h-8 bg-yellow-500 rounded"></span>
            <span className="leading-tight">Kto bude vo finále?</span>
          </h2>
          <span className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
            getFinalistCount() >= 2
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
              : 'bg-slate-700 text-slate-300'
          }`}>
            {getFinalistCount()}/2 {declineVybrane(getFinalistCount())}
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Vyber 2 tímy, ktoré sa stretnú vo finále
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allTeams.map((team) => {
            const selected = isTeamSelected('finalist', team.id);
            const votes = getTeamVotes('finalist', team.id);
            return (
              <button
                key={team.id}
                onClick={() => handleTournamentPrediction('finalist', team.id)}
                className={`p-3 md:p-4 rounded-lg border-2 transition ${
                  selected
                    ? 'border-yellow-500 bg-yellow-500/20'
                    : 'border-slate-600 bg-slate-700/50 hover:border-yellow-400'
                }`}
              >
                <div className="text-white font-medium text-xs md:text-sm mb-1 break-words leading-tight">
                  {team.display_name}
                </div>
                {selected && <div className="text-yellow-400 text-xs">✓ Váš tip</div>}
                {votes > 0 && (
                  <div className="text-slate-400 text-xs mt-1">{votes} tipov</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Betting Modal */}
      {selectedMatch && username && (
        <BettingModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onBetPlaced={handleBetPlaced}
          currentPrediction={
            userPredictions.find(p => p.match_id === selectedMatch.id)?.predicted_winner_id
          }
          username={username}
        />
      )}
    </div>
  );
}
