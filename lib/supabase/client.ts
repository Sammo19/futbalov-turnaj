import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Prediction {
  id: string;
  session_id: string;
  match_id: number;
  predicted_winner_id: number;
  predicted_score?: string;
  created_at: string;
  updated_at: string;
}

export interface PredictionInsert {
  session_id: string;
  match_id: number;
  predicted_winner_id: number;
  predicted_score?: string;
}

export interface PredictionUpdate {
  predicted_winner_id?: number;
  predicted_score?: string;
}
