// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

const backendTarget =
  process.env.PUBLIC_API_URL ||
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  'http://localhost:5173';

// https://astro.build/config
export default defineConfig({
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