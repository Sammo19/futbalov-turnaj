import { NextResponse } from 'next/server';
import { challongeClient } from '@/lib/challonge/client';

export async function GET() {
  try {
    // Try server-side env var first, then fall back to client-side
    const tournamentId = process.env.TOURNAMENT_ID || process.env.NEXT_PUBLIC_TOURNAMENT_ID;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID not configured' },
        { status: 500 }
      );
    }

    const [matches, participants] = await Promise.all([
      challongeClient.getMatches(tournamentId),
      challongeClient.getParticipants(tournamentId),
    ]);

    // Create a map of group_player_ids to participant objects
    // For team tournaments, player IDs in matches refer to group_player_ids
    const groupPlayerMap = new Map();
    participants.forEach((p) => {
      if (p.group_player_ids && p.group_player_ids.length > 0) {
        p.group_player_ids.forEach((groupPlayerId: number) => {
          groupPlayerMap.set(groupPlayerId, p);
        });
      } else {
        // Fallback for non-team tournaments
        groupPlayerMap.set(p.id, p);
      }
    });

    // Enrich matches with participant information
    const enrichedMatches = matches.map((match) => ({
      ...match,
      player1: match.player1_id ? groupPlayerMap.get(match.player1_id) : null,
      player2: match.player2_id ? groupPlayerMap.get(match.player2_id) : null,
    }));

    // Override playoff matches with hardcoded teams
    const playoffMatches = enrichedMatches.map((match) => {
      // Only override playoff matches (group_id === null)
      if (match.group_id === null) {
        // Find teams by name
        const vlasskyOrechaci = participants.find(p => p.display_name === 'VLAŠSKY ORECHAČI');
        const dzivyMix = participants.find(p => p.display_name === 'DZIVY MIX');
        const glakticos = participants.find(p => p.display_name === 'GLAKTICOS');
        const kamzici = participants.find(p => p.display_name === 'KAMZÍCI');

        // Semifinal 1 (round 1, identifier A): Keep as is
        // Semifinal 2 / 3rd place (round 1, identifier B): Vlašské orechy vs Dzivy mix
        if (match.round === 1 && match.identifier === 'B') {
          return {
            ...match,
            player1: vlasskyOrechaci || match.player1,
            player2: dzivyMix || match.player2,
          };
        }

        // Final (round 2, identifier C): GLAKTICOS vs KAMZÍCI
        if (match.round === 2 && match.identifier === 'C') {
          return {
            ...match,
            player1: glakticos || match.player1,
            player2: kamzici || match.player2,
          };
        }
      }

      return match;
    });

    return NextResponse.json(playoffMatches);
  } catch (error) {
    console.error('Error in matches API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches data' },
      { status: 500 }
    );
  }
}
