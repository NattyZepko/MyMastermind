import { RainbowTitle } from './RainbowTitle';

type HeaderProps = {
	codeLength: number;
	subtitle?: string;
	onNewGame?: () => void;
	onBackToMenu?: () => void;
};

export function Header({
	codeLength,
	subtitle,
	onNewGame,
	onBackToMenu,
}: HeaderProps) {
	return (
		<header className="header">
			<div>
				<h1 className="title titleGlow">
					<RainbowTitle text="Mastermind" />
				</h1>
				<p className="subtitle">
					{subtitle ??
						`Guess the hidden ${codeLength}-color code (duplicates allowed).`}
				</p>
			</div>

			<div className="headerActions">
				{onBackToMenu ? (
					<button
						type="button"
						className="secondary headerMenuButton"
						onClick={onBackToMenu}
					>
						Menu
					</button>
				) : null}
				{onNewGame ? (
					<button
						type="button"
						className="secondary headerNewGameButton"
						onClick={onNewGame}
					>
						New game
					</button>
				) : null}
			</div>
		</header>
	);
}
