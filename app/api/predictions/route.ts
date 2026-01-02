import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - Fetch predictions for a session
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
      .from('predictions')
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
    console.error('Error in predictions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update a prediction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, match_id, predicted_winner_id, predicted_score, username } = body;

    if (!session_id || !match_id || !predicted_winner_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use upsert to either insert or update
    const { data, error } = await supabase
      .from('predictions')
      .upsert(
        {
          session_id,
          match_id,
          predicted_winner_id,
          predicted_score,
          username: username || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'session_id,match_id',
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
    console.error('Error in predictions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a prediction
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');
    const matchId = searchParams.get('match_id');

    if (!sessionId || !matchId) {
      return NextResponse.json(
        { error: 'Session ID and Match ID are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('session_id', sessionId)
      .eq('match_id', matchId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete prediction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in predictions DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
