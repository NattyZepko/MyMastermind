import { useEffect, useMemo, useRef } from 'react';

type ConfettiOverlayProps = {
	/** Starts a one-shot confetti burst when this component mounts. */
	durationMs?: number;
};

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	rot: number;
	vrot: number;
	size: number;
	color: string;
	lifeMs: number;
};

function rand(min: number, max: number) {
	return min + Math.random() * (max - min);
}

export function ConfettiOverlay({ durationMs = 10200 }: ConfettiOverlayProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	const palette = useMemo(
		() =>
			[
				'#22c55e',
				'#60a5fa',
				'#f97316',
				'#a78bfa',
				'#facc15',
				'#fb7185',
				'#2dd4bf',
				'#ee1c18',
				'#dbea31',
				'#42d4f4',
				'#bfef45',
			] as const,
		[],
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const canvasEl: HTMLCanvasElement = canvas;
		const ctx2d: CanvasRenderingContext2D = ctx;

		let raf = 0;
		let isRunning = true;
		let lastT = performance.now();
		let elapsed = 0;
		const timeouts: number[] = [];

		const particles: Particle[] = [];
		const gravity = 520; // px/s^2
		const airDrag = 0.995;

		function resize() {
			const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
			const w = Math.floor(window.innerWidth);
			const h = Math.floor(window.innerHeight);
			canvasEl.width = w * dpr;
			canvasEl.height = h * dpr;
			canvasEl.style.width = `${w}px`;
			canvasEl.style.height = `${h}px`;
			ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function spawnBurst() {
			const w = window.innerWidth;
			const h = window.innerHeight;
			const count = Math.min(520, Math.max(260, Math.floor(w / 3.5)));
			for (let i = 0; i < count; i++) {
				const x = rand(w * 0.15, w * 0.85);
				const y = rand(-30, -10);
				const angle = rand(Math.PI * 1.1, Math.PI * 1.9);
				const speed = rand(420, 980);
				particles.push({
					x,
					y,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed,
					rot: rand(0, Math.PI * 2),
					vrot: rand(-10, 10),
					size: rand(6, 11),
					color: palette[Math.floor(Math.random() * palette.length)],
					lifeMs: rand(4500, 9800),
				});
			}

			// a few extra side jets
			for (let i = 0; i < 120; i++) {
				const left = Math.random() < 0.5;
				const x = left ? rand(-20, 20) : rand(w - 20, w + 20);
				const y = rand(h * 0.05, h * 0.35);
				const angle = left
					? rand(-0.35, 0.55)
					: rand(Math.PI - 0.55, Math.PI + 0.35);
				const speed = rand(520, 980);
				particles.push({
					x,
					y,
					vx: Math.cos(angle) * speed,
					vy: -Math.abs(Math.sin(angle) * speed) * 0.6,
					rot: rand(0, Math.PI * 2),
					vrot: rand(-12, 12),
					size: rand(6, 11),
					color: palette[Math.floor(Math.random() * palette.length)],
					lifeMs: rand(5000, 11000),
				});
			}
		}

		function step(t: number) {
			if (!isRunning) return;
			const dt = Math.min(0.033, (t - lastT) / 1000);
			lastT = t;
			elapsed += dt * 1000;

			const w = window.innerWidth;
			const h = window.innerHeight;

			ctx2d.clearRect(0, 0, w, h);

			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.lifeMs -= dt * 1000;
				if (p.lifeMs <= 0 || p.y > h + 160) {
					particles.splice(i, 1);
					continue;
				}

				p.vy += gravity * dt;
				p.vx *= airDrag;
				p.vy *= airDrag;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.rot += p.vrot * dt;

				ctx2d.save();
				ctx2d.translate(p.x, p.y);
				ctx2d.rotate(p.rot);
				ctx2d.fillStyle = p.color;
				ctx2d.globalAlpha = Math.max(0, Math.min(1, p.lifeMs / 600));
				ctx2d.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
				ctx2d.restore();
			}

			if (elapsed < durationMs || particles.length > 0) {
				raf = requestAnimationFrame(step);
			} else {
				isRunning = false;
				ctx2d.clearRect(0, 0, w, h);
			}
		}

		resize();
		spawnBurst();
		timeouts.push(window.setTimeout(spawnBurst, 650));
		timeouts.push(window.setTimeout(spawnBurst, 1300));
		raf = requestAnimationFrame(step);

		window.addEventListener('resize', resize);
		return () => {
			isRunning = false;
			window.removeEventListener('resize', resize);
			for (const id of timeouts) window.clearTimeout(id);
			cancelAnimationFrame(raf);
		};
	}, [durationMs, palette]);

	return <canvas className="confetti" ref={canvasRef} aria-hidden="true" />;
}
