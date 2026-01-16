# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 application for displaying Challonge tournament brackets with match prediction/betting functionality. Users can anonymously place predictions on matches, view real-time tournament updates, and see aggregated betting statistics. Built with TypeScript, React 19, TailwindCSS 4, and Supabase.

**Target Language**: Slovak (UI text and content)

## Development Commands

### Development Server
```bash
npm run dev          # Start dev server on http://localhost:3000
```

### Build & Production
```bash
npm run build        # Build for production
npm start            # Run production build
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

### Database Setup
Execute these SQL files in Supabase SQL Editor (in order):
1. `supabase-schema.sql` - Core predictions table
2. `supabase-players-schema.sql` - Players table
3. `supabase-tournament-predictions-schema.sql` - Tournament-wide predictions
4. `supabase-user-sessions.sql` - User sessions table
5. `supabase-add-username.sql` - Username support

Utility scripts:
- `supabase-clear-data.sql` - Clear all prediction data
- `supabase-clear-group-predictions.sql` - Clear group stage predictions

## Architecture Overview

### Data Flow Architecture

**External Data Source (Challonge API)**:
- Tournament data fetched via `lib/challonge/client.ts`
- Matches and participants retrieved in real-time
- API uses HTTP Basic Auth with username + API key
- No data is written back to Challonge

**User Predictions Storage (Supabase)**:
- Match predictions stored in `predictions` table
- Tournament-wide predictions in `tournament_predictions` table
- Anonymous users identified by `session_id` (localStorage)
- Users can optionally provide username for leaderboard

**Client-Server Pattern**:
```
Browser (Client)
    ↓ fetches via
API Routes (/app/api/*)
    ↓ reads from
Challonge API (external) + Supabase (predictions)
    ↓ returns to
React Components
```

### Key Architectural Patterns

1. **Anonymous User Sessions**: Each user gets a unique `session_id` generated client-side and stored in `localStorage` (see `lib/session.ts`). This allows anonymous predictions without registration.

2. **API Route Handlers**: All external API calls happen server-side through Next.js API routes to protect credentials and enable server-side caching.

3. **Client-Side Refresh**: Main page auto-refreshes every 30 seconds to show live tournament updates (see `app/page.tsx`).

4. **Environment Variable Fallback Pattern**: Both client and server code check for env vars with and without `NEXT_PUBLIC_` prefix:
   ```typescript
   process.env.VAR || process.env.NEXT_PUBLIC_VAR
   ```

5. **Group Stage Detection**: Matches are filtered by `group_id` to separate Group A (7639200), Group B (7639201), semifinals, and finals.

### Directory Structure

```
app/
├── page.tsx                          # Main tournament page (client component)
├── layout.tsx                        # Root layout
├── admin/page.tsx                    # Admin panel for player management
└── api/                              # API route handlers (server-side)
    ├── tournament/route.ts           # GET tournament details
    ├── matches/route.ts              # GET all matches with participants
    ├── predictions/
    │   ├── route.ts                  # GET/POST/DELETE match predictions
    │   └── stats/route.ts            # GET prediction statistics
    ├── tournament-predictions/
    │   ├── route.ts                  # Tournament-wide predictions
    │   └── stats/route.ts            # Tournament prediction stats
    ├── players/route.ts              # Player CRUD (requires admin password)
    └── user/route.ts                 # User session management

components/
├── TournamentView.tsx                # Main tournament UI with tabs
├── MatchCard.tsx                     # Individual match display
├── BettingModal.tsx                  # Prediction placement modal
├── UsernameModal.tsx                 # Username entry modal
├── TeamsView.tsx                     # Team/player roster display
├── PredictionsView.tsx               # User's predictions overview
├── StatsView.tsx                     # Betting statistics view
├── ResultsTable.tsx                  # Tournament results table
├── Sponsors.tsx                      # Sponsor logos display
└── PhotosView.tsx                    # Photo gallery

lib/
├── challonge/
│   └── client.ts                     # Challonge API client (axios-based)
├── supabase/
│   └── client.ts                     # Supabase client + TypeScript types
├── session.ts                        # Anonymous session ID management
├── slovak.ts                         # Slovak language declension helpers
└── sponsors-config.ts                # Sponsor configuration

types/
└── challonge.ts                      # TypeScript interfaces for Challonge API
```

### Component Hierarchy

```
app/page.tsx (fetches data, auto-refresh)
  └── TournamentView (tab navigation)
      ├── MatchCard[] (match display + betting)
      │   └── BettingModal (prediction UI)
      ├── TeamsView (roster display)
      ├── PredictionsView (user's bets)
      ├── StatsView (aggregated stats)
      ├── ResultsTable (tournament standings)
      └── PhotosView (photo gallery)
  └── Sponsors (sponsor logos)
```

### Database Schema

**predictions** table:
- `id` (UUID, PK)
- `session_id` (text) - anonymous user identifier
- `match_id` (bigint) - Challonge match ID
- `predicted_winner_id` (bigint) - Challonge participant ID
- `predicted_score` (text, optional)
- `username` (text, optional)
- `created_at`, `updated_at` (timestamps)
- **Unique constraint**: (session_id, match_id)

**tournament_predictions** table:
- Similar structure for tournament-wide predictions
- Used for "who will win the tournament" predictions

**players** table:
- Player roster with team assignments
- Managed via admin panel (`/admin`)

**user_sessions** table:
- Maps `session_id` to optional username
- Enables username persistence across sessions

### State Management

No global state library used. State managed via:
- React `useState` for component-local state
- `useEffect` for data fetching and intervals
- `localStorage` for session persistence (see `lib/session.ts`)
- Server state via API routes (no SWR/React Query)

## Important Development Notes

### Challonge API Integration
- **Rate Limits**: Free tier allows 5,000 requests/month (will need paid plan after March 2026)
- **Authentication**: HTTP Basic Auth via axios (username + API key)
- **Match States**: `pending`, `open`, `complete`
- **Group Stages**: Identified by `group_id` field on matches
- The app is READ-ONLY - never writes back to Challonge

### Environment Variables
All config lives in `.env.local` (see `.env.example` for template):
- `NEXT_PUBLIC_CHALLONGE_USERNAME` - Challonge account username
- `NEXT_PUBLIC_CHALLONGE_API_KEY` - Challonge API key
- `NEXT_PUBLIC_TOURNAMENT_ID` - Tournament ID from Challonge URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `ADMIN_PASSWORD` (optional) - Admin panel password

**Security Note**: Use `NEXT_PUBLIC_` prefix for values needed client-side. API routes can use either prefixed or non-prefixed versions.

### Supabase Configuration
- **Row Level Security (RLS)**: Enabled but set to allow all operations (anonymous auth)
- **Indexes**: Created on `session_id` and `match_id` for performance
- **View**: `prediction_stats` view aggregates vote counts and percentages
- **Trigger**: Auto-updates `updated_at` timestamp on row update

### Slovak Language Support
The UI is in Slovak. Helper functions in `lib/slovak.ts` handle noun declension:
- `declineUcastnik(count)` - "1 účastník", "2 účastníci", "5 účastníkov"
- `declineZapas(count)` - "1 zápas", "2 zápasy", "5 zápasov"

### Admin Panel
- Accessible at `/admin`
- Protected by password (stored in `ADMIN_PASSWORD` env var)
- Password check happens in API route, NOT client-side
- Used for managing player roster (CRUD operations)

### Testing Tournament Data
The app is configured for tournament ID `f8qurooc` with:
- **Group A** (group_id: 7639200): DZIVY MIX, KAMZÍCI, UNISA s.r.o., PUPKAČI
- **Group B** (group_id: 7639201): OLD BOYS, STARS, VLAŠSKY ORECHAČI, GLAKTICOS

## Common Development Patterns

### Adding a New API Route
1. Create route handler in `app/api/<endpoint>/route.ts`
2. Export async functions: `GET`, `POST`, `PUT`, `DELETE`
3. Use `NextRequest` and `NextResponse` from `next/server`
4. Import clients: `challongeClient` or `supabase`
5. Handle errors and return appropriate status codes

### Adding a New Component
1. Create `.tsx` file in `components/`
2. Mark as `'use client'` if using hooks or interactivity
3. Import types from `@/types/challonge`
4. Follow existing Tailwind styling patterns (green/emerald gradient theme)

### Modifying Database Schema
1. Create new `.sql` file with descriptive name
2. Test in Supabase SQL Editor first
3. Update TypeScript interfaces in `lib/supabase/client.ts`
4. Document in this file's "Database Setup" section

### Working with Match Data
Matches come from Challonge but are enriched with participant data:
```typescript
type EnrichedMatch = ChallongeMatch & {
  player1?: ChallongeParticipant | null;
  player2?: ChallongeParticipant | null;
};
```

This enrichment happens in `app/api/matches/route.ts`.

## Troubleshooting

### Port 3000 Already in Use
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Challonge API Errors
- Verify `NEXT_PUBLIC_CHALLONGE_USERNAME` and `NEXT_PUBLIC_CHALLONGE_API_KEY`
- Check tournament is public on Challonge
- Confirm tournament ID is correct

### Supabase Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure all SQL schema files have been executed
- Check Supabase project is active (not paused)

### Predictions Not Saving
- Check browser console for errors
- Verify `session_id` is being generated (localStorage)
- Confirm RLS policies are set correctly in Supabase

### Data Not Auto-Refreshing
- Check browser console for fetch errors
- Verify 30-second interval is running (see `app/page.tsx` useEffect)
- Clear Next.js cache: `rm -rf .next && npm run dev`
