import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const proxy = {
	'/api': {
		target: 'http://localhost:3000',
		changeOrigin: true,
	},
};

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: { host: true, proxy },
	preview: { host: true, proxy },
});
