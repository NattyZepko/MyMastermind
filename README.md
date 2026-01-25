# Mastermind (Vite SPA)

Client-side single page application for a Mastermind-style game using **colors**.

## Rules

- A random secret code is generated as **4 colors**.
- Colors can repeat.
- You can make unlimited guesses.
- Each guess returns:
  - **Right color, right place**
  - **Right color, wrong place**

## How to play

- Click a color in the palette to select it.
- Click the 4 empty squares to place the selected color.
- Right-click a square to clear it.
- Press **Guess** to submit.

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

## Deploy to GitHub Pages

Use GitHub Pages to serve the built output from `dist/`.

- The deployment workflow is in `.github/workflows/deploy-pages.yml`.
- In GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.

Important:

- Don’t open `dist/index.html` from the GitHub repo UI (on `github.com`). GitHub applies a strict Content Security Policy there, so scripts will be blocked and you’ll see CSP errors.
- Open the actual Pages URL shown in **Settings → Pages** (for project pages it’s typically `https://<user>.github.io/<repo>/`).
