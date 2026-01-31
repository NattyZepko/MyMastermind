import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GameSettings } from '../game/config';
import { MainMenu } from './MainMenu';

function renderMainMenu(initialSettings: GameSettings) {
	let settings = initialSettings;

	const onPlay = vi.fn();
	const onDailyChallenge = vi.fn();

	const Wrapper = (props: { settings: GameSettings }) => (
		<MainMenu
			settings={props.settings}
			onChange={(next) => {
				settings = next;
				rerender(<Wrapper settings={settings} />);
			}}
			onPlay={onPlay}
			onDailyChallenge={onDailyChallenge}
		/>
	);

	const { rerender } = render(<Wrapper settings={settings} />);
	return {
		onPlay,
		onDailyChallenge,
		getSettings: () => settings,
	};
}

describe('MainMenu controls', () => {
	it('Play button triggers onPlay', async () => {
		const user = (await import('@testing-library/user-event')).default.setup();
		const { onPlay } = renderMainMenu({
			codeLength: 4,
			paletteSize: 8,
			allowDuplicates: true,
			showPegNumbers: false,
			paletteOverrides: {},
			mode: 'zen',
			timeLimitMinutes: 3,
			guessLimit: 8,
		});

		await user.click(screen.getByRole('button', { name: /^play$/i }));
		expect(onPlay).toHaveBeenCalledTimes(1);
	});

	it('Daily challenge button triggers onDailyChallenge', async () => {
		const user = (await import('@testing-library/user-event')).default.setup();
		const { onDailyChallenge } = renderMainMenu({
			codeLength: 4,
			paletteSize: 8,
			allowDuplicates: true,
			showPegNumbers: false,
			paletteOverrides: {},
			mode: 'zen',
			timeLimitMinutes: 3,
			guessLimit: 8,
		});

		await user.click(screen.getByRole('button', { name: /daily challenge/i }));
		expect(onDailyChallenge).toHaveBeenCalledTimes(1);
	});

	it('Time seconds displays 2 digits (00)', () => {
		renderMainMenu({
			codeLength: 4,
			paletteSize: 8,
			allowDuplicates: true,
			showPegNumbers: false,
			paletteOverrides: {},
			mode: 'time',
			timeLimitMinutes: 1, // 1:00
			guessLimit: 8,
		});

		const seconds = screen.getByRole('textbox', {
			name: 'Time limit seconds',
		}) as HTMLInputElement;
		expect(seconds).toHaveValue('00');
	});

	it('Time seconds wraps 59 -> 00 on increment', async () => {
		const user = (await import('@testing-library/user-event')).default.setup();
		const { getSettings } = renderMainMenu({
			codeLength: 4,
			paletteSize: 8,
			allowDuplicates: true,
			showPegNumbers: false,
			paletteOverrides: {},
			mode: 'time',
			timeLimitMinutes: 1 + 59 / 60, // 1:59
			guessLimit: 8,
		});

		await user.click(
			screen.getByRole('button', { name: /increase time limit seconds/i }),
		);

		const seconds = screen.getByRole('textbox', {
			name: 'Time limit seconds',
		}) as HTMLInputElement;
		expect(seconds).toHaveValue('00');
		// also verifies the controlled value changed
		expect(getSettings().timeLimitMinutes).toBeCloseTo(1, 5);
	});

	it('Time seconds wraps 00 -> 59 on decrement', async () => {
		const user = (await import('@testing-library/user-event')).default.setup();
		const { getSettings } = renderMainMenu({
			codeLength: 4,
			paletteSize: 8,
			allowDuplicates: true,
			showPegNumbers: false,
			paletteOverrides: {},
			mode: 'time',
			timeLimitMinutes: 1, // 1:00
			guessLimit: 8,
		});

		await user.click(
			screen.getByRole('button', { name: /decrease time limit seconds/i }),
		);

		const seconds = screen.getByRole('textbox', {
			name: 'Time limit seconds',
		}) as HTMLInputElement;
		expect(seconds).toHaveValue('59');
		expect(getSettings().timeLimitMinutes).toBeCloseTo(1 + 59 / 60, 5);
	});

	it('Long-press increases a stepper multiple times', async () => {
		vi.useFakeTimers();
		const { getSettings } = renderMainMenu({
			codeLength: 3,
			paletteSize: 8,
			allowDuplicates: true,
			showPegNumbers: false,
			paletteOverrides: {},
			mode: 'zen',
			timeLimitMinutes: 3,
			guessLimit: 8,
		});

		const inc = screen.getByRole('button', {
			name: /increase colors in secret/i,
		});

		fireEvent.pointerDown(inc, { pointerId: 1 });
		act(() => {
			vi.advanceTimersByTime(700);
		});
		fireEvent.pointerUp(inc, { pointerId: 1 });
		fireEvent.lostPointerCapture(inc, { pointerId: 1 });
		act(() => {
			vi.runOnlyPendingTimers();
		});

		// After holding, it should have incremented more than once (capped by max).
		expect(getSettings().codeLength).toBeGreaterThan(4);
		expect(getSettings().codeLength).toBeLessThanOrEqual(6);

		vi.useRealTimers();
	});
});
