import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const FIXED_SECRET = ['blue', 'green', 'yellow', 'orange'];
const FIXED_DAILY_SECRET = [
	'red',
	'red',
	'red',
	'red',
	'red',
	'red',
	'red',
	'red',
];

vi.mock('./mastermind', async () => {
	const actual =
		await vi.importActual<typeof import('./mastermind')>('./mastermind');
	return {
		...actual,
		generateSecret: vi.fn(() => FIXED_SECRET.slice()),
		generateSecretSeeded: vi.fn(() => FIXED_DAILY_SECRET.slice()),
	};
});

import App from './App';

async function startGame() {
	const user = (await import('@testing-library/user-event')).default.setup();
	render(<App />);
	await user.click(screen.getByRole('button', { name: /^play$/i }));
	return user;
}

describe('In-game controls (App)', () => {
	it('shows an error if placing a peg without selecting a color', async () => {
		await startGame();

		await (await import('@testing-library/user-event')).default
			.setup()
			.click(screen.getByRole('button', { name: /empty slot 1/i }));

		expect(
			screen.getByText(/pick a color from the palette first/i),
		).toBeInTheDocument();
	});

	it('selects a palette color and places it into a slot; right-click clears it', async () => {
		const user = await startGame();

		const palette = screen.getByLabelText('Color palette');
		const guessRow = screen.getByLabelText('Guess row');

		await user.click(within(palette).getByRole('button', { name: 'Red' }));
		await user.click(
			within(guessRow).getByRole('button', { name: /empty slot 1/i }),
		);
		expect(
			within(guessRow).getByRole('button', { name: 'Red' }),
		).toBeInTheDocument();

		// Right-click (context menu) clears the peg
		fireEvent.contextMenu(
			within(guessRow).getByRole('button', { name: 'Red' }),
		);
		expect(
			within(guessRow).getByRole('button', { name: /empty slot 1/i }),
		).toBeInTheDocument();
	});

	it('Clear colors empties the current guess', async () => {
		const user = await startGame();

		await user.click(screen.getByRole('button', { name: 'Red' }));
		await user.click(screen.getByRole('button', { name: /empty slot 1/i }));
		await user.click(screen.getByRole('button', { name: /empty slot 2/i }));

		await user.click(screen.getByRole('button', { name: /clear colors/i }));

		expect(
			screen.getByRole('button', { name: /empty slot 1/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /empty slot 2/i }),
		).toBeInTheDocument();
	});

	it('Submitting a filled guess adds it to history and clears the row', async () => {
		const user = await startGame();

		await user.click(screen.getByRole('button', { name: 'Red' }));
		for (let i = 1; i <= 4; i++) {
			await user.click(
				screen.getByRole('button', {
					name: new RegExp(`empty slot ${i}`, 'i'),
				}),
			);
		}

		await user.click(screen.getByRole('button', { name: /^guess$/i }));

		expect(screen.getByText(/1 total/i)).toBeInTheDocument();
		expect(screen.getByLabelText('Guess history')).toBeInTheDocument();
		expect(screen.getByLabelText('Guess 1')).toBeInTheDocument();

		// After submitting, it resets the row
		expect(
			screen.getByRole('button', { name: /empty slot 1/i }),
		).toBeInTheDocument();
	});

	it('Limited guesses mode ends the game after the guess limit is reached', async () => {
		const user = (await import('@testing-library/user-event')).default.setup();
		render(<App />);

		await user.click(
			screen.getByRole('radio', { name: /play limited guesses mode/i }),
		);
		// Reduce guess limit to 4 (minimum)
		for (let i = 0; i < 4; i++) {
			await user.click(
				screen.getByRole('button', { name: /decrease guess limit/i }),
			);
		}

		await user.click(screen.getByRole('button', { name: /^play$/i }));

		await user.click(screen.getByRole('button', { name: 'Red' }));
		for (let guess = 0; guess < 4; guess++) {
			for (let i = 1; i <= 4; i++) {
				await user.click(
					screen.getByRole('button', {
						name: new RegExp(`empty slot ${i}`, 'i'),
					}),
				);
			}
			await user.click(screen.getByRole('button', { name: /^guess$/i }));
		}

		expect(screen.getByText(/no guesses left/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /^guess$/i })).toBeDisabled();
		expect(screen.getByRole('status')).toBeInTheDocument();
		expect(screen.getByLabelText('Secret code')).toBeInTheDocument();
	});

	it('Time mode ends the game when time runs out', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

		render(<App />);

		fireEvent.click(screen.getByRole('radio', { name: /play time mode/i }));
		// Set minutes to 1 (minimum) so the test is fast
		fireEvent.click(
			screen.getByRole('button', { name: /decrease time limit minutes/i }),
		);
		fireEvent.click(
			screen.getByRole('button', { name: /decrease time limit minutes/i }),
		);

		fireEvent.click(screen.getByRole('button', { name: /^play$/i }));
		expect(screen.getByText(/time left:/i)).toBeInTheDocument();

		act(() => {
			vi.advanceTimersByTime(60_250);
		});

		expect(screen.getByText(/time's up!/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /^guess$/i })).toBeDisabled();

		// Secret reveal appears when interaction ends
		const status = screen.getByRole('status');
		expect(within(status).getByLabelText('Secret code')).toBeInTheDocument();

		vi.useRealTimers();
	});
});
