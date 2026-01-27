import { PALETTE } from '../game/palette';

type RainbowTitleProps = {
	text: string;
	className?: string;
};

export function RainbowTitle({ text, className }: RainbowTitleProps) {
	const colors = PALETTE.slice(0, 10).map((c) => c.hex);
	const chars = Array.from(text);

	return (
		<span className={className} aria-label={text}>
			{chars.map((ch, i) => (
				<span
					key={`${ch}-${i}`}
					aria-hidden="true"
					style={{
						color: colors.length ? colors[i % colors.length] : undefined,
					}}
				>
					{ch}
				</span>
			))}
		</span>
	);
}
