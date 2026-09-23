# Drift & deploy

PhysioTree består av två delar:

| Del | Vad | Var |
|---|---|---|
| **Frontend** | Vite/React-appen (statiska filer) | GitHub Pages |
| **Backend** | Express-API + Postgres (inloggning, innehåll) | En Node-host (Render/Railway/Fly) |

Sedan admin-redigering infördes är **databasen sanningskällan** för innehållet. Frontend hämtar allt från API:t vid start, så appen behöver ett körande API för att visa något.

---

## Köra lokalt

**1. Backend + databas**

```bash
cd server
cp .env.example .env          # justera vid behov (särskilt ADMIN_PASSWORD)
docker compose up -d          # startar Postgres på port 5434
npm install
npx prisma db push            # skapar tabellerna
npm run seed                  # importerar content/ till DB + skapar admin-användaren
npm run dev                   # API på http://localhost:4000
```

**2. Frontend** (i ett andra terminalfönster, från projektroten)

```bash
npm install
npm run dev                   # app på http://localhost:5173
```

Appen använder `http://localhost:4000` som API som standard. Logga in med
`ADMIN_EMAIL` / `ADMIN_PASSWORD` från `server/.env` för att få knappen **✎ Redigera**.

> `npm run seed` läser in `content/`-filerna **en gång**. Därefter redigeras
> innehållet i appen och lever i databasen — kör inte seed igen mot en databas
> med riktiga ändringar, då skrivs de över av filerna.

---

## Deploya backend (Render – gratisnivå)

1. Skapa konto på [render.com](https://render.com).
2. **New + → Blueprint**, välj detta repo. Render läser [server/render.yaml](server/render.yaml)
   och skapar API-tjänsten + en Postgres-databas.
3. Sätt hemligheterna i dashboarden: `ADMIN_EMAIL` och `ADMIN_PASSWORD`
   (`JWT_SECRET` genereras automatiskt, `DATABASE_URL` kopplas automatiskt).
4. Efter första deployen: öppna tjänstens **Shell** och kör en gång:
   ```bash
   npm run seed
   ```
   (importerar innehållet och skapar admin-användaren i den riktiga databasen).
5. Kontrollera `https://<din-tjänst>.onrender.com/api/health` → `{"ok":true}`.

Alternativ: [server/Dockerfile](server/Dockerfile) fungerar på Railway/Fly/valfri
container-host. Sätt då `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD` som miljövariabler.

> Gratis-tjänster somnar vid inaktivitet → första anropet kan ta ~30 s.

---

## Koppla frontend till backend

1. I GitHub: **Settings → Secrets and variables → Actions → Variables → New variable**
   - Namn: `VITE_API_URL`
   - Värde: din API-URL, t.ex. `https://physiotree-api.onrender.com`
2. Kör om Pages-workflowen (push eller **Run workflow**). Bygget bäddar in URL:en.
3. Se till att API:ts `CORS_ORIGIN` innehåller `https://casperwaller.github.io`.

Klart: [https://casperwaller.github.io/physiotree/](https://casperwaller.github.io/physiotree/)
hämtar nu innehåll från API:t, och inloggning + redigering fungerar live.
