<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Neon Duel: Cyber Tactics

Local-first student game with optional Gemini-powered AI.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run dev`

The game runs without an API key. If you want smarter AI moves and commentary, open the in-game key dialog and paste your Gemini API key. The key is stored only in your browser `localStorage`.

## How to Play

- Choose **VS AI Protocol** (CPU opponent) or **Local PvP (Hotseat)**. A setup modal appears to name both players.
- End your turn with the large **END TURN** button.
- You can **Exit** a battle anytime using the top bar button.
- AI is optional flavor only; the game is fully playable without a key.

## Persistence

Basic match stats (matches, wins, AI wins, best win streak) are saved locally in `localStorage` under `neon_duel_stats`.
Per-player leaderboard entries are stored in `localStorage` under `neon_duel_leaderboard`.

## Build for GitHub Pages (manual)

1. Build the project:
   `npm run build`
2. Commit the generated `docs/` folder.
3. In GitHub: Settings → Pages → Deploy from branch → `main` / `docs`.
