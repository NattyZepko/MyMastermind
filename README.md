# Mastermind (Vite + React + TypeScript)

Client-side single page application for a Mastermind-style game using **colors**.

<img width="1085" height="861" alt="image" src="https://github.com/user-attachments/assets/09a8b746-8053-4321-b6d5-0a909037720b" />


## Key files (start here)

These are the most important files to understand the project quickly:

- App entry point (mounts React): https://github.com/NattyZepko/MyMastermind/blob/main/src/main.tsx
- App state + game flow (menu → game, input handling, limits, submit): https://github.com/NattyZepko/MyMastermind/blob/main/src/App.tsx
- Core game logic (secret generation + scoring): https://github.com/NattyZepko/MyMastermind/blob/main/src/mastermind.ts

- Settings + game modes (defaults, clamping, time formatting): https://github.com/NattyZepko/MyMastermind/blob/main/src/game/config.ts
- Shared types for guesses/results: https://github.com/NattyZepko/MyMastermind/blob/main/src/game/types.ts

- Palette definitions (the available colors): https://github.com/NattyZepko/MyMastermind/blob/main/src/game/palette.ts
- Cursor helper (shows a colored cursor when a color is selected): https://github.com/NattyZepko/MyMastermind/blob/main/src/game/cursor.ts

- Main menu UI (difficulty + mode selection): https://github.com/NattyZepko/MyMastermind/blob/main/src/components/MainMenu.tsx
- Guess input row UI (placing/clearing pegs, submit): https://github.com/NattyZepko/MyMastermind/blob/main/src/components/GuessPanel.tsx
- Guess history UI (previous guesses + feedback): https://github.com/NattyZepko/MyMastermind/blob/main/src/components/GuessHistory.tsx

## Tech stack

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/en)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=0B1F2A)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org)

## Features

- Configurable difficulty (code length, palette size, duplicates)
- Multiple modes:
  - **Zen** (no limits)
  - **Time** (solve before the timer runs out)
  - **Limited guesses** (solve before running out of guesses)
- Mouse-friendly controls + keyboard submit (**Enter**)
- History of guesses + feedback badges

## Overall system design

At a high level, the app is a single React tree that keeps the entire game state in memory. The UI updates are driven by React state, and the “game logic” (secret generation + scoring) is pure TypeScript.

### Data flow

1. **Start game** → generate a new secret based on the current settings.
2. **Player builds a guess** by selecting a palette color and placing it into slots.
3. **Submit guess** → score the guess against the secret.
4. **Render feedback** → show counts for:
   - right color + right place
   - right color + wrong place
5. Repeat until solved, or a mode limit ends the game.

### Code map (where things live)

- `src/App.tsx`: top-level state machine (menu vs game), state storage, timing/limits, submit handler.
- `src/mastermind.ts`:
  - `generateSecret(...)` uses the Web Crypto API for randomness.
  - `scoreGuess(secret, guess)` calculates the two feedback counts.
- `src/game/config.ts`: settings types, defaults, clamping/normalization, clock formatting.
- `src/game/palette.ts`: color palette definitions.
- `src/components/*`: UI components (menu, palette, guess row, history, header, confetti overlay).

## How the game works

### Rules

- The game generates a hidden **secret code** (a sequence of colors).
- You choose the difficulty on the main menu:
  - **Colors in secret** = code length (min 3, max 6)
  - **Palette size** = number of available colors (min 6, max 14)
  - **Allow duplicates** = whether the secret may repeat colors
- You can guess duplicates even if the secret is unique.

### Making a guess

- Click a color in the palette to select it.
- Click a slot in the guess row to place the selected color.
- Right-click a slot to clear it.
- Press **Guess** (or **Enter**) to submit.

### Feedback (scoring)

Each submitted guess returns two numbers:

- **Right color, right place**: how many positions match exactly.
- **Right color, wrong place**: how many additional pegs match in color after accounting for exact matches (duplicates are handled correctly).

You solve the puzzle when **right color, right place = code length**.

### Modes

- **Zen**: no limits; play until solved.
- **Time**: solve before time runs out.
- **Limited guesses**: solve before you run out of guesses.

<img width="1059" height="869" alt="image" src="https://github.com/user-attachments/assets/71e6cbcd-97cb-4cd0-9dd2-01c8f628e9ec" />


## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Sources / references

These are the main references used while building this project:

- Mastermind rules (classic board game rules; implemented as “exact matches” and “color-only matches”)
- React documentation: https://react.dev
- Vite documentation: https://vitejs.dev
- TypeScript documentation: https://www.typescriptlang.org
- Web Crypto API (used for randomness): https://developer.mozilla.org/docs/Web/API/Web_Crypto_API

Assets:

- Custom favicon/logo is an SVG in `public/favicon.svg`.
