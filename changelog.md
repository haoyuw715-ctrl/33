# Changelog (Learning Notes)

This is not a release log. It’s a learning-focused record of changes made during the course so you can see *what* was changed and *why*. You started this course with zero coding experience, so the notes are written to help you build intuition and confidence.

## ✅ What you already did well
- **Built a full game loop** with turns, cards, and win conditions.
- **Shipped a playable UI** with clear buttons, visual states, and feedback.
- **Used AI as optional flavor**, which is a good beginner-level scope decision.

## 1) BYOK (Bring Your Own Key) AI flow
**What changed:** AI keys are no longer injected at build time. The game reads keys only from the UI and stores them in `localStorage`. The AI still works without a key using a fallback.

**Why this matters:**
- A build-time key gets baked into the website and can leak publicly.
- For student demos, BYOK is safer and more realistic.

**What you can learn:**
- **User input should be the source of secrets** on the client.
- If a feature is optional, design it to **degrade gracefully**.

## 2) GitHub Pages readiness
**What changed:** The Vite build output goes to `docs/` with a relative base path so the game runs at `https://user.github.io/repo/`.

**Why this matters:**
- GitHub Pages project sites live under a subpath (not root).
- Assets need a relative base to load correctly.

**What you can learn:**
- Deployment is not just “push to GitHub”—**paths and output folders matter**.

## 3) Gameplay completeness and escape path
**What changed:** Players can always exit to the main menu. The game waits for user input after victory instead of auto-advancing.

**Why this matters:**
- A playable demo should never trap the player.
- Users need a clear way to reset or exit.

**What you can learn:**
- Always give players an **escape hatch**.
- It’s okay to keep controls simple as long as they are **reliable**.

## 4) Setup modal and naming
**What changed:** Choosing a mode now opens a setup modal to name both players. Names are remembered so players don’t retype them each game.

**Why this matters:**
- Personalization makes the game feel real.
- Persistent names reduce friction in demos.

**What you can learn:**
- Small UX improvements (like saved names) create **big perceived polish**.

## 5) Leaderboard and persistence
**What changed:** A simple leaderboard shows real players only and grows over time. It is stored locally in the browser.

**Why this matters:**
- It gives a sense of progress and ownership.
- Persistence is a key “real app” concept.

**What you can learn:**
- You can build useful state with just `localStorage`—no server required.

## 6) Layout and scrolling fix
**What changed:** The battle log now scrolls inside its own panel instead of expanding the entire page.

**Why this matters:**
- Long logs shouldn’t break the layout.
- Separating scroll areas avoids UI glitches.

**What you can learn:**
- UI bugs often come from **layout constraints**, not just code logic.

## Constraints from the course sandbox (not your fault)
You were working in a limited sandbox, so some “nice to have” improvements were intentionally skipped:
- No server-side logic or database.
- No advanced build pipelines or deployment automation.
- Limited ability to fully customize infrastructure.

These weren’t mistakes—they were part of the learning scope.

## What to try next (optional)
- Add a simple **settings screen** (sound, theme, speed).
- Add **more card types** with clear tooltips.
- Try a **small refactor**: move game logic into a separate file.

---

This changelog is meant to show that you can take a project from prototype to demo-ready. The goal isn’t perfection—it's learning how to finish.
