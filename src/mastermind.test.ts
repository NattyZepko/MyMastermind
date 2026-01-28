import { describe, expect, it } from 'vitest';
import { scoreGuess } from './mastermind';

describe('scoreGuess', () => {
	it('scores an exact match', () => {
		const secret = ['r', 'g', 'b', 'y'];
		const guess = ['r', 'g', 'b', 'y'];
		expect(scoreGuess(secret, guess)).toEqual({
			correctPlace: 4,
			correctColorWrongPlace: 0,
		});
	});

	it('scores colors correct but all in wrong places', () => {
		const secret = ['r', 'g', 'b', 'y'];
		const guess = ['g', 'b', 'y', 'r'];
		expect(scoreGuess(secret, guess)).toEqual({
			correctPlace: 0,
			correctColorWrongPlace: 4,
		});
	});

	it('scores a mixed case with partial matches', () => {
		const secret = ['r', 'g', 'b', 'y'];
		const guess = ['r', 'b', 'x', 'g'];
		// r is correct place; b and g are correct colors but misplaced.
		expect(scoreGuess(secret, guess)).toEqual({
			correctPlace: 1,
			correctColorWrongPlace: 2,
		});
	});

	it('handles duplicates without over-counting', () => {
		const secret = ['r', 'r', 'g', 'b'];
		const guess = ['r', 'g', 'r', 'r'];
		// correctPlace: index 0 only
		// total color matches: r=2 (secret has 2, guess has 3) + g=1 => 3
		// wrong place = 3 - 1 = 2
		expect(scoreGuess(secret, guess)).toEqual({
			correctPlace: 1,
			correctColorWrongPlace: 2,
		});
	});

	it('throws if lengths differ', () => {
		expect(() => scoreGuess(['r'], ['r', 'g'])).toThrow(
			/Secret and guess must have the same length/i,
		);
	});

	it('throws on invalid (empty) color ids', () => {
		expect(() => scoreGuess(['r', ''], ['r', 'g'])).toThrow(
			/Invalid secret color/i,
		);
		expect(() => scoreGuess(['r', 'g'], ['r', ''])).toThrow(
			/Invalid guess color/i,
		);
	});
});
