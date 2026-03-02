// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  integrations: [icon()],

  i18n: {
    defaultLocale: 'ka',
    locales: ['ka', 'en'], // add your locales
    routing: {
      prefixDefaultLocale: false // keeps /ka as just /
    }
  }
});