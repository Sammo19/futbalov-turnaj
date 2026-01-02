import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - Fetch username for a session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check user_sessions table first (primary source of truth)
    const { data: sessionData } = await supabase
      .from('user_sessions')
      .select('username')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (sessionData?.username) {
      return NextResponse.json({ username: sessionData.username });
    }

    // Fallback: try to get username from predictions table (for backward compatibility)
    const { data: predictionData } = await supabase
      .from('predictions')
      .select('username')
      .eq('session_id', sessionId)
      .not('username', 'is', null)
      .limit(1)
      .maybeSingle();

    if (predictionData?.username) {
      return NextResponse.json({ username: predictionData.username });
    }

    // Fallback: try tournament_predictions
    const { data: tournamentData } = await supabase
      .from('tournament_predictions')
      .select('username')
      .eq('session_id', sessionId)
      .not('username', 'is', null)
      .limit(1)
      .maybeSingle();

    if (tournamentData?.username) {
      return NextResponse.json({ username: tournamentData.username });
    }

    // No username found
    return NextResponse.json({ username: null });
  } catch (error) {
    console.error('Error in user GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Set username for a session (updates all existing predictions)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, username } = body;

    if (!session_id || !username) {
      return NextResponse.json(
        { error: 'Session ID and username are required' },
        { status: 400 }
      );
    }

    // Check if username is already taken in user_sessions (primary check)
    const { data: existingInSessions } = await supabase
      .from('user_sessions')
      .select('session_id')
      .eq('username', username)
      .neq('session_id', session_id)
      .maybeSingle();

    if (existingInSessions) {
      return NextResponse.json(
        { error: 'USERNAME_TAKEN', message: 'Táto prezývka je už obsadená' },
        { status: 409 }
      );
    }

    // Insert or update username in user_sessions table
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .upsert(
        {
          session_id: session_id,
          username: username,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'session_id' }
      );

    if (sessionError) {
      console.error('Error upserting user_sessions:', sessionError);
      return NextResponse.json(
        { error: 'Failed to save username' },
        { status: 500 }
      );
    }

    // Update all predictions for this session with the new username
    const { error: predictionsError } = await supabase
      .from('predictions')
      .update({ username })
      .eq('session_id', session_id);

    if (predictionsError) {
      console.error('Error updating predictions:', predictionsError);
    }

    // Update all tournament predictions for this session with the new username
    const { error: tournamentError } = await supabase
      .from('tournament_predictions')
      .update({ username })
      .eq('session_id', session_id);

    if (tournamentError) {
      console.error('Error updating tournament predictions:', tournamentError);
    }

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error('Error in user POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
