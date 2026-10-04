# iBEMS · Energy Command Center

Intelligent building energy management for the [American University of Armenia](https://aua.am) campus in Yerevan. The app shows live campus demand, solar and battery flow, device control, and recommendations that can be applied through an in-memory rules engine.

The campus model covers the Main Building, the Paramaz Avedisian Building, and the Akian Building. All readings come from JSON files under `src/data`. Edits and demo scenarios stay in memory and leave those files unchanged.

## Screens

| Route | What it shows |
| --- | --- |
| `/` | Campus power, solar, battery, grid, cost, energy flow, and the lead recommendation |
| `/campus` | Buildings, floors, rooms, and floor-plan heat |
| `/energy` | Demand against the context-adjusted expectation |
| `/devices` | Monitoring and control. Local-only devices stay monitoring-only |
| `/advisor` | Recommendations with cause, savings, and an apply action |
| `/optimization` | Standing and live savings opportunities |
| `/automation` | Rules that match campus conditions and run device plans |
| `/alerts` | Conditions that are true in the current state |
| `/solar-battery` | Generation, storage, and the price of the next kilowatt-hour |
| `/analytics` | History from the campus files, scaled to the selected filter |
| `/configuration` | Campus map, devices, types, prices, schedules, and related catalogs |

## Demo mode

Turn on **Demo mode** in the top bar. The presenter console walks a scripted story (empty lab, solar surplus, peak price) and can apply named scenarios. **Reset demo** restores the snapshot loaded from `src/data`.

Check the story and engine invariants with:

```bash
npx tsx scripts/verify-demo.ts
```

`scripts/generate-data.mjs` regenerates the JSON catalog in `src/data`.

## Stack

Next.js 15 (App Router, static export), React 19, TypeScript, Tailwind CSS 4, Zustand. Charts use Recharts. The campus map uses Leaflet.

## Getting started

Requires Node.js 22.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run lint` | ESLint |
| `npm run build` | Static export to `out/` |
| `npm start` | Serve a previous production build |

CI on `master` and pull requests runs lint, `tsc --noEmit`, and the production build. Pull requests get a Vercel preview. Pushes to `master` deploy to production.

## License

[MIT](LICENSE) © 2026 Milad Mahmoodi
