export interface ChallongeParticipant {
  id: number;
  tournament_id: number;
  name: string;
  seed: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  invite_email: string | null;
  final_rank: number | null;
  misc: string | null;
  icon: string | null;
  on_waiting_list: boolean;
  invitation_pending: boolean;
  display_name: string;
  display_name_with_invitation_email_address: string;
  email_hash: string | null;
  username: string | null;
  attached_participatable_portrait_url: string | null;
  can_check_in: boolean;
  checked_in: boolean;
  reactivatable: boolean;
  check_in_open: boolean;
  group_id: number | null;
  group_player_ids: number[];
  challonge_username: string | null;
  challonge_email_address_verified: boolean | null;
  removable: boolean;
  participatable_or_invitation_attached: boolean;
  confirm_remove: boolean;
  has_irrelevant_seed: boolean;
}

export interface ChallongeMatch {
  id: number;
  tournament_id: number;
  state: 'pending' | 'open' | 'complete';
  player1_id: number | null;
  player2_id: number | null;
  player1_prereq_match_id: number | null;
  player2_prereq_match_id: number | null;
  player1_is_prereq_match_loser: boolean;
  player2_is_prereq_match_loser: boolean;
  winner_id: number | null;
  loser_id: number | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
  identifier: string;
  has_attachment: boolean;
  round: number;
  player1_votes: number | null;
  player2_votes: number | null;
  group_id: number | null;
  attachment_count: number | null;
  scheduled_time: string | null;
  location: string | null;
  underway_at: string | null;
  optional: boolean;
  rushb_id: string | null;
  completed_at: string | null;
  suggested_play_order: number | null;
  forfeited: boolean | null;
  prerequisite_match_ids_csv: string;
  scores_csv: string;
}

export interface ChallongeTournament {
  id: number;
  name: string;
  url: string;
  description: string;
  tournament_type: string;
  started_at: string | null;
  completed_at: string | null;
  require_score_agreement: boolean;
  notify_users_when_matches_open: boolean;
  created_at: string;
  updated_at: string;
  state: 'pending' | 'underway' | 'awaiting_review' | 'complete' | 'group_stages_underway';
  open_signup: boolean;
  notify_users_when_the_tournament_ends: boolean;
  progress_meter: number;
  quick_advance: boolean;
  hold_third_place_match: boolean;
  pts_for_game_win: string;
  pts_for_game_tie: string;
  pts_for_match_win: string;
  pts_for_match_tie: string;
  pts_for_bye: string;
  swiss_rounds: number;
  private: boolean;
  ranked_by: string;
  show_rounds: boolean;
  hide_forum: boolean;
  sequential_pairings: boolean;
  accept_attachments: boolean;
  rr_pts_for_game_win: string;
  rr_pts_for_game_tie: string;
  rr_pts_for_match_win: string;
  rr_pts_for_match_tie: string;
  created_by_api: boolean;
  credit_capped: boolean;
  category: string | null;
  hide_seeds: boolean;
  prediction_method: number;
  predictions_opened_at: string | null;
  anonymous_voting: boolean;
  max_predictions_per_user: number;
  signup_cap: number | null;
  game_id: number | null;
  participants_count: number;
  group_stages_enabled: boolean;
  allow_participant_match_reporting: boolean;
  teams: boolean;
  check_in_duration: number | null;
  start_at: string | null;
  started_checking_in_at: string | null;
  tie_breaks: string[];
  locked_at: string | null;
  event_id: number | null;
  public_predictions_before_start_time: boolean;
  ranked: boolean;
  grand_finals_modifier: string | null;
  predict_the_losers_bracket: boolean;
  spam: boolean | null;
  ham: boolean | null;
  rr_iterations: number;
  tournament_registration_id: number | null;
  donation_contest_enabled: boolean | null;
  mandatory_donation: boolean | null;
  non_elimination: boolean;
  auto_assign_stations: boolean | null;
  only_start_matches_with_stations: boolean | null;
  registration_fee: string;
  registration_type: string | null;
  split_participants: boolean;
  allowed_regions: string[];
  show_participant_country: boolean | null;
  program_id: number | null;
  program_classification_ids_csv: string;
  team_size_range: number | null;
  toxic: boolean | null;
  use_new_style: boolean;
  processed_checkout_at: string | null;
  review_before_finalizing: boolean;
  reviewing_at: string | null;
  force_round_robin_ordering: string | null;
  pairing_method: string | null;
  exclude_final_round: boolean;
  participants_swappable: boolean;
  team_convertable: boolean;
  group_stages_were_started: boolean;
}

export interface ChallongeTournamentResponse {
  tournament: ChallongeTournament;
}

export interface ChallongeParticipantResponse {
  participant: ChallongeParticipant;
}

export interface ChallongeMatchResponse {
  match: ChallongeMatch;
}
