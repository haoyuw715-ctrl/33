# Repository Diagnostic Audit (Student Game Project)

## 1. Project identity

### Finding: Vite + React single-page app with TypeScript
**What exists:** The repo is a Vite + React SPA with TypeScript entrypoints at [`index.tsx`](../index.tsx:1) and root component in [`App.tsx`](../App.tsx:1). Build and dev are driven by Vite scripts in [`package.json`](../package.json:1).  
**Why it matters:** This is a static client-side app suitable for GitHub Pages, provided base paths are correct.  
**Label:** Acceptable as-is

### Finding: Local run expected via Vite dev server
**What exists:** README instructs local run with `npm install` and `npm run dev` and mentions a `.env.local` Gemini API key ([`README.md`](../README.md:11)). Vite dev server is pinned to port 3000 ([`vite.config.ts`](../vite.config.ts:8)).  
**Why it matters:** This aligns with student workflows; fixed port can be helpful in a classroom.  
**Label:** Acceptable as-is

### Finding: Build step exists, produces Vite output
**What exists:** `npm run build` calls `vite build` and will output to Vite’s default `dist` folder unless configured otherwise ([`package.json`](../package.json:6)).  
**Why it matters:** GitHub Pages from `main/docs` requires either changing the output dir or copying build output.  
**Label:** Fix now

### Finding: Interaction model is desktop/laptop first
**What exists:** UI uses a wide, split layout with a log panel hidden on small screens, and many controls are sized for pointer input ([`App.tsx`](../App.tsx:505)).  
**Why it matters:** Presentations on tablets might feel cramped; a laptop is likely the intended demo device.  
**Label:** Teaching moment

## 2. Runtime assumptions

### Finding: Build-time injection of Gemini key into client bundle
**What exists:** Vite `define` injects `process.env.GEMINI_API_KEY` and `process.env.API_KEY` into the client bundle ([`vite.config.ts`](../vite.config.ts:13)).  
**Why it matters:** This contradicts BYOK-only rules; if `.env.local` is used, the key becomes embedded in the build output. For GitHub Pages, that is a public leak.  
**Label:** Fix now

### Finding: Pure client-side runtime
**What exists:** All logic runs in the browser; there is no server code. AI calls are direct from the browser via `@google/genai` ([`services/ai.ts`](../services/ai.ts:1)).  
**Why it matters:** This is compatible with GitHub Pages (static hosting) but means API keys must be handled safely client-side.  
**Label:** Acceptable as-is

### Finding: Node + npm expected for local dev/build
**What exists:** README and `package.json` require Node and npm scripts.  
**Why it matters:** Students need Node installed locally, but no other tooling is required. Works well for presentation day.  
**Label:** Acceptable as-is

### Finding: External CDN usage for CSS and fonts
**What exists:** Tailwind CDN and Google Fonts are loaded from public CDNs in [`index.html`](../index.html:7).  
**Why it matters:** CDN use is acceptable for this context. For offline demos, this becomes a risk.  
**Label:** Teaching moment

## 3. AI / API usage and value

### AI integration: Google Gemini (AI move selection)
**Provider:** Google Gemini (`@google/genai`)  
**How key is sourced:** UI collects a key and stores it in `localStorage` ([`App.tsx`](../App.tsx:66)).  
**How key is stored:** `localStorage` under `gemini_api_key` ([`App.tsx`](../App.tsx:349)).  
**BYOK status:** Ambiguous; UI is BYOK, but Vite build injects `process.env.GEMINI_API_KEY` into the client bundle ([`vite.config.ts`](../vite.config.ts:13)).  
**Gameplay value:** AI decides opponent moves; fallback logic exists when no key is provided ([`services/ai.ts`](../services/ai.ts:4)).  
**Classification:** Core gameplay dependency (when VS AI is chosen)  
**Why it matters:** The game can run without a key using fallback logic, but the presence of build-time API injection breaks BYOK expectations.  
**Label:** Fix now

### AI integration: Google Gemini (commentary)
**Provider:** Google Gemini (`@google/genai`)  
**How key is sourced:** Same localStorage key.  
**How key is stored:** `localStorage` (`gemini_api_key`).  
**BYOK status:** Ambiguous for same reason as above.  
**Gameplay value:** Adds flavor text; does not affect win conditions.  
**Classification:** Optional enhancement  
**Why it matters:** This can be turned into deterministic text with no gameplay impact.  
**Label:** Teaching moment

## 4. Deployment readiness (GitHub Pages, project site)

### Finding: Build output folder is default `dist`
**What exists:** Vite build outputs to `dist` (no `build.outDir` in config) ([`vite.config.ts`](../vite.config.ts:5)).  
**Why it matters:** GitHub Pages from `main/docs` expects `docs/` to be committed. Right now there is no `docs/` output.  
**Label:** Fix now

### Finding: Absolute asset paths in `index.html`
**What exists:** `index.html` references `/index.css` and `/index.tsx` ([`index.html`](../index.html:57)).  
**Why it matters:** On a project subpath (`https://user.github.io/repo/`), absolute paths break. A relative base (e.g., `base: './'`) is needed so assets resolve correctly after build.  
**Label:** Fix now

### Finding: No Pages-specific base configured
**What exists:** `vite.config.ts` does not set `base`, so Vite will emit root-relative assets by default.  
**Why it matters:** GitHub Pages project sites require a non-root base; otherwise JS/CSS fails to load.  
**Label:** Fix now

### Finding: No committed build artifacts
**What exists:** There is no `dist/` or `docs/` directory in the repo root (per workspace listing).  
**Why it matters:** Manual GitHub Pages deployment from `main/docs` requires committed static files.  
**Label:** Fix now

## 5. Security and leakage (pragmatic)

### Finding: README instructs storing API key in `.env.local`
**What exists:** README says to set `GEMINI_API_KEY` in `.env.local` ([`README.md`](../README.md:16)).  
**Why it matters:** With current Vite config, this injects the key into the client bundle and leaks it publicly if deployed. This conflicts with BYOK-only rules.  
**Label:** Fix now

### Finding: Client-side BYOK storage is implemented
**What exists:** Key is stored in `localStorage`, not in repo or server ([`App.tsx`](../App.tsx:349)).  
**Why it matters:** This is acceptable for a student demo and aligns with the BYOK constraint if build-time injection is removed.  
**Label:** Acceptable as-is

## 6. Code health (high level)

### Finding: Monolithic component handles game logic + UI
**What exists:** `App.tsx` contains state, rules, AI flow, UI, and layout in one file ([`App.tsx`](../App.tsx:63)).  
**Why it matters:** Harder to extend or debug; however, acceptable for a student scope.  
**Label:** Teaching moment

### Finding: AI logic and gameplay are tightly coupled
**What exists:** `App.tsx` calls AI functions directly during turn flow ([`App.tsx`](../App.tsx:292)).  
**Why it matters:** This coupling makes it harder to swap AI for deterministic behavior if needed.  
**Label:** Teaching moment

### Finding: Vite importmap present in `index.html`
**What exists:** An importmap is defined for React and libraries ([`index.html`](../index.html:46)).  
**Why it matters:** Vite typically handles module resolution during build; an importmap in `index.html` can be redundant or confusing. It may hint at AI-generated scaffolding.  
**Label:** Teaching moment

## 7. Teaching implications

### What will confuse a student next
- **Build vs. runtime key usage**: The README suggests `.env.local`, but the UI uses localStorage; this dual path is confusing and leaks keys ([`README.md`](../README.md:16), [`vite.config.ts`](../vite.config.ts:13), [`App.tsx`](../App.tsx:66)).  
**Label:** Fix now

- **GitHub Pages base path**: Absolute asset paths will work locally but fail on a project site. This commonly trips up students. ([`index.html`](../index.html:57)).  
**Label:** Fix now

### What will block a student from sharing or presenting
- **Pages deploy from `main/docs` not ready**: No `docs/` output and no base path config for a project subpath.  
**Label:** Fix now

### What should be fixed now vs. teaching moment
- **Fix now**: Remove build-time API injection, align README with BYOK-only usage, configure `base: './'` and output to `docs/` (or copy build output), and ensure assets are relative.  
**Label:** Fix now

- **Teaching moment**: Component structure and AI coupling can be refactored later; it won’t block today’s presentation.  
**Label:** Teaching moment

