export type Score = {
	correctPlace: number;
	correctColorWrongPlace: number;
};

function fnv1a32(input: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function generateSecretSeeded(
	palette: readonly string[],
	length = 4,
	seed: string,
	options?: { allowDuplicates?: boolean },
): string[] {
	if (length <= 0) throw new Error('Length must be a positive integer');
	if (palette.length === 0) throw new Error('Palette must not be empty');
	const allowDuplicates = options?.allowDuplicates ?? true;
	if (!allowDuplicates && palette.length < length) {
		throw new Error(
			'Palette must have at least as many colors as the secret length when duplicates are disabled',
		);
	}

	const rng = mulberry32(fnv1a32(seed));

	if (allowDuplicates) {
		const result: string[] = [];
		for (let i = 0; i < length; i++) {
			const idx = Math.floor(rng() * palette.length);
			result.push(palette[idx]);
		}
		return result;
	}

	// No-duplicates mode: deterministic draw without replacement.
	const remaining = palette.slice();
	for (let i = remaining.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[remaining[i], remaining[j]] = [remaining[j], remaining[i]];
	}
	return remaining.slice(0, length);
}

function cryptoRandomInt(maxExclusive: number): number {
	// Returns a uniformly random integer in the range [0, maxExclusive).
	//
	// Why not `Math.floor(Math.random() * maxExclusive)`?
	// - `Math.random()` is not designed to be unpredictable; it can be weaker/predictable.
	// - Using `% maxExclusive` naively can introduce "modulo bias" when the source range
	//   (here, 0..255) doesn't divide evenly by maxExclusive.
	//
	// Here we use the Web Crypto API + rejection sampling to avoid bias.
	if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
		throw new Error('maxExclusive must be a positive integer');
	}
	const bytes = new Uint8Array(1);
	const limit = 256 - (256 % maxExclusive);
	while (true) {
		crypto.getRandomValues(bytes);
		const v = bytes[0];
		// If v is in the "leftover" range [limit, 255], discard it and try again.
		// This keeps the distribution uniform even when maxExclusive doesn't divide 256.
		if (v < limit) return v % maxExclusive;
	}
}

export function generateSecret(
	palette: readonly string[],
	length = 4,
	options?: { allowDuplicates?: boolean },
): string[] {
	if (length <= 0) throw new Error('Length must be a positive integer');
	if (palette.length === 0) throw new Error('Palette must not be empty');
	const allowDuplicates = options?.allowDuplicates ?? true;
	if (!allowDuplicates && palette.length < length) {
		throw new Error(
			'Palette must have at least as many colors as the secret length when duplicates are disabled',
		);
	}

	if (allowDuplicates) {
		// Fast path: duplicates are allowed.
		// We generate `length` random bytes and map each byte to a palette index.
		// For typical palette sizes (6–14) this is simple and plenty random.
		const bytes = new Uint8Array(length);
		crypto.getRandomValues(bytes);
		return Array.from(bytes, (b) => palette[b % palette.length]);
	}

	// No-duplicates mode: "draw without replacement".
	// We keep a working list of remaining colors and remove each chosen color.
	const remaining = palette.slice();
	const result: string[] = [];
	for (let i = 0; i < length; i++) {
		// Pick a uniform random index into the remaining list.
		const idx = cryptoRandomInt(remaining.length);
		result.push(remaining[idx]);
		// Remove it so it can't be picked again.
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
