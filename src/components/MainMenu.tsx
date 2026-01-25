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

function parseNumberInput(value: string) {
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
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
						<input
							type="number"
							className="numberInput compact"
							min={CODE_LENGTH_MIN}
							max={CODE_LENGTH_MAX}
							value={settings.codeLength}
							onChange={(e) => {
								const v = parseNumberInput(e.target.value);
								if (v !== null) set('codeLength', v);
							}}
						/>
					</label>

					<label className="field">
						<div
							className="fieldLabel"
							style={{ paddingRight: '1em', paddingLeft: '2em' }}
						>
							Palette size
						</div>
						<input
							type="number"
							className="numberInput compact"
							min={PALETTE_SIZE_MIN}
							max={PALETTE_SIZE_MAX}
							value={settings.paletteSize}
							onChange={(e) => {
								const v = parseNumberInput(e.target.value);
								if (v !== null) set('paletteSize', v);
							}}
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
							<input
								type="number"
								className="numberInput inline"
								min={TIME_LIMIT_MINUTES_MIN}
								max={TIME_LIMIT_MINUTES_MAX}
								step={1}
								value={timeParts.minutes}
								disabled={mode !== 'time'}
								onChange={(e) => {
									const v = parseNumberInput(e.target.value);
									if (v === null) return;
									const minutes = Math.max(
										TIME_LIMIT_MINUTES_MIN,
										Math.min(TIME_LIMIT_MINUTES_MAX, Math.trunc(v)),
									);
									const seconds =
										minutes >= TIME_LIMIT_MINUTES_MAX ? 0 : timeParts.seconds;
									set('timeLimitMinutes', minutes + seconds / 60);
								}}
								aria-label="Time limit minutes"
							/>
							<span className="muted">:</span>
							<input
								type="number"
								className="numberInput inline"
								step={1}
								value={timeParts.seconds}
								disabled={
									mode !== 'time' || timeParts.minutes >= TIME_LIMIT_MINUTES_MAX
								}
								onChange={(e) => {
									const v = parseNumberInput(e.target.value);
									if (v === null) return;
									const raw = Math.trunc(v);
									const wrapped = ((raw % 60) + 60) % 60;
									set('timeLimitMinutes', timeParts.minutes + wrapped / 60);
								}}
								onBlur={(e) => {
									const v = parseNumberInput(e.target.value);
									if (v === null) {
										set('timeLimitMinutes', timeParts.minutes);
										return;
									}
									const raw = Math.trunc(v);
									const clamped = Math.max(0, Math.min(59, raw));
									set('timeLimitMinutes', timeParts.minutes + clamped / 60);
								}}
								aria-label="Time limit seconds"
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
							<input
								type="number"
								className="numberInput inline"
								min={GUESS_LIMIT_MIN}
								max={GUESS_LIMIT_MAX}
								value={settings.guessLimit}
								disabled={mode !== 'limited'}
								onChange={(e) => {
									const v = parseNumberInput(e.target.value);
									if (v !== null) set('guessLimit', v);
								}}
								aria-label="Guess limit"
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
