import { NextResponse } from 'next/server';
import { challongeClient } from '@/lib/challonge/client';

export async function GET() {
  try {
    const tournamentId = process.env.NEXT_PUBLIC_TOURNAMENT_ID;

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

    return NextResponse.json(enrichedMatches);
  } catch (error) {
    console.error('Error in matches API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches data' },
      { status: 500 }
    );
  }
}
