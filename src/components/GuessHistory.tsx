import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PaletteColor } from '../game/palette';
import type { GuessResult } from '../game/types';

type GuessHistoryProps = {
	guesses: GuessResult[];
	paletteById: ReadonlyMap<string, PaletteColor>;
	canInteract?: boolean;
	onSelectGuess?: (guess: string[]) => void;
};

export function GuessHistory({
	guesses,
	paletteById,
	canInteract,
	onSelectGuess,
}: GuessHistoryProps) {
	const HISTORY_SCALE_MIN = 0.35;
	const HISTORY_SCALE_MAX = 1;

	function clampScale(value: number) {
		return Math.max(HISTORY_SCALE_MIN, Math.min(HISTORY_SCALE_MAX, value));
	}

	const [historyScale, setHistoryScale] = useState(() => {
		try {
			const raw = window.localStorage.getItem('historyScale');
			const n = raw ? Number(raw) : NaN;
			return Number.isFinite(n) ? clampScale(n) : 1;
		} catch {
			return 1;
		}
	});

	useEffect(() => {
		try {
			window.localStorage.setItem('historyScale', String(historyScale));
		} catch {
			// ignore
		}
	}, [historyScale]);

	// Track active touch pointers for pinch gesture (two fingers).
	const pointersRef = useRef(new Map<number, { x: number; y: number }>());
	const pinchRef = useRef<{
		startDistance: number;
		startScale: number;
	} | null>(null);

	const distance = useCallback(
		(a: { x: number; y: number }, b: { x: number; y: number }) => {
			const dx = a.x - b.x;
			const dy = a.y - b.y;
			return Math.hypot(dx, dy);
		},
		[],
	);

	const maybeStartPinch = useCallback(() => {
		if (pointersRef.current.size !== 2) return;
		const [p1, p2] = Array.from(pointersRef.current.values());
		const d = distance(p1, p2);
		if (d <= 0) return;
		pinchRef.current = {
			startDistance: d,
			startScale: historyScale,
		};
	}, [distance, historyScale]);

	const onPointerDown = useCallback(
		(e: React.PointerEvent<HTMLElement>) => {
			if (e.pointerType !== 'touch') return;
			pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
			e.currentTarget.setPointerCapture?.(e.pointerId);
			if (pointersRef.current.size === 2) {
				maybeStartPinch();
			}
		},
		[maybeStartPinch],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent<HTMLElement>) => {
			if (e.pointerType !== 'touch') return;
			if (!pointersRef.current.has(e.pointerId)) return;
			pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
			if (pointersRef.current.size !== 2) return;
			const pinch = pinchRef.current;
			if (!pinch) return;
			const [p1, p2] = Array.from(pointersRef.current.values());
			const d = distance(p1, p2);
			if (d <= 0) return;
			const ratio = d / pinch.startDistance;
			// Pinch-in => ratio < 1 => smaller scale.
			setHistoryScale(clampScale(pinch.startScale * ratio));
			if (e.cancelable) e.preventDefault();
		},
		[distance],
	);

	const onPointerUpOrCancel = useCallback(
		(e: React.PointerEvent<HTMLElement>) => {
			if (e.pointerType !== 'touch') return;
			pointersRef.current.delete(e.pointerId);
			if (pointersRef.current.size < 2) pinchRef.current = null;
		},
		[],
	);

	const panelStyle = useMemo(
		() =>
			({ ['--history-scale' as never]: historyScale }) as React.CSSProperties,
		[historyScale],
	);

	return (
		<section
			className="panel historyPanel"
			style={panelStyle}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUpOrCancel}
			onPointerCancel={onPointerUpOrCancel}
		>
			<div
				className="legend"
				aria-label="Legend"
				style={{
					paddingTop: '1rem',
					textAlign: 'center',
					alignItems: 'center',
					justifyContent: 'right',
				}}
			>
				<span className="chip chipGood">
					Right color<br></br>Right place
				</span>
				<span className="chip chipWarn">
					Right color<br></br>Wrong place
				</span>
			</div>

			<div className="historyHeader">
				<h2 className="h2">Guesses</h2>
				<div className="muted">{guesses.length} total</div>
			</div>

			{guesses.length === 0 ? (
				<p className="muted">No guesses yet. Click colors to build a guess.</p>
			) : (
				<ol className="history" aria-label="Guess history">
					{guesses
						.slice()
						.reverse()
						.map((g) => (
							<li key={g.id}>
								<button
									type="button"
									className="historyItem"
									onClick={() => onSelectGuess?.(g.guess)}
									disabled={!canInteract || !onSelectGuess}
									title={canInteract ? 'Use this guess' : 'Game is over'}
									aria-label={`Use guess ${g.id}`}
								>
									<div className="guessDigits" aria-label={`Guess ${g.id}`}>
										{g.guess.map((id, i) => {
											const c = paletteById.get(id);
											return (
												<span
													key={`${g.id}-${i}`}
													className="digit"
													style={{ background: c?.hex ?? 'transparent' }}
													title={c?.label ?? id}
												/>
											);
										})}
									</div>

									<div className="result">
										<span
											className="badge good"
											title="Right color, right place"
										>
											{g.correctPlace}
										</span>
										<span
											className="badge warn"
											title="Right color, wrong place"
										>
											{g.correctColorWrongPlace}
										</span>
									</div>
								</button>
							</li>
						))}
				</ol>
			)}
		</section>
	);
}
