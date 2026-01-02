# Challonge Betting App - Setup Guide

## Čo bolo implementované

### ✅ Funkcie aplikácie:
1. **Zobrazenie turnaja** - Informácie o turnaji, počet účastníkov, priebeh
2. **Zobrazenie zápasov** - Všetky zápasy s aktuálnym skóre
3. **Tipovanie zápasov** - Anonymné tipovanie bez registrácie
4. **Štatistiky tipov** - Percentuálne zobrazenie tipov pre každý tím
5. **Automatické obnovenie** - Každých 30 sekúnd sa obnovujú údaje
6. **Skupinová štruktúra** - Záložky pre Skupinu A, Skupinu B, Semifinále, Finále
7. **Záložka Tímy** - Zobrazenie všetkých tímov s ich hráčmi
8. **Admin panel** - Správa hráčov (pridávanie, úprava, mazanie)

### 📁 Štruktúra projektu:
```
challonge-betting/
├── app/
│   ├── page.tsx                    # Hlavná stránka s turnajom
│   ├── admin/page.tsx              # Admin panel pre správu hráčov
│   └── api/
│       ├── matches/route.ts        # API pre zápasy
│       ├── predictions/route.ts    # API pre tipovanie
│       └── players/route.ts        # API pre správu hráčov
├── components/
│   ├── TournamentView.tsx          # Zobrazenie turnaja s tabmi
│   ├── MatchCard.tsx               # Karta jednotlivého zápasu
│   └── TeamsView.tsx               # Zobrazenie tímov a hráčov
├── lib/
│   ├── challonge/client.ts         # Challonge API klient
│   ├── supabase/client.ts          # Supabase klient
│   └── session.ts                  # Správa anonymných session
├── types/
│   └── challonge.ts                # TypeScript typy
├── .env.local                      # Konfiguračné premenné
├── supabase-schema.sql             # SQL pre predictions tabuľku
└── supabase-players-schema.sql    # SQL pre players tabuľku
```

## 🚀 Spustenie aplikácie

### 1. Nainštalovať závislosti (ak ešte nie sú)
```bash
npm install
```

### 2. Nastaviť Supabase databázu

#### a) Vytvoriť predictions tabuľku
1. Otvorte Supabase Dashboard: https://lwhmbqakchckcjsjglko.supabase.co
2. Prejdite do **SQL Editor**
3. Otvorte súbor `supabase-schema.sql` a skopírujte celý obsah
4. Vložte do SQL Editora a kliknite **RUN**

#### b) Vytvoriť players tabuľku
1. Otvorte súbor `supabase-players-schema.sql` a skopírujte celý obsah
2. Vložte do SQL Editora a kliknite **RUN**

#### c) Overiť, že tabuľky sú vytvorené
Prejdite do **Table Editor** a mali by ste vidieť:
- `predictions` - tabuľka pre tipy
- `players` - tabuľka pre hráčov

### 3. Spustiť vývojový server
```bash
npm run dev
```

Aplikácia bude dostupná na: **http://localhost:3000**

## 🎮 Ako používať aplikáciu

### Pre návštevníkov (tipovanie):
1. Otvorte `http://localhost:3000`
2. Kliknite na záložku **Všetky**, **Skupina A**, **Skupina B**, **Semifinále** alebo **Finále**
3. Kliknite na tím, na ktorý chcete vsadiť
4. Váš tip sa uloží automaticky (zelené "Váš tip" sa zobrazí)
5. Vidíte percentá tipov pre každý tím

### Pre správcu (admin):
1. Otvorte `http://localhost:3000`
2. Kliknite na záložku **Tímy**
3. Kliknite na tlačidlo **⚙️ Admin** (vpravo hore)
4. Zadajte heslo: `turnaj2026admin`
5. Teraz môžete:
   - **Pridať hráča** - kliknite na "Pridať hráča"
   - **Upraviť hráča** - kliknite na "Upraviť" pri hráčovi
   - **Vymazať hráča** - kliknite na "Vymazať" pri hráčovi

## 🔑 Prihlasovacie údaje

### Admin prístup:
- Heslo: `turnaj2026admin`
- Môžete ho zmeniť v `.env.local` (ADMIN_PASSWORD)

### Challonge API:
- Username: Sammo108
- API Key: 5f06c5b28acc6f018ad8c546954fa5b68afbcd8aeadc123e
- Tournament ID: f8qurooc

### Supabase:
- URL: https://lwhmbqakchckcjsjglko.supabase.co
- Anon Key: (v .env.local)

## 📊 Tímy v turnaji

### Skupina A (Group ID: 7639200):
1. DZIVY MIX
2. KAMZÍCI
3. UNISA s.r.o.
4. PUPKAČI

### Skupina B (Group ID: 7639201):
5. OLD BOYS
6. STARS
7. VLAŠSKY ORECHAČI
8. GLAKTICOS

## 🌐 Deployment na Vercel

### 1. Push kód na GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy na Vercel
1. Prejdite na https://vercel.com
2. Kliknite **New Project**
3. Importujte GitHub repozitár
4. Pridajte tieto **Environment Variables**:
   ```
   NEXT_PUBLIC_CHALLONGE_USERNAME=Sammo108
   NEXT_PUBLIC_CHALLONGE_API_KEY=5f06c5b28acc6f018ad8c546954fa5b68afbcd8aeadc123e
   NEXT_PUBLIC_TOURNAMENT_ID=f8qurooc
   NEXT_PUBLIC_SUPABASE_URL=https://lwhmbqakchckcjsjglko.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<váš anon key>
   ADMIN_PASSWORD=turnaj2026admin
   ```
5. Kliknite **Deploy**

## ⚠️ Dôležité upozornenia

### Bezpečnosť:
- **NEODOŠLITE .env.local do GitHub!** Je už v .gitignore
- Admin heslo je uložené iba lokálne v .env.local
- API kľúče sú citlivé údaje - nezdieľajte ich verejne

### Supabase RLS (Row Level Security):
- `predictions` tabuľka má povolený prístup pre všetkých
- `players` tabuľka má povolené čítanie pre všetkých
- Úpravy hráčov sú chránené admin heslom v API route

## 🐛 Riešenie problémov

### Port 3000 je obsadený:
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Supabase chyby:
1. Overte, že ste spustili oba SQL súbory v Supabase SQL Editore
2. Skontrolujte, či NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY sú správne

### Challonge API nefunguje:
1. Overte, že API key a username sú správne
2. Skontrolujte, či je turnaj verejný na Challonge

### Hráči sa nezobrazujú:
1. Uistite sa, že ste vytvorili `players` tabuľku v Supabase
2. Skontrolujte konzolu prehliadača na chyby
3. Skúste pridať hráčov cez Admin panel

## 📝 TODO / Ďalšie funkcie

Možné rozšírenia:
- [ ] Export tipov do CSV
- [ ] Leaderboard - kto má najviac správnych tipov
- [ ] Notifikácie pri novom zápase
- [ ] Push notifications
- [ ] Štatistiky pre každého hráča
- [ ] História zápasov
- [ ] Komentáre k zápasom

## 💡 Kontakt a podpora

Pri problémoch kontaktujte vývojára alebo vytvorte issue na GitHub repozitári.

---

**Verzia:** 1.0.0
**Dátum:** 2026-01-02
**Technológie:** Next.js 15, TypeScript, TailwindCSS, Supabase, Challonge API
