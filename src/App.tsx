import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { PALETTE, type PaletteColor } from './game/palette';
import type { GuessResult } from './game/types';
import { generateSecret, generateSecretSeeded, scoreGuess } from './mastermind';

type Screen = 'menu' | 'game';

function App() {
	const [screen, setScreen] = useState<Screen>('menu');
	const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
	const [menuSettingsBeforeChallenge, setMenuSettingsBeforeChallenge] =
		useState<GameSettings | null>(null);
	const [isDailyChallenge, setIsDailyChallenge] = useState(false);
	const [dailySeed, setDailySeed] = useState<string | null>(null);

	const normalizedSettings = useMemo(
		() => normalizeSettings(settings),
		[settings],
	);
	const activePalette = useMemo(
		() => PALETTE.slice(0, normalizedSettings.paletteSize),
		[normalizedSettings.paletteSize],
	);
	const activePaletteById = useMemo(() => {
		return new Map<string, PaletteColor>(activePalette.map((c) => [c.id, c]));
	}, [activePalette]);

	const [secret, setSecret] = useState<string[]>([]);
	const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
	const [currentGuess, setCurrentGuess] = useState<Array<string | null>>([]);
	const [guesses, setGuesses] = useState<GuessResult[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [gameStartMs, setGameStartMs] = useState<number | null>(null);
	const [nowMs, setNowMs] = useState<number>(() => Date.now());
	const [gaveUp, setGaveUp] = useState(false);

	type TouchDragSession = {
		kind: 'pointer' | 'touch';
		id: number;
		colorId: string;
		startX: number;
		startY: number;
		x: number;
		y: number;
		started: boolean;
		overPegIndex: number | null;
	};

	const [touchDrag, setTouchDrag] = useState<TouchDragSession | null>(null);

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
		screen === 'game' && !gaveUp && !isSolved && !isTimeUp && !isOutOfGuesses;

	const isGameOver =
		screen === 'game' && (isSolved || gaveUp || isTimeUp || isOutOfGuesses);

	// On mobile Chrome, a downward swipe at scroll top can trigger pull-to-refresh.
	// That refresh resets the game, so we suppress that gesture while playing.
	const pullToRefreshTouchIdRef = useRef<number | null>(null);
	const pullToRefreshStartYRef = useRef<number | null>(null);

	useEffect(() => {
		if (screen !== 'game') return;

		function isEditableTarget(target: EventTarget | null) {
			const el = target as HTMLElement | null;
			if (!el) return false;
			const tag = el.tagName;
			return (
				tag === 'INPUT' ||
				tag === 'TEXTAREA' ||
				(el as HTMLElement).isContentEditable
			);
		}

		function onTouchStart(ev: TouchEvent) {
			if (isEditableTarget(ev.target)) {
				pullToRefreshTouchIdRef.current = null;
				pullToRefreshStartYRef.current = null;
				return;
			}
			const t = ev.touches.item(0);
			if (!t) return;
			// Only track if we're already at the top of the page.
			if (window.scrollY !== 0) {
				pullToRefreshTouchIdRef.current = null;
				pullToRefreshStartYRef.current = null;
				return;
			}
			pullToRefreshTouchIdRef.current = t.identifier;
			pullToRefreshStartYRef.current = t.clientY;
		}

		function findTouch(touches: TouchList, id: number) {
			for (let i = 0; i < touches.length; i++) {
				const t = touches.item(i);
				if (t && t.identifier === id) return t;
			}
			return null;
		}

		function onTouchMove(ev: TouchEvent) {
			const id = pullToRefreshTouchIdRef.current;
			const startY = pullToRefreshStartYRef.current;
			if (id == null || startY == null) return;
			if (window.scrollY !== 0) return;
			const t = findTouch(ev.touches, id);
			if (!t) return;
			// Only block once the user is clearly pulling down.
			if (t.clientY - startY > 6) {
				ev.preventDefault();
			}
		}

		function clear() {
			pullToRefreshTouchIdRef.current = null;
			pullToRefreshStartYRef.current = null;
		}

		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('touchend', clear);
		window.addEventListener('touchcancel', clear);
		return () => {
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', clear);
			window.removeEventListener('touchcancel', clear);
		};
	}, [screen]);

	function utcDateKey(d = new Date()) {
		return d.toISOString().slice(0, 10);
	}

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
		if (isDailyChallenge) {
			const seed = dailySeed ?? utcDateKey();
			setDailySeed(seed);
			setSecret(
				generateSecretSeeded(paletteIds, nextSettings.codeLength, seed, {
					allowDuplicates: nextSettings.allowDuplicates,
				}),
			);
		} else {
			setSecret(
				generateSecret(paletteIds, nextSettings.codeLength, {
					allowDuplicates: nextSettings.allowDuplicates,
				}),
			);
		}
		setSelectedColorId(null);
		setCurrentGuess(
			Array.from({ length: nextSettings.codeLength }, () => null),
		);
		setGuesses([]);
		setError(null);
		setGameStartMs(Date.now());
		setNowMs(Date.now());
		setGaveUp(false);
	}

	function onPlayFromMenu() {
		setMenuSettingsBeforeChallenge(null);
		const next = normalizeSettings(settings);
		setSettings(next);
		const palette = PALETTE.slice(0, next.paletteSize);
		const paletteIds = palette.map((c) => c.id);
		setSecret(
			generateSecret(paletteIds, next.codeLength, {
				allowDuplicates: next.allowDuplicates,
			}),
		);
		setIsDailyChallenge(false);
		setDailySeed(null);
		setSelectedColorId(null);
		setCurrentGuess(Array.from({ length: next.codeLength }, () => null));
		setGuesses([]);
		setError(null);
		setGameStartMs(Date.now());
		setNowMs(Date.now());
		setGaveUp(false);
		setScreen('game');
	}

	function onDailyChallengeFromMenu() {
		setMenuSettingsBeforeChallenge(settings);
		const seed = utcDateKey();
		const next: GameSettings = {
			...settings,
			mode: 'zen',
			codeLength: 8,
			paletteSize: 14,
			allowDuplicates: true,
		};
		const normalized = normalizeSettings(next);
		setSettings(normalized);
		const palette = PALETTE.slice(0, normalized.paletteSize);
		const paletteIds = palette.map((c) => c.id);
		setSecret(
			generateSecretSeeded(paletteIds, normalized.codeLength, seed, {
				allowDuplicates: true,
			}),
		);
		setIsDailyChallenge(true);
		setDailySeed(seed);
		setSelectedColorId(null);
		setCurrentGuess(Array.from({ length: normalized.codeLength }, () => null));
		setGuesses([]);
		setError(null);
		setGameStartMs(Date.now());
		setNowMs(Date.now());
		setGaveUp(false);
		setScreen('game');
	}

	const giveUp = useCallback(() => {
		if (screen !== 'game') return;
		if (!canInteract) return;
		if (isDailyChallenge) return;
		setError(null);
		setGaveUp(true);
	}, [canInteract, isDailyChallenge, screen]);

	const copyDailyResults = useCallback(async () => {
		if (!isDailyChallenge) return;
		if (!isSolved || solvedAt === null) return;
		const text = `I've beaten today's challenge at https://nattymastermind.com/ in ${solvedAt} guesses! See if you can beat my score!`;
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const el = document.createElement('textarea');
			el.value = text;
			el.setAttribute('readonly', '');
			el.style.position = 'fixed';
			el.style.left = '-9999px';
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		}
	}, [isDailyChallenge, isSolved, solvedAt]);

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

	const setPegColor = useCallback(
		(index: number, colorId: string) => {
			if (!canInteract) return;
			setCurrentGuess((prev) => {
				const next = prev.slice();
				next[index] = colorId;
				return next;
			});
			setError(null);
		},
		[canInteract],
	);

	const startTouchDrag = useCallback(
		(
			colorId: string,
			start: {
				kind: 'pointer' | 'touch';
				id: number;
				x: number;
				y: number;
			},
		) => {
			if (!canInteract) return;
			setTouchDrag({
				kind: start.kind,
				id: start.id,
				colorId,
				startX: start.x,
				startY: start.y,
				x: start.x,
				y: start.y,
				started: false,
				overPegIndex: null,
			});
		},
		[canInteract],
	);

	const startTouchDragFromPeg = useCallback(
		(
			colorId: string,
			start: {
				kind: 'pointer' | 'touch';
				id: number;
				x: number;
				y: number;
			},
		) => {
			if (!canInteract) return;
			setSelectedColorId(colorId);
			setError(null);
			startTouchDrag(colorId, start);
		},
		[canInteract, startTouchDrag],
	);

	useEffect(() => {
		if (!touchDrag) return;
		const sessionKind = touchDrag.kind;
		const sessionId = touchDrag.id;
		const startX = touchDrag.startX;
		const startY = touchDrag.startY;

		const thresholdSq = 8 * 8;

		function findPegIndexAtPoint(x: number, y: number) {
			const el = document.elementFromPoint(x, y) as HTMLElement | null;
			const peg = el?.closest?.('button[data-peg-index]') as HTMLElement | null;
			const raw = peg?.getAttribute('data-peg-index');
			if (raw == null) return null;
			const parsed = Number(raw);
			if (!Number.isInteger(parsed)) return null;
			if (parsed < 0 || parsed >= normalizedSettings.codeLength) return null;
			return parsed;
		}

		function update(x: number, y: number) {
			setTouchDrag((prev) => {
				if (!prev) return prev;
				const dx = x - prev.startX;
				const dy = y - prev.startY;
				const started = prev.started || dx * dx + dy * dy >= thresholdSq;
				const overPegIndex = started ? findPegIndexAtPoint(x, y) : null;
				return {
					...prev,
					x,
					y,
					started,
					overPegIndex,
				};
			});
		}

		function finish() {
			setTouchDrag((prev) => {
				if (prev?.started && prev.overPegIndex !== null) {
					setPegColor(prev.overPegIndex, prev.colorId);
				}
				return null;
			});
		}

		if (sessionKind === 'pointer') {
			function onPointerMove(ev: PointerEvent) {
				if (ev.pointerId !== sessionId) return;
				const dx0 = ev.clientX - startX;
				const dy0 = ev.clientY - startY;
				const willStart = dx0 * dx0 + dy0 * dy0 >= thresholdSq;
				update(ev.clientX, ev.clientY);
				if (willStart) ev.preventDefault();
			}

			function finishPointer(ev: PointerEvent) {
				if (ev.pointerId !== sessionId) return;
				finish();
			}

			window.addEventListener('pointermove', onPointerMove, { passive: false });
			window.addEventListener('pointerup', finishPointer);
			window.addEventListener('pointercancel', finishPointer);
			return () => {
				window.removeEventListener('pointermove', onPointerMove);
				window.removeEventListener('pointerup', finishPointer);
				window.removeEventListener('pointercancel', finishPointer);
			};
		}

		function findTouch(touches: TouchList, identifier: number): Touch | null {
			for (let i = 0; i < touches.length; i++) {
				const t = touches.item(i);
				if (t && t.identifier === identifier) return t;
			}
			return null;
		}

		function onTouchMove(ev: TouchEvent) {
			const t = findTouch(ev.touches, sessionId);
			if (!t) return;
			const dx0 = t.clientX - startX;
			const dy0 = t.clientY - startY;
			const willStart = dx0 * dx0 + dy0 * dy0 >= thresholdSq;
			update(t.clientX, t.clientY);
			if (willStart) ev.preventDefault();
		}

		function finishTouch(ev: TouchEvent) {
			const ended = findTouch(ev.changedTouches, sessionId);
			if (!ended) return;
			finish();
		}

		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('touchend', finishTouch);
		window.addEventListener('touchcancel', finishTouch);
		return () => {
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', finishTouch);
			window.removeEventListener('touchcancel', finishTouch);
		};
	}, [normalizedSettings.codeLength, setPegColor, touchDrag]);

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
		if (gaveUp) return 'Game over... This was the secret:';
		if (isSolved) {
			if (isDailyChallenge && solvedAt !== null) {
				return `Congratulations — you beat today's Daily Challenge in ${solvedAt} guesses!`;
			}
			return `Solved in ${solvedAt} guess${solvedAt === 1 ? '' : 'es'}.`;
		}
		if (isTimeUp) return "Time's up! The secret was:";
		if (isOutOfGuesses) return 'No guesses left! The secret was:';
		return null;
	}, [
		gaveUp,
		isDailyChallenge,
		isOutOfGuesses,
		isSolved,
		isTimeUp,
		screen,
		solvedAt,
	]);

	if (screen === 'menu') {
		return (
			<MainMenu
				settings={settings}
				onChange={(next) => setSettings(next)}
				onPlay={onPlayFromMenu}
				onDailyChallenge={onDailyChallengeFromMenu}
			/>
		);
	}

	return (
		<div
			className={`app${isDailyChallenge ? ' dailyChallenge' : ''}${touchDrag?.started ? ' touchDragging' : ''}`}
			style={cursor ? { cursor } : undefined}
		>
			{touchDrag?.started ? (
				<div
					className="touchDragGhost"
					aria-hidden="true"
					style={{
						left: touchDrag.x,
						top: touchDrag.y,
						background:
							activePaletteById.get(touchDrag.colorId)?.hex ?? 'transparent',
					}}
				/>
			) : null}
			{screen === 'game' && isSolved ? <ConfettiOverlay /> : null}
			<Header
				codeLength={normalizedSettings.codeLength}
				onNewGame={isDailyChallenge ? undefined : startNewGame}
				onBackToMenu={() => {
					setScreen('menu');
					if (isDailyChallenge && menuSettingsBeforeChallenge) {
						setSettings(menuSettingsBeforeChallenge);
						setMenuSettingsBeforeChallenge(null);
					}
					setIsDailyChallenge(false);
					setDailySeed(null);
					setGaveUp(false);
				}}
				showNewGame={!isDailyChallenge}
				pulseNewGame={!isDailyChallenge && isGameOver}
				pulseMenu={isDailyChallenge && isGameOver}
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
				canInteract={canInteract}
				onSelectColor={(colorId) => {
					setSelectedColorId(colorId);
					setError(null);
				}}
				onStartTouchDrag={startTouchDrag}
				suppressClick={Boolean(touchDrag?.started)}
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
				showCopyResults={isDailyChallenge && isSolved}
				onCopyResults={() => void copyDailyResults()}
				onClearCurrentGuess={clearCurrentGuess}
				onSubmitGuess={submitGuess}
				onSetPeg={setPeg}
				onSetPegColor={setPegColor}
				onStartTouchDrag={startTouchDragFromPeg}
				suppressClick={Boolean(touchDrag?.started)}
				externalDragOverIndex={
					touchDrag?.started ? touchDrag.overPegIndex : null
				}
				onClearPeg={clearPeg}
			/>

			<GuessHistory
				guesses={guesses}
				paletteById={activePaletteById}
				canInteract={canInteract}
				onSelectGuess={(guess) => {
					if (!canInteract) return;
					setCurrentGuess(guess.slice(0, normalizedSettings.codeLength));
					setError(null);
				}}
			/>

			<div className="gameActions">
				{!isDailyChallenge ? (
					<button
						type="button"
						className="giveUpButton"
						onClick={giveUp}
						disabled={!canInteract}
						title="End the game and reveal the secret"
					>
						Give up
					</button>
				) : null}
			</div>
		</div>
	);
}

export default App;
