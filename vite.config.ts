import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [react()],
	// Relative base makes the build portable across:
	// - root domains (e.g. https://nattymastermind.com/)
	// - subpaths (e.g. https://<user>.github.io/<repo>/)
	base: mode === 'production' ? './' : '/',
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		css: true,
	},
}));
