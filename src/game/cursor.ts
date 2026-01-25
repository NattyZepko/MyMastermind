export function cssCursorFor(hex: string) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="6" fill="${hex}" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/></svg>`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 14 14, pointer`;
}
