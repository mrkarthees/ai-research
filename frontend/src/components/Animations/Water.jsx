import { useEffect, useRef } from 'react';

/**
 * Mouse-interactive water surface.
 * A low-resolution wave height-field is simulated each frame and drawn
 * as soft blue light on a transparent canvas, so the page background
 * shows through. Move the pointer to push the water; a slow ambient
 * current keeps it alive when the pointer is idle.
 *
 * Tweak the constants below to change the feel.
 */
const CELL = 5; // px per simulation cell (bigger = faster, softer)
const DAMPING = 0.986; // closer to 1 = ripples live longer
const PUSH = 520; // pointer disturbance strength
const RADIUS = 3; // pointer disturbance radius in cells
const LIGHT = 0.55; // brightness of the ripples
const MAX_ALPHA = 190; // cap so text stays readable

export function Water({ className = '' }) {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return undefined;

		const ctx = canvas.getContext('2d');
		const reduceMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)',
		).matches;

		let w = 0;
		let h = 0;
		let cur;
		let prev;
		let image;
		let raf = 0;
		let frame = 0;
		let last = null;

		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			w = Math.max(8, Math.ceil(rect.width / CELL));
			h = Math.max(8, Math.ceil(rect.height / CELL));
			canvas.width = w;
			canvas.height = h;
			cur = new Float32Array(w * h);
			prev = new Float32Array(w * h);
			image = ctx.createImageData(w, h);
		};

		const disturb = (cx, cy, amount, radius = RADIUS) => {
			const x0 = Math.max(1, Math.floor(cx - radius));
			const x1 = Math.min(w - 2, Math.ceil(cx + radius));
			const y0 = Math.max(1, Math.floor(cy - radius));
			const y1 = Math.min(h - 2, Math.ceil(cy + radius));

			for (let y = y0; y <= y1; y++) {
				for (let x = x0; x <= x1; x++) {
					const d = Math.hypot(x - cx, y - cy);
					if (d > radius) continue;
					const falloff = 0.5 + 0.5 * Math.cos((d / radius) * Math.PI);
					prev[y * w + x] += amount * falloff;
				}
			}
		};

		const step = () => {
			for (let y = 1; y < h - 1; y++) {
				let i = y * w + 1;
				for (let x = 1; x < w - 1; x++, i++) {
					const n =
						(prev[i - 1] + prev[i + 1] + prev[i - w] + prev[i + w]) / 2 - cur[i];
					cur[i] = n * DAMPING;
				}
			}
			const tmp = prev;
			prev = cur;
			cur = tmp;
		};

		const render = () => {
			const data = image.data;
			for (let y = 1; y < h - 1; y++) {
				for (let x = 1; x < w - 1; x++) {
					const i = y * w + x;
					// slope of the surface = where light catches the water
					const dx = prev[i + 1] - prev[i - 1];
					const dy = prev[i + w] - prev[i - w];
					const light = (dx + dy) * LIGHT;
					const o = i * 4;

					if (light > 0) {
						// lit crest: pale blue
						data[o] = 147;
						data[o + 1] = 197;
						data[o + 2] = 253;
						data[o + 3] = Math.min(MAX_ALPHA, light);
					} else {
						// shaded trough: accent blue, softer
						data[o] = 37;
						data[o + 1] = 99;
						data[o + 2] = 235;
						data[o + 3] = Math.min(MAX_ALPHA * 0.6, -light * 0.8);
					}
				}
			}
			ctx.putImageData(image, 0, 0);
		};

		const onPointerMove = (event) => {
			const rect = canvas.getBoundingClientRect();
			const x = (event.clientX - rect.left) / CELL;
			const y = (event.clientY - rect.top) / CELL;

			if (x < 0 || y < 0 || x > w || y > h) {
				last = null;
				return;
			}

			if (last) {
				// fill the gap between events so fast moves leave a continuous wake
				const dist = Math.hypot(x - last.x, y - last.y);
				const steps = Math.max(1, Math.ceil(dist / 1.5));
				const strength = -Math.min(PUSH, 120 + dist * 60);
				for (let s = 1; s <= steps; s++) {
					const t = s / steps;
					disturb(
						last.x + (x - last.x) * t,
						last.y + (y - last.y) * t,
						strength / steps + strength * 0.2,
					);
				}
			}
			last = { x, y };
		};

		const onPointerLeave = () => {
			last = null;
		};

		const ambient = () => {
			const t = performance.now();
			// two slow currents drifting across the surface
			if (frame % 5 === 0) {
				disturb(
					w * (0.5 + 0.38 * Math.sin(t * 0.00028)),
					h * (0.45 + 0.28 * Math.sin(t * 0.00041 + 1.3)),
					-70,
					2.5,
				);
			}
			if (frame % 7 === 0) {
				disturb(
					w * (0.5 + 0.34 * Math.cos(t * 0.00033 + 2)),
					h * (0.55 + 0.25 * Math.sin(t * 0.00023 + 4)),
					-55,
					2.5,
				);
			}
			// occasional raindrop
			if (frame % 140 === 0) {
				disturb(Math.random() * w, Math.random() * h, -260, 2);
			}
		};

		const loop = () => {
			frame++;
			ambient();
			step();
			render();
			raf = requestAnimationFrame(loop);
		};

		resize();

		if (!reduceMotion) {
			window.addEventListener('pointermove', onPointerMove, { passive: true });
			document.addEventListener('pointerleave', onPointerLeave);
			raf = requestAnimationFrame(loop);
		}

		const observer = new ResizeObserver(resize);
		observer.observe(canvas);

		return () => {
			cancelAnimationFrame(raf);
			observer.disconnect();
			window.removeEventListener('pointermove', onPointerMove);
			document.removeEventListener('pointerleave', onPointerLeave);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden='true'
			className={`pointer-events-none h-full w-full ${className}`}
		/>
	);
}

export default Water;
