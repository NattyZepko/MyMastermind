export type Score = {
	correctPlace: number;
	correctColorWrongPlace: number;
};

// Flip this to `true` temporarily if you want to inspect the random byte values
// being generated (helpful when debugging in a browser without VS Code attachment).
const DEBUG_RANDOM = false;
let debugRandomLogsLeft = 20;

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
	// `limit` is the largest multiple of maxExclusive less than 256.
	// We accept only values < limit so that `v % maxExclusive` is perfectly uniform.
	// maxExclusive = 4 => 256 % maxExclusive = 0 => limit = 256
	// maxExclusive = 5 => 256 % maxExclusive = 1 => limit = 255
	// maxExclusive = 6 => 256 % maxExclusive = 1 => limit = 255
	// ...
	const limit = 256 - (256 % maxExclusive);
	while (true) {
		crypto.getRandomValues(bytes);
		alert(bytes[0]);
		console.debug(bytes[0]);

		const v = bytes[0];
		if (DEBUG_RANDOM && debugRandomLogsLeft > 0) {
			debugRandomLogsLeft--;
			// Example: "cryptoRandomInt: v=203 limit=255 maxExclusive=6"
			console.debug(
				`cryptoRandomInt: v=${v} limit=${limit} maxExclusive=${maxExclusive}`,
			);
		}
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
		// (If you wanted to be extremely strict about uniformity here too, you could
		// use cryptoRandomInt(palette.length) for each pick, but the bias is tiny.)
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
