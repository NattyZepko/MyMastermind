import type { PaletteColor } from '../game/palette';

type PalettePanelProps = {
	palette: readonly PaletteColor[];
	selectedColorId: string | null;
	onSelectColor: (colorId: string) => void;
};

export function PalettePanel({
	palette,
	selectedColorId,
	onSelectColor,
}: PalettePanelProps) {
	const selectedColor = selectedColorId
		? (palette.find((c) => c.id === selectedColorId) ?? null)
		: null;

	return (
		<section className="panel">
			<div className="paletteHeader">
				<h2 className="h2">Palette</h2>
				<div className="muted">
					Selected:{' '}
					{selectedColor ? (
						<span className="selectedLabel">
							<span
								className="swatchInline"
								style={{ background: selectedColor.hex }}
							/>
							{selectedColor.label}
						</span>
					) : (
						'none'
					)}
				</div>
			</div>

			<div className="palette" aria-label="Color palette">
				{palette.map((c) => {
					const isSelected = c.id === selectedColorId;
					return (
						<button
							key={c.id}
							type="button"
							className={`swatch ${isSelected ? 'selected' : ''}`}
							style={{ background: c.hex }}
							onClick={() => onSelectColor(c.id)}
							title={c.label}
							aria-label={c.label}
						/>
					);
				})}
			</div>
		</section>
	);
}
