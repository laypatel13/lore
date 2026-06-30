# Lore — Frontend

TanStack Start (React + Vite) app — landing page, repo ingestion ("Analyze"),
chat-with-your-codebase UI, and a memory/graph view.

## Structure

```
frontend/
├── index.html                  # Vite entry
├── src/
│   ├── main.tsx                  # Client entry, imports global styles
│   ├── start.ts                   # TanStack Start server middleware (error handling)
│   ├── server.ts                   # Cloudflare-compatible SSR fetch wrapper
│   ├── router.tsx                  # Router instance
│   ├── routeTree.gen.ts            # AUTO-GENERATED — do not edit, gitignored
│   ├── routes/                     # File-based routes (TanStack Router)
│   │   ├── __root.tsx
│   │   ├── index.tsx                # Landing page route
│   │   ├── analyze.tsx               # Repo ingestion route
│   │   ├── chat.$repoId.tsx          # Chat-with-repo route
│   │   └── memory.$repoId.tsx        # Memory/graph view route
│   ├── pages/                      # Page-level components rendered by routes
│   │   ├── LandingPage.tsx  (+.module.css)
│   │   ├── AnalyzePage.tsx  (+.module.css)
│   │   ├── ChatPage.tsx     (+.module.css)
│   │   └── MemoryPage.tsx   (+.module.css)
│   ├── components/
│   │   ├── layout/                   # NavBar etc.
│   │   └── ui/                        # shadcn/ui primitives (flat, generated)
│   ├── api/
│   │   └── client.ts                  # Backend API client (axios)
│   ├── hooks/
│   ├── lib/
│   │   ├── utils.ts                    # cn() class merge helper
│   │   ├── router-compat.tsx           # react-router-dom -> TanStack Router shim
│   │   ├── error-reporting.ts          # Client-side error boundary reporting
│   │   └── ssr/                         # Server-only error handling
│   │       ├── error-capture.ts
│   │       └── error-page.ts
│   ├── types/                       # Shared TS types
│   └── styles/
│       ├── global.css                 # Design tokens, imported by main.tsx (client)
│       └── head.css                    # Same tokens, linked in <head> for SSR (no FOUC)
├── components.json               # shadcn/ui config
├── vite.config.ts
└── package.json
```

## Setup

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

## Notes

- `src/styles/head.css` (head `<link>`, SSR-safe) and `src/styles/global.css`
  (imported in `main.tsx`) are both intentional — the Lovable/TanStack Start
  scaffold loads design tokens via both the document head and the client
  bundle so styles are present pre-hydration.
- `routeTree.gen.ts` is regenerated automatically by the dev/build command;
  it's gitignored and should never be hand-edited.
- `lib/ssr/` holds the two files only ever imported from `server.ts` /
  `start.ts` (server-side error capture and fallback error page) — kept
  separate from general client-side `lib/` utilities.
