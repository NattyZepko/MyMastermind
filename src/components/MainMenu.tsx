import { useCallback, useEffect, useRef } from 'react';
import type { GameMode, GameSettings } from '../game/config';
import {
	CODE_LENGTH_MAX,
	CODE_LENGTH_MIN,
	GUESS_LIMIT_MAX,
	GUESS_LIMIT_MIN,
	PALETTE_SIZE_MAX,
	PALETTE_SIZE_MIN,
	TIME_LIMIT_MINUTES_MAX,
	TIME_LIMIT_MINUTES_MIN,
} from '../game/config';

type MainMenuProps = {
	settings: GameSettings;
	onChange: (next: GameSettings) => void;
	onPlay: () => void;
};

function clampInt(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, Math.trunc(value)));
}

function wrapInt(value: number, min: number, max: number) {
	const range = max - min + 1;
	if (range <= 0) return min;
	const normalized = (((value - min) % range) + range) % range;
	return min + normalized;
}

function pad2(n: number) {
	return String(n).padStart(2, '0');
}

type StepperNumberInputProps = {
	value: number;
	min: number;
	max: number;
	step?: number;
	disabled?: boolean;
	wrap?: boolean;
	formatValue?: (value: number) => string;
	repeatDelayMs?: number;
	repeatIntervalMs?: number;
	ariaLabel: string;
	inputClassName: string;
	onChangeValue: (next: number) => void;
};

function StepperNumberInput({
	value,
	min,
	max,
	step = 1,
	disabled,
	wrap,
	formatValue,
	repeatDelayMs = 350,
	repeatIntervalMs = 85,
	ariaLabel,
	inputClassName,
	onChangeValue,
}: StepperNumberInputProps) {
	const canWrap = Boolean(wrap) && min < max;
	const decDisabled = Boolean(disabled) || (!canWrap && value <= min);
	const incDisabled = Boolean(disabled) || (!canWrap && value >= max);

	const valueRef = useRef(value);
	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	const onChangeValueRef = useRef(onChangeValue);
	useEffect(() => {
		onChangeValueRef.current = onChangeValue;
	}, [onChangeValue]);

	const holdRef = useRef<{
		startTimeoutId: number | null;
		repeatIntervalId: number | null;
		suppressClick: boolean;
	}>({
		startTimeoutId: null,
		repeatIntervalId: null,
		suppressClick: false,
	});

	const stopHold = useCallback(() => {
		if (holdRef.current.startTimeoutId != null) {
			window.clearTimeout(holdRef.current.startTimeoutId);
			holdRef.current.startTimeoutId = null;
		}
		if (holdRef.current.repeatIntervalId != null) {
			window.clearInterval(holdRef.current.repeatIntervalId);
			holdRef.current.repeatIntervalId = null;
		}

		if (holdRef.current.suppressClick) {
			window.setTimeout(() => {
				holdRef.current.suppressClick = false;
			}, 0);
		}
	}, []);

	useEffect(() => stopHold, [stopHold]);
	useEffect(() => {
		if (disabled) stopHold();
	}, [disabled, stopHold]);

	const applyDelta = useCallback(
		(delta: number) => {
			const current = valueRef.current;
			const nextRaw = current + delta;
			const next = wrap
				? wrapInt(nextRaw, min, max)
				: clampInt(nextRaw, min, max);
			if (next !== current) onChangeValueRef.current(next);
		},
		[wrap, min, max],
	);

	const startHold = useCallback(
		(delta: number) => {
			applyDelta(delta);
			holdRef.current.startTimeoutId = window.setTimeout(() => {
				holdRef.current.repeatIntervalId = window.setInterval(() => {
					applyDelta(delta);
				}, repeatIntervalMs);
			}, repeatDelayMs);
		},
		[applyDelta, repeatDelayMs, repeatIntervalMs],
	);

	const onIncPointerDown = useCallback(
		(e: React.PointerEvent<HTMLButtonElement>) => {
			if (incDisabled) return;
			e.preventDefault();
			holdRef.current.suppressClick = true;
			e.currentTarget.setPointerCapture?.(e.pointerId);
			startHold(step);
		},
		[incDisabled, startHold, step],
	);

	const onDecPointerDown = useCallback(
		(e: React.PointerEvent<HTMLButtonElement>) => {
			if (decDisabled) return;
			e.preventDefault();
			holdRef.current.suppressClick = true;
			e.currentTarget.setPointerCapture?.(e.pointerId);
			startHold(-step);
		},
		[decDisabled, startHold, step],
	);

	const onIncClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (incDisabled) return;
			if (holdRef.current.suppressClick) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			applyDelta(step);
		},
		[applyDelta, incDisabled, step],
	);

	const onDecClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (decDisabled) return;
			if (holdRef.current.suppressClick) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			applyDelta(-step);
		},
		[applyDelta, decDisabled, step],
	);

	const displayValue = formatValue ? formatValue(value) : String(value);

	return (
		<span className="stepper" aria-label={ariaLabel}>
			<input
				type="text"
				inputMode="none"
				className={`${inputClassName} stepperInput`}
				value={displayValue}
				disabled={disabled}
				readOnly
				aria-readonly="true"
				tabIndex={-1}
				aria-label={ariaLabel}
			/>
			<span className="stepperButtons" aria-hidden={false}>
				<button
					type="button"
					className="stepperButton stepperUp"
					onPointerDown={onIncPointerDown}
					onPointerUp={stopHold}
					onPointerCancel={stopHold}
					onLostPointerCapture={stopHold}
					onClick={onIncClick}
					disabled={incDisabled}
					aria-label={`Increase ${ariaLabel}`}
					title={`Increase ${ariaLabel}`}
				>
					▲
				</button>
				<button
					type="button"
					className="stepperButton stepperDown"
					onPointerDown={onDecPointerDown}
					onPointerUp={stopHold}
					onPointerCancel={stopHold}
					onLostPointerCapture={stopHold}
					onClick={onDecClick}
					disabled={decDisabled}
					aria-label={`Decrease ${ariaLabel}`}
					title={`Decrease ${ariaLabel}`}
				>
					▼
				</button>
			</span>
		</span>
	);
}

export function MainMenu({ settings, onChange, onPlay }: MainMenuProps) {
	function set<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
		onChange({ ...settings, [key]: value });
	}

	const timeParts = (() => {
		const totalSeconds = Math.max(
			0,
			Math.round(settings.timeLimitMinutes * 60),
		);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return { minutes, seconds };
	})();

	function setTime(minutes: number, seconds: number) {
		const m = clampInt(minutes, TIME_LIMIT_MINUTES_MIN, TIME_LIMIT_MINUTES_MAX);
		const s = m >= TIME_LIMIT_MINUTES_MAX ? 0 : clampInt(seconds, 0, 59);
		set('timeLimitMinutes', m + s / 60);
	}

	const mode = settings.mode;

	return (
		<div className="menu">
			<header className="menuHeader">
				<div>
					<h1 className="title">Mastermind</h1>
					<p className="subtitle">
						Set your difficulty, and select game mode. Press Play when ready.
					</p>
				</div>
			</header>

			<section className="panel">
				<h2 className="h2">Difficulty</h2>

				<div className="formGrid">
					<label className="field">
						<div
							className="fieldLabel"
							style={{ paddingRight: '1em', paddingLeft: '2em' }}
						>
							Colors in secret
						</div>
						<StepperNumberInput
							value={settings.codeLength}
							min={CODE_LENGTH_MIN}
							max={CODE_LENGTH_MAX}
							step={1}
							ariaLabel="Colors in secret"
							inputClassName="numberInput compact"
							onChangeValue={(v) => set('codeLength', v)}
						/>
					</label>

					<label className="field">
						<div
							className="fieldLabel"
							style={{ paddingRight: '1em', paddingLeft: '2em' }}
						>
							Palette size
						</div>
						<StepperNumberInput
							value={settings.paletteSize}
							min={PALETTE_SIZE_MIN}
							max={PALETTE_SIZE_MAX}
							step={1}
							ariaLabel="Palette size"
							inputClassName="numberInput compact"
							onChangeValue={(v) => set('paletteSize', v)}
						/>
					</label>
				</div>

				<div className="difficultyExtras">
					<label
						className="checkboxRow"
						title="If enabled, the secret may contain the same color multiple times. If disabled, the secret will use unique colors. In any case, you can always guess duplicates if you want."
					>
						<input
							type="checkbox"
							checked={settings.allowDuplicates}
							onChange={(e) => set('allowDuplicates', e.target.checked)}
						/>
						<span>Allow duplicates</span>
					</label>

					<button
						type="button"
						className="secondary"
						style={{ color: 'yellow' }}
						onClick={() => {
							onChange({
								...settings,
								codeLength: 4,
								paletteSize: 8,
								allowDuplicates: true,
							});
						}}
					>
						Recommended difficulty
					</button>
				</div>
			</section>

			<section className="panel">
				<h2 className="h2">Game mode</h2>

				<div className="radioGroup" role="radiogroup" aria-label="Game mode">
					<label
						className="radioRow"
						title="No limitations: guess as much as you want, take as much time as you want. Play until you solve the secret!"
					>
						<input
							type="radio"
							name="mode"
							checked={mode === 'zen'}
							onChange={() => set('mode', 'zen' as GameMode)}
						/>
						<span>Play Zen Mode</span>
						<span className="modeControls muted">No limitations</span>
					</label>

					<label
						className="radioRow"
						title="There's a time limit. You must solve the secret before time runs out."
					>
						<input
							type="radio"
							name="mode"
							checked={mode === 'time'}
							onChange={() => set('mode', 'time' as GameMode)}
						/>
						<span>Play Time Mode</span>
						<span className="modeControls">
							<StepperNumberInput
								value={timeParts.minutes}
								min={TIME_LIMIT_MINUTES_MIN}
								max={TIME_LIMIT_MINUTES_MAX}
								step={1}
								disabled={mode !== 'time'}
								ariaLabel="Time limit minutes"
								inputClassName="numberInput inline"
								onChangeValue={(minutes) => setTime(minutes, timeParts.seconds)}
							/>
							<span className="muted">:</span>
							<StepperNumberInput
								value={timeParts.seconds}
								min={0}
								max={59}
								step={1}
								wrap
								formatValue={pad2}
								disabled={
									mode !== 'time' || timeParts.minutes >= TIME_LIMIT_MINUTES_MAX
								}
								ariaLabel="Time limit seconds"
								inputClassName="numberInput inline"
								onChangeValue={(seconds) => setTime(timeParts.minutes, seconds)}
							/>
							<span className="muted">min:sec</span>
						</span>
					</label>

					<label
						className="radioRow"
						title="There's a limit on the number of guesses you can make. You must solve the secret before running out of guesses."
					>
						<input
							type="radio"
							name="mode"
							checked={mode === 'limited'}
							onChange={() => set('mode', 'limited' as GameMode)}
						/>
						<span>Play Limited Guesses Mode</span>
						<span className="modeControls">
							<StepperNumberInput
								value={settings.guessLimit}
								min={GUESS_LIMIT_MIN}
								max={GUESS_LIMIT_MAX}
								step={1}
								disabled={mode !== 'limited'}
								ariaLabel="Guess limit"
								inputClassName="numberInput inline"
								onChangeValue={(v) => set('guessLimit', v)}
							/>
							<span className="muted">guesses</span>
						</span>
					</label>
				</div>

				<div className="menuActions">
					<button type="button" onClick={onPlay} className="playButton">
						Play
					</button>
				</div>
			</section>
		</div>
	);
}
