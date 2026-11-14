// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Keep the Node adapter for the container deployment; Vercel serves this
// showcase page as static output and does not need a server runtime.
const vercelStaticOutput = process.env.VERCEL === '1';

export default defineConfig({
  output: vercelStaticOutput ? 'static' : 'server',
  ...(vercelStaticOutput ? {} : { adapter: node({ mode: 'standalone' }) }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 4321,
    host: '0.0.0.0',
  },
});
