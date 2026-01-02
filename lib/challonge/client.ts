import axios, { AxiosInstance } from 'axios';
import type {
  ChallongeTournamentResponse,
  ChallongeParticipantResponse,
  ChallongeMatchResponse,
} from '@/types/challonge';

export class ChallongeClient {
  private client: AxiosInstance;
  private username: string;
  private apiKey: string;

  constructor(username: string, apiKey: string) {
    this.username = username;
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: 'https://api.challonge.com/v1',
      auth: {
        username: this.username,
        password: this.apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Get tournament details
  async getTournament(tournamentId: string) {
    try {
      const response = await this.client.get<ChallongeTournamentResponse>(
        `/tournaments/${tournamentId}.json`,
        {
          params: {
            include_participants: 1,
            include_matches: 1,
          },
        }
      );
      return response.data.tournament;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      throw error;
    }
  }

  // Get all participants
  async getParticipants(tournamentId: string) {
    try {
      const response = await this.client.get<ChallongeParticipantResponse[]>(
        `/tournaments/${tournamentId}/participants.json`
      );
      return response.data.map((p) => p.participant);
    } catch (error) {
      console.error('Error fetching participants:', error);
      throw error;
    }
  }

  // Get all matches
  async getMatches(tournamentId: string) {
    try {
      const response = await this.client.get<ChallongeMatchResponse[]>(
        `/tournaments/${tournamentId}/matches.json`,
        {
          params: {
            state: 'all',
          },
        }
      );
      return response.data.map((m) => m.match);
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  // Get a specific match
  async getMatch(tournamentId: string, matchId: number) {
    try {
      const response = await this.client.get<ChallongeMatchResponse>(
        `/tournaments/${tournamentId}/matches/${matchId}.json`
      );
      return response.data.match;
    } catch (error) {
      console.error('Error fetching match:', error);
      throw error;
    }
  }

  // Update match score (requires appropriate permissions)
  async updateMatch(
    tournamentId: string,
    matchId: number,
    scoresCsv: string,
    winnerId?: number
  ) {
    try {
      const response = await this.client.put<ChallongeMatchResponse>(
        `/tournaments/${tournamentId}/matches/${matchId}.json`,
        {
          match: {
            scores_csv: scoresCsv,
            winner_id: winnerId,
          },
        }
      );
      return response.data.match;
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  }
}

// Create a singleton instance
// Try server-side env vars first (without NEXT_PUBLIC_), then fall back to client-side
const username = process.env.CHALLONGE_USERNAME || process.env.NEXT_PUBLIC_CHALLONGE_USERNAME || '';
const apiKey = process.env.CHALLONGE_API_KEY || process.env.NEXT_PUBLIC_CHALLONGE_API_KEY || '';

export const challongeClient = new ChallongeClient(username, apiKey);
