import type { PaletteColor } from '../game/palette';

type PalettePanelProps = {
	palette: readonly PaletteColor[];
	selectedColorId: string | null;
	onSelectColor: (colorId: string) => void;
	canInteract: boolean;
	onStartTouchDrag?: (
		colorId: string,
		e: React.PointerEvent<HTMLButtonElement>,
	) => void;
	suppressClick?: boolean;
};

export function PalettePanel({
	palette,
	selectedColorId,
	onSelectColor,
	canInteract,
	onStartTouchDrag,
	suppressClick,
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
							onClick={(e) => {
								if (suppressClick) {
									e.preventDefault();
									e.stopPropagation();
									return;
								}
								onSelectColor(c.id);
							}}
							onPointerDown={(e) => {
								if (!canInteract) return;
								if (e.pointerType === 'mouse') return;
								onSelectColor(c.id);
								onStartTouchDrag?.(c.id, e);
							}}
							draggable
							onDragStart={(e) => {
								e.dataTransfer.effectAllowed = 'copy';
								e.dataTransfer.setData('application/x-mastermind-color', c.id);
								e.dataTransfer.setData('text/plain', c.id);
							}}
							title={c.label}
							aria-label={c.label}
						/>
					);
				})}
			</div>
		</section>
	);
}
