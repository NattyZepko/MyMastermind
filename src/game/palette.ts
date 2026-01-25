export type PaletteColor = {
	id: string;
	label: string;
	hex: string;
};

export const CODE_LENGTH = 4;

export const PALETTE: readonly PaletteColor[] = [
	{ id: 'red', label: 'Red', hex: '#ef4444' },
	{ id: 'orange', label: 'Orange', hex: '#f97316' },
	{ id: 'yellow', label: 'Yellow', hex: '#facc15' },
	{ id: 'green', label: 'Green', hex: '#22c55e' },
	{ id: 'blue', label: 'Blue', hex: '#3b82f6' },
	{ id: 'purple', label: 'Purple', hex: '#a855f7' },
	{ id: 'pink', label: 'Pink', hex: '#ec4899' },
	{ id: 'brown', label: 'Brown', hex: '#9A6324' },
	{ id: 'white', label: 'White', hex: '#ffffff' },
	{ id: 'grey', label: 'Grey', hex: '#6b6b6b' },
	{ id: 'navy', label: 'Navy', hex: '#1c1c84' },
	{ id: 'darkGreen', label: 'Dark Green', hex: '#144819' },
	{ id: 'cyan', label: 'Cyan', hex: '#7cf0f4' },
	{ id: 'black', label: 'Black', hex: '#000000' },
];

export const PALETTE_IDS = PALETTE.map((c) => c.id);
export const PALETTE_BY_ID = new Map(PALETTE.map((c) => [c.id, c] as const));
