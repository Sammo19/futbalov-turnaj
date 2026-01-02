'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Player {
  id: string;
  team_name: string;
  player_name: string;
  player_number: number | null;
  position: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    team_name: '',
    player_name: '',
    player_number: '',
    position: '',
  });

  const ADMIN_PASSWORD = 'turnaj2026admin';

  const teams = [
    'DZIVY MIX',
    'KAMZÍCI',
    'UNISA s.r.o.',
    'PUPKAČI',
    'OLD BOYS',
    'STARS',
    'VLAŠSKY ORECHAČI',
    'GLAKTICOS',
  ];

  useEffect(() => {
    if (isAuthenticated) {
      loadPlayers();
    }
  }, [isAuthenticated]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error loading players:', error);
      alert('Chyba pri načítaní hráčov');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Nesprávne heslo');
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.team_name || !formData.player_name) {
      alert('Vyplňte všetky povinné polia');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_password: ADMIN_PASSWORD,
          team_name: formData.team_name,
          player_name: formData.player_name,
          player_number: formData.player_number ? parseInt(formData.player_number) : null,
          position: formData.position || null,
        }),
      });

      if (response.ok) {
        await loadPlayers();
        setFormData({ team_name: '', player_name: '', player_number: '', position: '' });
        setShowAddForm(false);
        alert('Hráč úspešne pridaný');
      } else {
        alert('Chyba pri pridávaní hráča');
      }
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Chyba pri pridávaní hráča');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPlayer || !formData.team_name || !formData.player_name) {
      alert('Vyplňte všetky povinné polia');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_password: ADMIN_PASSWORD,
          id: editingPlayer.id,
          team_name: formData.team_name,
          player_name: formData.player_name,
          player_number: formData.player_number ? parseInt(formData.player_number) : null,
          position: formData.position || null,
        }),
      });

      if (response.ok) {
        await loadPlayers();
        setEditingPlayer(null);
        setFormData({ team_name: '', player_name: '', player_number: '', position: '' });
        alert('Hráč úspešne upravený');
      } else {
        alert('Chyba pri úprave hráča');
      }
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Chyba pri úprave hráča');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Naozaj chcete vymazať tohto hráča?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/players?id=${playerId}&admin_password=${ADMIN_PASSWORD}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPlayers();
        alert('Hráč úspešne vymazaný');
      } else {
        alert('Chyba pri mazaní hráča');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Chyba pri mazaní hráča');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      team_name: player.team_name,
      player_name: player.player_name,
      player_number: player.player_number?.toString() || '',
      position: player.position || '',
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setShowAddForm(false);
    setFormData({ team_name: '', player_name: '', player_number: '', position: '' });
  };

  // Group players by team
  const playersByTeam = players.reduce((acc, player) => {
    if (!acc[player.team_name]) {
      acc[player.team_name] = [];
    }
    acc[player.team_name].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Admin Panel</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Admin heslo
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Zadajte heslo"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Prihlásiť sa
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
            >
              Späť na turnaj
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Správa hráčov</h1>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingPlayer(null);
                  setFormData({ team_name: '', player_name: '', player_number: '', position: '' });
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                + Pridať hráča
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
              >
                Späť na turnaj
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingPlayer) && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingPlayer ? 'Upraviť hráča' : 'Pridať nového hráča'}
            </h2>
            <form onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tím *
                  </label>
                  <select
                    value={formData.team_name}
                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Vyberte tím</option>
                    {teams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Meno hráča *
                  </label>
                  <input
                    type="text"
                    value={formData.player_name}
                    onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Zadajte meno"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Číslo dresu
                  </label>
                  <input
                    type="number"
                    value={formData.player_number}
                    onChange={(e) => setFormData({ ...formData, player_number: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Napr. 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Pozícia
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Napr. Útočník"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition"
                >
                  {loading ? 'Ukladám...' : (editingPlayer ? 'Uložiť zmeny' : 'Pridať hráča')}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
                >
                  Zrušiť
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Players List */}
        {loading && !players.length ? (
          <div className="text-center text-white py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-4"></div>
            <p>Načítavam hráčov...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {teams.map((team) => {
              const teamPlayers = playersByTeam[team] || [];

              return (
                <div key={team} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-1 h-8 bg-blue-500 rounded"></span>
                    {team}
                    <span className="text-sm font-normal text-slate-400">
                      ({teamPlayers.length} {teamPlayers.length === 1 ? 'hráč' : 'hráčov'})
                    </span>
                  </h2>

                  {teamPlayers.length === 0 ? (
                    <p className="text-slate-500 italic">Žiadni hráči v tomto tíme</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamPlayers.map((player) => (
                        <div
                          key={player.id}
                          className="bg-slate-700/30 rounded-lg p-4 border border-slate-600 hover:border-blue-500 transition"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {player.player_number && (
                                <span className="text-2xl font-bold text-blue-400">
                                  #{player.player_number}
                                </span>
                              )}
                              <div>
                                <div className="text-white font-medium text-lg">
                                  {player.player_name}
                                </div>
                                {player.position && (
                                  <div className="text-sm text-slate-400">
                                    {player.position}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => startEdit(player)}
                              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
                            >
                              Upraviť
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(player.id)}
                              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition"
                            >
                              Vymazať
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
