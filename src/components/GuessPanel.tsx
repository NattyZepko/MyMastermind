import { useState } from 'react';
import type { PaletteColor } from '../game/palette';

type GuessPanelProps = {
	codeLength: number;
	paletteById: ReadonlyMap<string, PaletteColor>;
	currentGuess: Array<string | null>;
	canInteract: boolean;
	error: string | null;
	statusMessage: string | null;
	timerText: string | null;
	guessesLeftText: string | null;
	secret: string[];
	showCopyResults?: boolean;
	onCopyResults?: () => void;
	externalDragOverIndex?: number | null;
	onStartTouchDrag?: (
		colorId: string,
		start: {
			kind: 'pointer' | 'touch';
			id: number;
			x: number;
			y: number;
		},
	) => void;
	suppressClick?: boolean;

	onClearCurrentGuess: () => void;
	onSubmitGuess: () => void;
	onSetPeg: (index: number) => void;
	onSetPegColor?: (index: number, colorId: string) => void;
	onClearPeg: (index: number) => void;
};

export function GuessPanel({
	codeLength,
	paletteById,
	currentGuess,
	canInteract,
	error,
	statusMessage,
	timerText,
	guessesLeftText,
	secret,
	showCopyResults,
	onCopyResults,
	externalDragOverIndex,
	onStartTouchDrag,
	suppressClick,
	onClearCurrentGuess,
	onSubmitGuess,
	onSetPeg,
	onSetPegColor,
	onClearPeg,
}: GuessPanelProps) {
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const effectiveDragOverIndex = externalDragOverIndex ?? dragOverIndex;

	function tryGetDraggedColorId(e: React.DragEvent) {
		return (
			e.dataTransfer.getData('application/x-mastermind-color') ||
			e.dataTransfer.getData('text/plain')
		);
	}

	return (
		<section className="panel">
			<div className="guessHeader">
				<h2 className="h2">Your guess</h2>
				<div className="guessMeta">
					{timerText ? <span className="metaPill">{timerText}</span> : null}
					{guessesLeftText ? (
						<span className="metaPill">{guessesLeftText}</span>
					) : null}
				</div>
				<div className="guessActions">
					<button
						type="button"
						className="secondary"
						onClick={onClearCurrentGuess}
						disabled={!canInteract}
						style={{
							color: '#800080',
							fontWeight: 'bold',
							backgroundColor: '#bd82dd',
						}}
					>
						Clear colors
					</button>
					<button
						type="button"
						onClick={onSubmitGuess}
						disabled={!canInteract}
						style={{
							color: '#1f4419',
							fontWeight: 'bold',
							backgroundColor: '#91d977',
						}}
					>
						Guess
					</button>
				</div>
			</div>

			<div
				className="pegs"
				aria-label="Guess row"
				style={{
					gridTemplateColumns: `repeat(${codeLength}, var(--peg-size))`,
				}}
			>
				{currentGuess.map((colorId, i) => {
					const color = colorId ? paletteById.get(colorId) : null;
					const canDragThisPeg =
						Boolean(colorId) &&
						canInteract &&
						Boolean(onSetPegColor) &&
						Boolean(onStartTouchDrag);
					return (
						<button
							key={i}
							type="button"
							data-peg-index={i}
							className={`peg${effectiveDragOverIndex === i ? ' dragOver' : ''}`}
							style={{ background: color ? color.hex : 'transparent' }}
							onClick={(e) => {
								if (suppressClick) {
									e.preventDefault();
									e.stopPropagation();
									return;
								}
								onSetPeg(i);
							}}
							draggable={
								Boolean(colorId) && canInteract && Boolean(onSetPegColor)
							}
							onDragStart={(e) => {
								if (!colorId) return;
								e.dataTransfer.effectAllowed = 'copy';
								e.dataTransfer.setData(
									'application/x-mastermind-color',
									colorId,
								);
								e.dataTransfer.setData('text/plain', colorId);
							}}
							onPointerDown={(e) => {
								if (!canDragThisPeg) return;
								if (e.pointerType === 'mouse') return;
								e.preventDefault();
								e.currentTarget.setPointerCapture?.(e.pointerId);
								onStartTouchDrag?.(colorId as string, {
									kind: 'pointer',
									id: e.pointerId,
									x: e.clientX,
									y: e.clientY,
								});
							}}
							onTouchStart={(e) => {
								if (!canDragThisPeg) return;
								const t = e.touches.item(0);
								if (!t) return;
								e.preventDefault();
								onStartTouchDrag?.(colorId as string, {
									kind: 'touch',
									id: t.identifier,
									x: t.clientX,
									y: t.clientY,
								});
							}}
							onDragEnter={(e) => {
								if (!canInteract) return;
								if (!onSetPegColor) return;
								if (!tryGetDraggedColorId(e)) return;
								setDragOverIndex(i);
							}}
							onDragOver={(e) => {
								if (!canInteract) return;
								if (!onSetPegColor) return;
								if (!tryGetDraggedColorId(e)) return;
								e.preventDefault();
								e.dataTransfer.dropEffect = 'copy';
								setDragOverIndex(i);
							}}
							onDragLeave={() => {
								setDragOverIndex((prev) => (prev === i ? null : prev));
							}}
							onDrop={(e) => {
								if (!canInteract) return;
								if (!onSetPegColor) return;
								e.preventDefault();
								const droppedColorId = tryGetDraggedColorId(e);
								if (!droppedColorId) return;
								onSetPegColor(i, droppedColorId);
								setDragOverIndex(null);
							}}
							onContextMenu={(e) => {
								e.preventDefault();
								onClearPeg(i);
							}}
							title={
								color
									? `${color.label} (right-click to clear)`
									: 'Click to place selected color (right-click to clear)'
							}
							aria-label={color ? `${color.label}` : `Empty slot ${i + 1}`}
							disabled={!canInteract}
						/>
					);
				})}
			</div>

			{error ? <p className="error">{error}</p> : null}
			{statusMessage ? <p className="status">{statusMessage}</p> : null}

			{!canInteract && secret.length > 0 ? (
				<div className="solved" role="status">
					<div className="secretReveal" aria-label="Secret code">
						{secret.map((id, idx) => {
							const c = paletteById.get(id);
							return (
								<span
									key={`${id}-${idx}`}
									className="secretPeg"
									style={{ background: c?.hex ?? 'transparent' }}
									title={c?.label ?? id}
								/>
							);
						})}
					</div>

					{showCopyResults && onCopyResults ? (
						<div className="secretActions">
							<button
								type="button"
								className="copyResultsButton"
								onClick={onCopyResults}
								title="Copy your Daily Challenge result"
							>
								Copy results
							</button>
						</div>
					) : null}
				</div>
			) : null}
		</section>
	);
}
