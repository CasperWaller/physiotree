# Drift & deploy

PhysioTree består av tre delar, alla på **Render** (gratisnivå):

| Del | Vad | Render-typ |
|---|---|---|
| **Frontend** | Vite/React-appen (statiska filer) | Static Site |
| **Backend** | Express-API (inloggning, innehåll) | Web Service |
| **Databas** | Postgres | Postgres |

Sedan admin-redigering infördes är **databasen sanningskällan** för innehållet.
Frontend hämtar allt från API:t vid start, så appen behöver ett körande API.

---

## Köra lokalt

**1. Backend + databas**

```bash
cd server
cp .env.example .env          # justera vid behov (särskilt ADMIN_PASSWORD)
docker compose up -d          # Postgres på port 5434
npm install
npx prisma db push            # skapar tabellerna
npm run seed                  # importerar content/ till DB + skapar admin
npm run dev                   # API på http://localhost:4000
```

**2. Frontend** (andra terminalen, från projektroten)

```bash
npm install
npm run dev                   # app på http://localhost:5173
```

Appen använder `http://localhost:4000` som API som standard. Logga in med
`ADMIN_EMAIL` / `ADMIN_PASSWORD` från `server/.env` för att få **✎ Redigera**.

> `npm run seed` läser in `content/`-filerna **en gång**. Därefter lever
> innehållet i databasen och redigeras i appen. Vid deploy körs en variant som
> bara seedar om databasen är **tom**, så admin-ändringar skrivs aldrig över.

---

## Deploya allt till Render

Allt definieras i [render.yaml](render.yaml).

1. Skapa konto på [render.com](https://render.com) och koppla ditt GitHub-konto.
2. **New + → Blueprint**, välj `physiotree`-repot. Render skapar tre resurser:
   `physiotree-db`, `physiotree-api` och `physiotree-web`.
3. Fyll i hemligheterna (markerade `sync:false`):
   - På **physiotree-api**: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
     (`JWT_SECRET` genereras, `DATABASE_URL` kopplas automatiskt).
   - Lämna `CORS_ORIGIN` och `VITE_API_URL` tomma tills vidare (steg 5).
4. Kör igång deployen. API:t seedar sig självt vid första starten (eftersom
   databasen är tom). Kontrollera `https://physiotree-api.onrender.com/api/health`
   → `{"ok":true}`.
5. **Koppla ihop de två URL:erna** (Render tilldelar dem vid första deployen):
   - På **physiotree-web**: sätt `VITE_API_URL` = API:ts URL
     (t.ex. `https://physiotree-api.onrender.com`) och **Clear cache & deploy**.
   - På **physiotree-api**: sätt `CORS_ORIGIN` = frontendens URL
     (t.ex. `https://physiotree-web.onrender.com`) och spara.
6. Öppna `https://physiotree-web.onrender.com` → logga in → redigera live.

> Gratis-tjänster somnar vid inaktivitet → första anropet kan ta ~30 s.
> Gratis-Postgres upphör efter 90 dagar (Render påminner; går att uppgradera).

En generisk [server/Dockerfile](server/Dockerfile) finns om du senare vill flytta
API:t till en container-host (bygg från repo-roten så `content/` kommer med).
