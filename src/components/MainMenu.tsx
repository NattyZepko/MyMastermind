import { useCallback, useEffect, useRef, useState } from 'react';
import demoGif from '../assets/demo.gif';
import type { GameMode, GameSettings } from '../game/config';
import {
	CODE_LENGTH_MIN,
	GUESS_LIMIT_MAX,
	GUESS_LIMIT_MIN,
	PALETTE_SIZE_MAX,
	PALETTE_SIZE_MIN,
	TIME_LIMIT_MINUTES_MAX,
	TIME_LIMIT_MINUTES_MIN,
} from '../game/config';
import { PALETTE } from '../game/palette';
import { RainbowTitle } from './RainbowTitle';

const MAIN_MENU_CODE_LENGTH_MAX = 6;

type MainMenuProps = {
	settings: GameSettings;
	onChange: (next: GameSettings) => void;
	onPlay: () => void;
	onDailyChallenge: () => void;
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

function normalizeHexColor(input: string): string | null {
	const s = input.trim();
	if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
	if (/^#[0-9a-fA-F]{3}$/.test(s)) {
		const r = s[1];
		const g = s[2];
		const b = s[3];
		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
	}
	return null;
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

export function MainMenu({
	settings,
	onChange,
	onPlay,
	onDailyChallenge,
}: MainMenuProps) {
	const [rulesOpen, setRulesOpen] = useState(false);
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [paletteEditorOpen, setPaletteEditorOpen] = useState(false);

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
					<h1 className="title titleGlow">
						<RainbowTitle text="Natty Mastermind" />
					</h1>
					<p className="subtitle">
						Set your difficulty, and select game mode. Press Play when ready.
					</p>
					<p className="muted" style={{ marginTop: '0.35rem' }}>
						<a href="/controls.html">Controls & gestures</a>
						<span aria-hidden="true"> · </span>
						<a href="/how-to-play.html">How to play</a>
						<span aria-hidden="true"> · </span>
						<a href="/qa.html">Q&amp;A</a>
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
							max={
								settings.allowDuplicates
									? MAIN_MENU_CODE_LENGTH_MAX
									: Math.min(MAIN_MENU_CODE_LENGTH_MAX, settings.paletteSize)
							}
							step={1}
							ariaLabel="Colors in secret"
							inputClassName="numberInput compact"
							onChangeValue={(v) =>
								set(
									'codeLength',
									clampInt(v, CODE_LENGTH_MIN, MAIN_MENU_CODE_LENGTH_MAX),
								)
							}
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

				<div className="modeFooter">
					<button
						type="button"
						onClick={onDailyChallenge}
						className="dailyChallengeButton"
						title="Start today's Daily Challenge"
					>
						Daily challenge
					</button>
					<div className="menuActions">
						<button type="button" onClick={onPlay} className="playButton">
							Play
						</button>
					</div>
				</div>
			</section>

			<section className="panel gameRules advancedSettings">
				<button
					type="button"
					className="rulesTitleRow"
					onClick={() => setAdvancedOpen((open) => !open)}
					aria-expanded={advancedOpen}
					aria-controls="advancedSettingsBody"
					title={
						advancedOpen
							? 'Hide appearance settings'
							: 'Show appearance settings'
					}
				>
					<div className="rulesLogo" aria-hidden="true">
						<svg
							viewBox="0 0 24 24"
							role="img"
							focusable="false"
							aria-label="Advanced"
						>
							<path
								fill="currentColor"
								d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.12.52-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.82 14.5a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.41 1.05.73 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.22 1.12-.52 1.63-.94l2.39.96c.24.1.51.01.64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.56ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
							/>
						</svg>
					</div>
					<h2 className="h2">Appearance settings</h2>
					<span className="rulesChevron" aria-hidden="true">
						▼
					</span>
				</button>
				<div
					id="advancedSettingsBody"
					className="rulesBody"
					hidden={!advancedOpen}
				>
					<label
						className="checkboxRow"
						title="Adds a number label inside each colored peg (1..palette size) to help distinguish colors."
					>
						<input
							type="checkbox"
							checked={settings.showPegNumbers}
							onChange={(e) => set('showPegNumbers', e.target.checked)}
						/>
						<span>
							Show numbers <strong>(Color Blind Assist)</strong>
						</span>
					</label>
					<p className="muted" style={{ margin: '0.5rem 0 0' }}>
						Shows numbers inside the colored pegs in palette.
					</p>

					<hr style={{ opacity: 0.2, margin: '1rem 0' }} />

					<button
						type="button"
						className="rulesTitleRow"
						onClick={() => setPaletteEditorOpen((open) => !open)}
						aria-expanded={paletteEditorOpen}
						aria-controls="advancedPaletteBody"
						title={
							paletteEditorOpen ? 'Hide palette editor' : 'Show palette editor'
						}
					>
						<h3 className="h2" style={{ margin: 0 }}>
							Customize palette colors
						</h3>
						<span className="rulesChevron" aria-hidden="true">
							▼
						</span>
					</button>
					<div id="advancedPaletteBody" hidden={!paletteEditorOpen}>
						<div className="muted" style={{ margin: '0.5rem 0' }}>
							These are all of the colors in the palette, by order of
							appearance. <br />
							If your game has less than the full palette size, only the first
							relevant colors will be used. <br />
							You can customize any color by entering a hex code (e.g.{' '}
							<code>#ff0000</code>) or using the color picker. <br />
						</div>

						<div style={{ display: 'grid', gap: '0.5rem' }}>
							{PALETTE.map((c, i) => {
								const label = `Color ${i + 1}`;
								const override = settings.paletteOverrides?.[c.id] ?? '';
								const overrideHex = normalizeHexColor(override);
								const effectiveHex = overrideHex ?? c.hex;
								return (
									<div
										key={c.id}
										className="checkboxRow"
										style={{
											justifyContent: 'space-between',
											gap: '0.75rem',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
											}}
										>
											<span
												aria-hidden="true"
												style={{
													width: 16,
													height: 16,
													borderRadius: 4,
													background: effectiveHex,
													border: '1px solid rgba(255,255,255,0.25)',
												}}
											/>
											<span>{label}</span>
										</div>

										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
											}}
										>
											<input
												type="color"
												value={effectiveHex}
												onChange={(e) => {
													const hex = normalizeHexColor(e.target.value);
													if (!hex) return;
													set('paletteOverrides', {
														...(settings.paletteOverrides ?? {}),
														[c.id]: hex,
													});
												}}
												title={`Pick ${label}`}
												aria-label={`${label} color picker`}
												style={{ width: 42, height: 28 }}
											/>
											<input
												key={`${c.id}:${override}`}
												type="text"
												inputMode="text"
												defaultValue={overrideHex ?? ''}
												onKeyDown={(e) => {
													if (e.key !== 'Enter') return;
													(e.currentTarget as HTMLInputElement).blur();
												}}
												onBlur={(e) => {
													const raw = e.currentTarget.value;
													const trimmed = raw.trim();
													if (trimmed === '') {
														const next = {
															...(settings.paletteOverrides ?? {}),
														};
														delete next[c.id];
														set('paletteOverrides', next);
														return;
													}
													const hex = normalizeHexColor(trimmed);
													if (!hex) {
														e.currentTarget.value = overrideHex ?? '';
														return;
													}
													set('paletteOverrides', {
														...(settings.paletteOverrides ?? {}),
														[c.id]: hex,
													});
												}}
												placeholder={c.hex}
												aria-label={`${label} hex`}
												style={{
													width: 92,
													fontFamily:
														'ui-monospace, SFMono-Regular, Menlo, monospace',
												}}
											/>
											<button
												type="button"
												className="secondary"
												onClick={() => {
													const next = { ...(settings.paletteOverrides ?? {}) };
													delete next[c.id];
													set('paletteOverrides', next);
												}}
												title={`Reset ${label} to default`}
											>
												Reset
											</button>
										</div>
									</div>
								);
							})}
						</div>

						<div
							style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}
						>
							<button
								type="button"
								className="secondary"
								onClick={() => set('paletteOverrides', {})}
							>
								Reset all palette colors
							</button>
							<span className="muted" style={{ alignSelf: 'center' }}>
								Edits apply immediately and are saved.
							</span>
						</div>
					</div>
				</div>
			</section>

			<section className="panel gameRules">
				<button
					type="button"
					className="rulesTitleRow"
					onClick={() => setRulesOpen((open) => !open)}
					aria-expanded={rulesOpen}
					aria-controls="gameRulesBody"
					title={rulesOpen ? 'Hide rules' : 'Show rules'}
				>
					<div className="rulesLogo" aria-hidden="true">
						<svg
							viewBox="0 0 24 24"
							role="img"
							focusable="false"
							aria-label="Help"
						>
							<path
								fill="currentColor"
								d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-4.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm0-11c-1.77 0-3.25 1.23-3.25 3a1 1 0 1 0 2 0c0-.58.6-1 1.25-1 .7 0 1.25.47 1.25 1 0 .5-.28.8-.93 1.21-.95.6-1.82 1.33-1.82 2.79V12a1 1 0 1 0 2 0v-.5c0-.42.16-.63.89-1.1.98-.62 1.86-1.41 1.86-2.9 0-1.72-1.46-3-3.25-3Z"
							/>
						</svg>
					</div>
					<h2 className="h2">How to play</h2>
					<span className="rulesChevron" aria-hidden="true">
						▼
					</span>
				</button>
				<div id="gameRulesBody" className="rulesBody" hidden={!rulesOpen}>
					<p>
						A secret color code is waiting to be revealed, and you have to
						figure it out by guessing. After each attempt, you receive feedback
						indicating how many colors are correct and in the right place and
						how many are correct but in the wrong place. Keep guessing until the
						code is cracked!
					</p>
					<img
						src={demoGif}
						className="rulesDemoGif"
						alt="Gameplay demo"
						loading="lazy"
						decoding="async"
					/>
				</div>
			</section>
		</div>
	);
}
