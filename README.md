# Apps PR — Full-Stack Feature Showcase

A portfolio-first application built to demonstrate working product features, not just static screens.

## Showcase
- Authentication and protected routes
- Responsive dashboard for web/mobile
- Interactive Feature Playground
- CRUD state demo, search and filtering
- News, saved items, calendar and report flows
- Node backend integration and secure token storage
- Docker-based local backend setup

## Stack
Expo · React Native · Expo Router · TypeScript · Node.js · Docker

## Run
Use Node.js 22+ and Docker. Authentication requires a running API and PostgreSQL.
Start the database and API first:

```bash
docker compose up -d postgres
cd server
npm install
npm run setup
npm run dev
```

`setup` creates `server/.env` with a random local `AUTH_SECRET` and the Compose database URL.
It never overwrites an existing file. Both `dev` and `start` load this file before importing
the database/auth modules; existing process environment variables take precedence.
If using your own database, edit `DATABASE_URL` in `server/.env`.

In a second terminal, from the repository root:

```bash
npm install
npm run web
```

Open `http://localhost:8081`. Local HTTP web uses the same loopback hostname on port 3000
when `EXPO_PUBLIC_API_URL` is absent. The API should respond at `http://localhost:3000/health`.

For a deployed web build or a physical device, set `EXPO_PUBLIC_API_URL` in the root `.env`
to the API address reachable **from that browser/device**. Android emulator host access can
use `http://10.0.2.2:3000`; physical devices need the computer's reachable LAN address.
After changing `.env`, restart with `npx expo start --clear`; rebuild exported websites with `npx expo export --platform web --clear` to discard any cached API URL. HTTPS websites
require an HTTPS API. A deployed build must not point to `localhost`.

On the API, set `CORS_ORIGIN` to the exact frontend origins (scheme, hostname, port),
comma-separated. Whitespace and trailing slashes are normalized; paths and wildcards are
rejected. Development defaults allow `http://localhost:8081` and `http://127.0.0.1:8081`.
Production requires an explicit `CORS_ORIGIN`, `DATABASE_URL`, and a private `AUTH_SECRET`
of at least 32 characters. Never expose the latter two as `EXPO_PUBLIC_*` variables.

## Verify / troubleshoot connection errors

- If `/health` cannot connect, start PostgreSQL and the API and inspect startup errors.
- If `/health` opens but browser login fails, check CORS and HTTPS/HTTP mismatch.
- If startup reports a missing variable, run `npm run setup` in `server` or correct its `.env`.
- Build success alone does not prove authentication works. Run all checks below.

```bash
npx tsc --noEmit
npx expo export --platform web
cd server
npm run typecheck
npm test
npm run test:api
```

`test:api` starts its own server on port 3001 (override with `TEST_API_PORT`) against the
configured database, checks real HTTP/CORS and authentication flows, and removes its test
user. Use a disposable local/test database. CI runs it against PostgreSQL 16.

Open **Playground** from the dashboard to explore the portfolio-oriented feature demonstrations.

## Notion briefing archive (snapshot import)

The site includes the snapshot retrieved on 2026-09-24 from **글로벌 경제 브리핑 → 경제 브리핑 아카이브**:
https://www.notion.so/1e515d0ec6cf4b95a3e1a6844e0dbfc9

- 7 pages: 6 daily briefings and 1 weekly report, dated September 19–24. No monthly report exists in this snapshot.
- Titles, original summaries, full text/tables, dates, regions, sectors and source URLs are preserved in `server/data/notion-briefings.json`.
- API startup inserts missing pages into PostgreSQL before accepting requests. Stable Notion page IDs prevent duplicates and preserve saved references; existing records are not overwritten on restart.
- News, search, regional/sector filters, calendar, saved items and report tabs use those database records. Reports follow the original Notion type and display their original publication date.
- This is a **one-time snapshot, not automatic synchronization**. No Notion token is required. New or edited Notion pages will not appear until a fresh snapshot is imported.
- To reapply a refreshed snapshot (including updates to existing pages), run `npm run import:notion` from `server` while PostgreSQL is running. This does not delete other articles or Notion pages missing from the snapshot.
- The imported material is user-authored Notion content; the import does not independently verify its financial claims. The original Notion page and reference source remain linked in each detail view.

The bundled snapshot is the source for a new local database too: pulling this change and starting the API is enough to populate the archive.
