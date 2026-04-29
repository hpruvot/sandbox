import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// `BASE_PATH` is provided by the GitHub Pages workflow so the built assets
// resolve under `/<repo-name>/`. Local dev keeps the default `/`.
const base = process.env.BASE_PATH ?? '/';
export default defineConfig({
    base,
    plugins: [react()],
});
