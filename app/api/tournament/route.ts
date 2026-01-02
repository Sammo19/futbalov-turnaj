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

    const tournament = await challongeClient.getTournament(tournamentId);

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error in tournament API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament data' },
      { status: 500 }
    );
  }
}
