import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - Fetch tournament predictions for a session
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

    const { data, error } = await supabase
      .from('tournament_predictions')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in tournament-predictions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update a tournament prediction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, prediction_type, team_id, username } = body;

    if (!session_id || !prediction_type || !team_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert - insert or update if exists
    const { data, error } = await supabase
      .from('tournament_predictions')
      .upsert(
        {
          session_id,
          prediction_type,
          team_id,
          username: username || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'session_id,prediction_type,team_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save prediction' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in tournament-predictions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a tournament prediction
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');
    const predictionType = searchParams.get('prediction_type');
    const teamId = searchParams.get('team_id');

    if (!sessionId || !predictionType || !teamId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('tournament_predictions')
      .delete()
      .eq('session_id', sessionId)
      .eq('prediction_type', predictionType)
      .eq('team_id', parseInt(teamId));

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete prediction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in tournament-predictions DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
