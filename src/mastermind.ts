export type Score = {
	correctPlace: number;
	correctColorWrongPlace: number;
};

function cryptoRandomInt(maxExclusive: number): number {
	if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
		throw new Error('maxExclusive must be a positive integer');
	}
	const bytes = new Uint8Array(1);
	const limit = 256 - (256 % maxExclusive);
	while (true) {
		crypto.getRandomValues(bytes);
		const v = bytes[0];
		if (v < limit) return v % maxExclusive;
	}
}

export function generateSecret(
	palette: readonly string[],
	length = 4,
	options?: { allowDuplicates?: boolean },
): string[] {
	if (length <= 0) return [];
	if (palette.length === 0) throw new Error('Palette must not be empty');
	const allowDuplicates = options?.allowDuplicates ?? true;
	if (!allowDuplicates && palette.length < length) {
		throw new Error(
			'Palette must have at least as many colors as the secret length when duplicates are disabled',
		);
	}

	if (allowDuplicates) {
		const bytes = new Uint8Array(length);
		crypto.getRandomValues(bytes);
		return Array.from(bytes, (b) => palette[b % palette.length]);
	}

	const remaining = palette.slice();
	const result: string[] = [];
	for (let i = 0; i < length; i++) {
		const idx = cryptoRandomInt(remaining.length);
		result.push(remaining[idx]);
		remaining.splice(idx, 1);
	}
	return result;
}

export function scoreGuess(secret: string[], guess: string[]): Score {
	if (secret.length !== guess.length) {
		throw new Error('Secret and guess must have the same length');
	}

	let correctPlace = 0;

	const secretCounts = new Map<string, number>();
	const guessCounts = new Map<string, number>();

	for (let i = 0; i < secret.length; i++) {
		const s = secret[i];
		const g = guess[i];

		if (typeof s !== 'string' || s.length === 0)
			throw new Error('Invalid secret color');
		if (typeof g !== 'string' || g.length === 0)
			throw new Error('Invalid guess color');

		if (s === g) correctPlace++;

		secretCounts.set(s, (secretCounts.get(s) ?? 0) + 1);
		guessCounts.set(g, (guessCounts.get(g) ?? 0) + 1);
	}

	let totalColorMatches = 0;
	for (const [colorId, secretCount] of secretCounts) {
		const guessCount = guessCounts.get(colorId) ?? 0;
		totalColorMatches += Math.min(secretCount, guessCount);
	}

	const correctColorWrongPlace = totalColorMatches - correctPlace;
	return { correctPlace, correctColorWrongPlace };
}
