import { describe, expect, it } from 'vitest';
import { useTranslations } from './utils';

describe('i18n utilities', () => {
  it('returns georgian translation map', () => {
    const ka = useTranslations('ka');
    expect(ka.nav.home).toBeTruthy();
    expect(ka.news).toBeTruthy();
  });

  it('returns english translation map', () => {
    const en = useTranslations('en');
    expect(en.nav.home).toBe('Home');
    expect(en.news).toBeTruthy();
  });
});
