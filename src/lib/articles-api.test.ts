import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchArticleBySlug,
  fetchArticleSlugs,
  fetchPublishedArticlesPage,
  isArticlePublished,
  toAbsoluteImageUrl,
} from './articles-api';

describe('articles-api utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds absolute image urls', () => {
    const base = 'https://api.example.com';
    expect(toAbsoluteImageUrl(base, null)).toBe('');
    expect(toAbsoluteImageUrl(base, 'https://cdn.com/x.jpg')).toBe('https://cdn.com/x.jpg');
    expect(toAbsoluteImageUrl(base, '/uploads/x.jpg')).toBe(
      'https://api.example.com/uploads/x.jpg',
    );
    expect(toAbsoluteImageUrl(base, 'uploads/x.jpg')).toBe('https://api.example.com/uploads/x.jpg');
  });

  it('determines publish state with backend fallback behavior', () => {
    expect(isArticlePublished({ published: true, published_at: null })).toBe(true);
    expect(isArticlePublished({ published: false, published_at: '2026-01-01T00:00:00.000Z' })).toBe(
      false,
    );
    expect(isArticlePublished({ published: undefined, published_at: undefined })).toBe(true);
    expect(
      isArticlePublished({ published: undefined, published_at: '2026-01-01T00:00:00.000Z' }),
    ).toBe(true);
  });

  it('fetches article slugs from list payload and deduplicates', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ slug: 'first' }, { slug: ' first ' }, { slug: 'second' }],
        total: 3,
        per_page: 100,
      }),
    } as Response);

    const slugs = await fetchArticleSlugs('https://api.example.com');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(slugs.sort()).toEqual(['first', 'second']);
  });

  it('fallbacks slug fetch when first request is 422', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 422 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ slug: 'single' }],
      } as Response);

    const slugs = await fetchArticleSlugs('https://api.example.com');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(slugs).toEqual(['single']);
  });

  it('fetches article by slug and returns null on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 1, slug: 'x', title_ka: 'ka', title_en: null }),
      } as Response);

    await expect(fetchArticleBySlug('https://api.example.com', 'x')).resolves.toBeNull();
    await expect(fetchArticleBySlug('https://api.example.com', 'x')).resolves.toEqual({
      id: 1,
      slug: 'x',
      title_ka: 'ka',
      title_en: null,
    });
  });

  it('fetches published articles page and filters unpublished records', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { id: 1, slug: 'a', title_ka: 'a', title_en: null, published: true },
          { id: 2, slug: 'b', title_ka: 'b', title_en: null, published: false },
        ],
        total: 2,
        page: 1,
        per_page: 10,
      }),
    } as Response);

    const result = await fetchPublishedArticlesPage('https://api.example.com', 1, 10);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(1);
    expect(result.total).toBe(2);
  });
});
