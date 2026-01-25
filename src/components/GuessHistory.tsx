import type { PaletteColor } from '../game/palette';
import type { GuessResult } from '../game/types';

type GuessHistoryProps = {
	guesses: GuessResult[];
	paletteById: ReadonlyMap<string, PaletteColor>;
};

export function GuessHistory({ guesses, paletteById }: GuessHistoryProps) {
	return (
		<section className="panel">
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
							<li key={g.id} className="historyItem">
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
									<span className="badge good" title="Right color, right place">
										{g.correctPlace}
									</span>
									<span className="badge warn" title="Right color, wrong place">
										{g.correctColorWrongPlace}
									</span>
								</div>
							</li>
						))}
				</ol>
			)}
		</section>
	);
}
