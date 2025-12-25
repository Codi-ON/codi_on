# CodiON Frontend (Vite + React + TS)

## Quick start
```bash
npm install
npm run dev
```

## Environment
- Put client env vars in `.env.local`
- Vite exposes **only** variables prefixed with `VITE_`

Example:
```bash
cp .env.example .env.local
```

## Notes
- `@/` alias resolves to `src/` (see `vite.config.ts` + `tsconfig.json`)
- Gemini wiring (optional) is isolated in `src/lib/gemini.ts`
