export type GameMode = 'zen' | 'time' | 'limited';

export type GameSettings = {
	codeLength: number;
	paletteSize: number;
	allowDuplicates: boolean;
	mode: GameMode;
	timeLimitMinutes: number;
	guessLimit: number;
};

export const CODE_LENGTH_DEFAULT = 4;
export const CODE_LENGTH_MIN = 3;
export const CODE_LENGTH_MAX = 6;

export const PALETTE_SIZE_DEFAULT = 8;
export const PALETTE_SIZE_MIN = 6;
export const PALETTE_SIZE_MAX = 14;

export const TIME_LIMIT_MINUTES_DEFAULT = 3;
export const TIME_LIMIT_MINUTES_MIN = 1;
export const TIME_LIMIT_MINUTES_MAX = 30;

export const GUESS_LIMIT_DEFAULT = 8;
export const GUESS_LIMIT_MIN = 4;
export const GUESS_LIMIT_MAX = 20;

export const DEFAULT_SETTINGS: GameSettings = {
	codeLength: CODE_LENGTH_DEFAULT,
	paletteSize: PALETTE_SIZE_DEFAULT,
	allowDuplicates: true,
	mode: 'zen',
	timeLimitMinutes: TIME_LIMIT_MINUTES_DEFAULT,
	guessLimit: GUESS_LIMIT_DEFAULT,
};

export function clampNumber(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

export function normalizeSettings(settings: GameSettings): GameSettings {
	const paletteSize = clampNumber(
		settings.paletteSize,
		PALETTE_SIZE_MIN,
		PALETTE_SIZE_MAX,
	);
	const maxCodeLength = settings.allowDuplicates
		? CODE_LENGTH_MAX
		: Math.min(CODE_LENGTH_MAX, paletteSize);
	const codeLength = clampNumber(
		settings.codeLength,
		CODE_LENGTH_MIN,
		maxCodeLength,
	);

	return {
		...settings,
		paletteSize,
		codeLength,
		timeLimitMinutes: clampNumber(
			settings.timeLimitMinutes,
			TIME_LIMIT_MINUTES_MIN,
			TIME_LIMIT_MINUTES_MAX,
		),
		guessLimit: clampNumber(
			settings.guessLimit,
			GUESS_LIMIT_MIN,
			GUESS_LIMIT_MAX,
		),
	};
}

export function formatClock(totalSeconds: number) {
	const clamped = Math.max(0, Math.floor(totalSeconds));
	const minutes = Math.floor(clamped / 60);
	const seconds = clamped % 60;
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
