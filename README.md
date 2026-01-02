# 🏆 Challonge Tournament Betting App

Next.js aplikácia na zobrazovanie turnajov z Challonge s možnosťou tipovania výsledkov zápasov.

## ✨ Funkcie

- 📊 **Real-time zobrazenie turnaja** - Automatické obnovenie každých 30 sekúnd
- 🎯 **Tipovanie zápasov** - Anonymné tipovanie bez registrácie
- 📈 **Štatistiky tipov** - Zobrazenie percentuálneho rozdelenia tipov
- 🎨 **Moderný dizajn** - Responzívne UI s TailwindCSS
- ⚡ **Rýchle** - Optimalizované pomocou Next.js 15 a React 19

## 🚀 Rýchle spustenie

### 1. Nainštaluj závislosti

```bash
npm install
```

### 2. Nastav Supabase

1. Vytvor účet na [supabase.com](https://supabase.com)
2. Vytvor nový projekt
3. V SQL Editore spusti SQL z `supabase-schema.sql`
4. Skopíruj Supabase URL a Anon Key z Settings > API

### 3. Aktualizuj .env.local

Súbor `.env.local` už obsahuje tvoje Challonge údaje. Len doplň Supabase:

```bash
# Challonge API Configuration (už nastavené)
NEXT_PUBLIC_CHALLONGE_USERNAME=Sammo108
NEXT_PUBLIC_CHALLONGE_API_KEY=5f06c5b28acc6f018ad8c546954fa5b68afbcd8aeadc123e
NEXT_PUBLIC_TOURNAMENT_ID=f8qurooc

# Supabase Configuration (doplň tieto)
NEXT_PUBLIC_SUPABASE_URL=tvoja_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj_supabase_anon_key
```

### 4. Spusti development server

```bash
npm run dev
```

Otvor [http://localhost:3000](http://localhost:3000) v prehliadači.

## 📦 Deployment na Vercel

### Automatický deployment (Odporúčané)

1. Push projekt na GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin tvoj_github_repo_url
git push -u origin main
```

2. Choď na [vercel.com](https://vercel.com)
3. Klikni na **"New Project"**
4. Importuj svoj GitHub repository
5. Pridaj Environment Variables:
   - `NEXT_PUBLIC_CHALLONGE_USERNAME`
   - `NEXT_PUBLIC_CHALLONGE_API_KEY`
   - `NEXT_PUBLIC_TOURNAMENT_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Klikni **"Deploy"**

### Manuálny deployment cez CLI

```bash
# Nainštaluj Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

## 🗂️ Štruktúra projektu

```
.
├── app/
│   ├── api/
│   │   ├── tournament/      # API endpoint pre turnaj
│   │   ├── matches/          # API endpoint pre zápasy
│   │   └── predictions/      # API endpoint pre tipy
│   └── page.tsx             # Hlavná stránka
├── components/
│   ├── TournamentView.tsx   # Hlavný komponent turnaja
│   └── MatchCard.tsx        # Komponent zápasu
├── lib/
│   ├── challonge/
│   │   └── client.ts        # Challonge API klient
│   ├── supabase/
│   │   └── client.ts        # Supabase klient
│   └── session.ts           # Session management
├── types/
│   └── challonge.ts         # TypeScript typy
└── supabase-schema.sql      # SQL schéma pre databázu
```

## 🔧 API Endpointy

### GET /api/tournament
Vráti informácie o turnaji.

### GET /api/matches
Vráti všetky zápasy s informáciami o hráčoch.

### GET /api/predictions?session_id={id}
Vráti tipy pre danú session.

### POST /api/predictions
Vytvorí alebo aktualizuje tip.

```json
{
  "session_id": "session_xxx",
  "match_id": 123,
  "predicted_winner_id": 456
}
```

### GET /api/predictions/stats?match_id={id}
Vráti štatistiky tipov pre zápas.

## 🎯 Ako to funguje

1. **Anonymné tipy**: Každý používateľ dostane unikátne session ID uložené v `localStorage`
2. **Real-time aktualizácie**: Stránka sa automaticky obnovuje každých 30 sekúnd
3. **Štatistiky**: Po zadaní tipu sa zobrazia percentuálne štatistiky všetkých tipov
4. **Responzívny dizajn**: Funguje na mobile, tablete i desktope

## 🛠️ Technológie

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Supabase** - Database a backend
- **Challonge API** - Tournament data
- **Vercel** - Hosting

## 📝 Poznámky

- Challonge API má limit 5,000 requestov mesačne na free pláne
- Od marca 2026 bude potrebný platený plán pre viac requestov
- Aplikácia používa anonymous auth, takže nie je potrebná registrácia
- Tipy sú uložené v Supabase databáze

## 🐛 Riešenie problémov

### "Failed to fetch tournament data"
- Skontroluj či máš správne nastavené `NEXT_PUBLIC_CHALLONGE_API_KEY` a `NEXT_PUBLIC_CHALLONGE_USERNAME`
- Overte že tournament ID je správne

### "Failed to save prediction"
- Skontroluj či máš správne nastavené Supabase credentials
- Overte či je SQL schéma správne nainštalovaná

### Zápasy sa neobnovujú
- Vyčisti cache: `rm -rf .next`
- Reštartuj development server: `npm run dev`

## 📄 Licencia

MIT

## 👨‍💻 Autor

Vytvorené pre turnaj **f8qurooc** na Challonge.
