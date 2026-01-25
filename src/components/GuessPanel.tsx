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

	onClearCurrentGuess: () => void;
	onSubmitGuess: () => void;
	onSetPeg: (index: number) => void;
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
	onClearCurrentGuess,
	onSubmitGuess,
	onSetPeg,
	onClearPeg,
}: GuessPanelProps) {
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
				style={{ gridTemplateColumns: `repeat(${codeLength}, 2.5rem)` }}
			>
				{currentGuess.map((colorId, i) => {
					const color = colorId ? paletteById.get(colorId) : null;
					return (
						<button
							key={i}
							type="button"
							className="peg"
							style={{ background: color ? color.hex : 'transparent' }}
							onClick={() => onSetPeg(i)}
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
				</div>
			) : null}
		</section>
	);
}
