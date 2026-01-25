import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function githubPagesBase(): string {
	// Allows manual override when needed.
	const override = process.env.VITE_BASE;
	if (override) return override;

	// GitHub Actions sets this to "owner/repo".
	const repo = process.env.GITHUB_REPOSITORY?.split('/')?.[1];
	if (!repo) return '/';

	// User/Org pages repo (e.g. "nattyzepko.github.io") should use "/".
	if (repo.endsWith('.github.io')) return '/';

	// Project pages should use "/<repo>/".
	return `/${repo}/`;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [react()],
	base: mode === 'production' ? githubPagesBase() : '/',
}));
