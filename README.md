# Developer Manifesto

MasterFabric Developer Manifesto site (`v0.2.0`): markdown + Three.js UI, signatures via **particular-manifesto** through mf-go.

See [MASTERFABRIC.md](./MASTERFABRIC.md) for the control-plane wiring. Core-base shell: `mf-manifesto/`.

## Features

- Markdown-driven manifesto content (Particular store, local `content/` fallback)
- JetBrains Mono typography + Three.js atmosphere
- MasterFabric auth (GitHub OAuth or email via mf-go)
- Signatures stored in **particular-manifesto** (no Supabase, no demo mode)
- Public JSON APIs: `/api/manifesto`, `/api/signatures`

## Tech stack

- Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Three.js
- Backend: **mf-go** + **particular-manifesto**

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_GRAPHQL_URL + NEXT_PUBLIC_MF_APP_API_KEY
# (or: ../masterfabric-particulars/scripts/print-mf-manifesto-env.sh > .env.local)

npm run dev   # http://localhost:3020
```

Register Particular instance + grant `manifesto.*` on app `co.masterfabric.manifesto.web` in mf-core Connectors.

## Project structure

```
src/
  app/                 # pages + API routes (auth, manifesto, signatures)
  components/          # UI
  hooks/useSignatures.ts
  lib/mf-*.ts          # mf-go + Particular bridge
content/manifesto.md   # local seed / fallback content
```

## License

MIT — MasterFabric Developers
