import { RainbowTitle } from './RainbowTitle';

type HeaderProps = {
	codeLength: number;
	subtitle?: string;
	onNewGame?: () => void;
	onBackToMenu?: () => void;
	showNewGame?: boolean;
	pulseNewGame?: boolean;
	pulseMenu?: boolean;
};

export function Header({
	codeLength,
	subtitle,
	onNewGame,
	onBackToMenu,
	showNewGame = true,
	pulseNewGame = false,
	pulseMenu = false,
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
						className={`secondary headerMenuButton${pulseMenu ? ' pulseGlow' : ''}`}
						onClick={onBackToMenu}
					>
						Menu
					</button>
				) : null}
				{onNewGame && showNewGame ? (
					<button
						type="button"
						className={`secondary headerNewGameButton${pulseNewGame ? ' pulseGlow' : ''}`}
						onClick={onNewGame}
					>
						New game
					</button>
				) : null}
			</div>
		</header>
	);
}
