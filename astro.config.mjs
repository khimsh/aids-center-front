// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import icon from 'astro-icon';

const backendTarget =
  process.env.PUBLIC_API_URL ||
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  'http://localhost:8000';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [icon()],
  vite: {
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/auth': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/upload': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  },

  i18n: {
    defaultLocale: 'ka',
    locales: ['ka', 'en'], // add your locales
    routing: {
      prefixDefaultLocale: false // keeps /ka as just /
    }
  }
});