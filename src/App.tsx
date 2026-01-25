import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { ConfettiOverlay } from './components/ConfettiOverlay';
import { GuessHistory } from './components/GuessHistory';
import { GuessPanel } from './components/GuessPanel';
import { Header } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { PalettePanel } from './components/PalettePanel';
import {
	DEFAULT_SETTINGS,
	formatClock,
	normalizeSettings,
	type GameSettings,
} from './game/config';
import { cssCursorFor } from './game/cursor';
import { PALETTE } from './game/palette';
import type { GuessResult } from './game/types';
import { generateSecret, scoreGuess } from './mastermind';

type Screen = 'menu' | 'game';

function App() {
	const [screen, setScreen] = useState<Screen>('menu');
	const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

	const normalizedSettings = useMemo(
		() => normalizeSettings(settings),
		[settings],
	);
	const activePalette = useMemo(
		() => PALETTE.slice(0, normalizedSettings.paletteSize),
		[normalizedSettings.paletteSize],
	);
	const activePaletteById = useMemo(
		() => new Map(activePalette.map((c) => [c.id, c] as const)),
		[activePalette],
	);

	const [secret, setSecret] = useState<string[]>([]);
	const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
	const [currentGuess, setCurrentGuess] = useState<Array<string | null>>(() =>
		Array.from({ length: normalizedSettings.codeLength }, () => null),
	);
	const [guesses, setGuesses] = useState<GuessResult[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [gameStartMs, setGameStartMs] = useState<number | null>(null);
	const [nowMs, setNowMs] = useState<number>(() => Date.now());

	const solvedAt = useMemo(() => {
		const index = guesses.findIndex(
			(g) => g.correctPlace === normalizedSettings.codeLength,
		);
		return index === -1 ? null : index + 1;
	}, [guesses, normalizedSettings.codeLength]);

	const isSolved = solvedAt !== null;
	const selectedColor = selectedColorId
		? activePaletteById.get(selectedColorId)
		: null;

	const cursor = useMemo(() => {
		if (!selectedColor) return undefined;
		return cssCursorFor(selectedColor.hex);
	}, [selectedColor]);

	const elapsedSeconds = useMemo(() => {
		if (!gameStartMs) return 0;
		return Math.max(0, (nowMs - gameStartMs) / 1000);
	}, [gameStartMs, nowMs]);

	const timeLimitSeconds = normalizedSettings.timeLimitMinutes * 60;
	const timeLeftSeconds = useMemo(() => {
		if (!gameStartMs) return timeLimitSeconds;
		return Math.ceil(timeLimitSeconds - elapsedSeconds);
	}, [elapsedSeconds, gameStartMs, timeLimitSeconds]);

	const isTimeUp =
		screen === 'game' &&
		normalizedSettings.mode === 'time' &&
		!isSolved &&
		gameStartMs !== null &&
		timeLeftSeconds <= 0;

	const guessesLeft =
		normalizedSettings.mode === 'limited'
			? normalizedSettings.guessLimit - guesses.length
			: null;

	const isOutOfGuesses =
		screen === 'game' &&
		normalizedSettings.mode === 'limited' &&
		!isSolved &&
		guessesLeft !== null &&
		guessesLeft <= 0;

	const canInteract =
		screen === 'game' && !isSolved && !isTimeUp && !isOutOfGuesses;

	useEffect(() => {
		if (screen !== 'game') return;
		if (!canInteract) return;
		const handle = setInterval(() => setNowMs(Date.now()), 250);
		return () => clearInterval(handle);
	}, [canInteract, screen]);

	function startNewGame() {
		const nextSettings = normalizeSettings(settings);
		setSettings(nextSettings);
		const palette = PALETTE.slice(0, nextSettings.paletteSize);
		const paletteIds = palette.map((c) => c.id);
		setSecret(
			generateSecret(paletteIds, nextSettings.codeLength, {
				allowDuplicates: nextSettings.allowDuplicates,
			}),
		);
		setSelectedColorId(null);
		setCurrentGuess(
			Array.from({ length: nextSettings.codeLength }, () => null),
		);
		setGuesses([]);
		setError(null);
		setGameStartMs(Date.now());
		setNowMs(Date.now());
	}

	function onPlayFromMenu() {
		const next = normalizeSettings(settings);
		setSettings(next);
		const palette = PALETTE.slice(0, next.paletteSize);
		const paletteIds = palette.map((c) => c.id);
		setSecret(
			generateSecret(paletteIds, next.codeLength, {
				allowDuplicates: next.allowDuplicates,
			}),
		);
		setSelectedColorId(null);
		setCurrentGuess(Array.from({ length: next.codeLength }, () => null));
		setGuesses([]);
		setError(null);
		setGameStartMs(Date.now());
		setNowMs(Date.now());
		setScreen('game');
	}

	function clearCurrentGuess() {
		setCurrentGuess(
			Array.from({ length: normalizedSettings.codeLength }, () => null),
		);
		setError(null);
	}

	function setPeg(index: number) {
		if (!canInteract) return;
		if (!selectedColorId) {
			setError('Pick a color from the palette first.');
			return;
		}
		setCurrentGuess((prev) => {
			const next = prev.slice();
			next[index] = selectedColorId;
			return next;
		});
		setError(null);
	}

	function clearPeg(index: number) {
		if (!canInteract) return;
		setCurrentGuess((prev) => {
			const next = prev.slice();
			next[index] = null;
			return next;
		});
		setError(null);
	}

	const submitGuess = useCallback(() => {
		if (!canInteract) return;

		if (currentGuess.some((c) => c === null)) {
			setError(
				`Fill all ${normalizedSettings.codeLength} slots before guessing.`,
			);
			return;
		}

		const guess = currentGuess as string[];
		const { correctPlace, correctColorWrongPlace } = scoreGuess(secret, guess);

		setGuesses((prev) => [
			...prev,
			{
				id: prev.length + 1,
				guess: guess.slice(),
				correctPlace,
				correctColorWrongPlace,
			},
		]);

		setCurrentGuess(
			Array.from({ length: normalizedSettings.codeLength }, () => null),
		);
		setError(null);
	}, [canInteract, currentGuess, normalizedSettings.codeLength, secret]);

	useEffect(() => {
		if (screen !== 'game') return;
		if (!canInteract) return;

		function onKeyDown(e: KeyboardEvent) {
			if (e.key !== 'Enter') return;
			const target = e.target as HTMLElement | null;
			const tag = target?.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA') return;
			if (target && (target as HTMLElement).isContentEditable) return;
			e.preventDefault();
			submitGuess();
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [canInteract, screen, submitGuess]);

	const timerText = useMemo(() => {
		if (screen !== 'game') return null;
		const stoppedSeconds = isSolved ? elapsedSeconds : elapsedSeconds;
		if (normalizedSettings.mode === 'time') {
			const t = isSolved
				? Math.max(0, timeLeftSeconds)
				: Math.max(0, timeLeftSeconds);
			return `Time left: ${formatClock(t)}`;
		}
		return `Time: ${formatClock(stoppedSeconds)}`;
	}, [
		elapsedSeconds,
		isSolved,
		normalizedSettings.mode,
		screen,
		timeLeftSeconds,
	]);

	const guessesLeftText = useMemo(() => {
		if (screen !== 'game') return null;
		if (normalizedSettings.mode !== 'limited' || guessesLeft === null)
			return null;
		return `Guesses left: ${Math.max(0, guessesLeft)}`;
	}, [guessesLeft, normalizedSettings.mode, screen]);

	const statusMessage = useMemo(() => {
		if (screen !== 'game') return null;
		if (isSolved)
			return `Solved in ${solvedAt} guess${solvedAt === 1 ? '' : 'es'}.`;
		if (isTimeUp) return "Time's up! The secret was:";
		if (isOutOfGuesses) return 'No guesses left! The secret was:';
		return null;
	}, [isOutOfGuesses, isSolved, isTimeUp, screen, solvedAt]);

	if (screen === 'menu') {
		return (
			<MainMenu
				settings={settings}
				onChange={(next) => setSettings(next)}
				onPlay={onPlayFromMenu}
			/>
		);
	}

	return (
		<div className="app" style={cursor ? { cursor } : undefined}>
			{screen === 'game' && isSolved ? <ConfettiOverlay /> : null}
			<Header
				codeLength={normalizedSettings.codeLength}
				onNewGame={startNewGame}
				onBackToMenu={() => setScreen('menu')}
				subtitle={`Mode: ${
					normalizedSettings.mode === 'zen'
						? 'Zen'
						: normalizedSettings.mode === 'time'
							? `On time (${formatClock(normalizedSettings.timeLimitMinutes * 60)})`
							: `Limited guesses (${normalizedSettings.guessLimit})`
				}`}
			/>

			<PalettePanel
				palette={activePalette}
				selectedColorId={selectedColorId}
				onSelectColor={(colorId) => {
					setSelectedColorId(colorId);
					setError(null);
				}}
			/>

			<GuessPanel
				codeLength={normalizedSettings.codeLength}
				paletteById={activePaletteById}
				currentGuess={currentGuess}
				canInteract={canInteract}
				error={error}
				statusMessage={statusMessage}
				timerText={timerText}
				guessesLeftText={guessesLeftText}
				secret={secret}
				onClearCurrentGuess={clearCurrentGuess}
				onSubmitGuess={submitGuess}
				onSetPeg={setPeg}
				onClearPeg={clearPeg}
			/>

			<GuessHistory guesses={guesses} paletteById={activePaletteById} />
		</div>
	);
}

export default App;
