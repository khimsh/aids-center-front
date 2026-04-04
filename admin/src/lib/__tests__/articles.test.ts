import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGetMock, apiPutMock, apiDeleteMock, getErrorStatusMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPutMock: vi.fn(),
  apiDeleteMock: vi.fn(),
  getErrorStatusMock: vi.fn(),
}));

vi.mock('../api', () => ({
  api: {
    get: apiGetMock,
    put: apiPutMock,
    delete: apiDeleteMock,
  },
  getErrorStatus: getErrorStatusMock,
}));

import {
  articleIsPublished,
  deleteArticleById,
  fetchArticles,
  filterArticlesByUser,
  getArticleOwnerId,
  getVisibleArticles,
  publishArticleDraft,
  type ArticleRecord,
} from '../articles';

describe('articles service', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPutMock.mockReset();
    apiDeleteMock.mockReset();
    getErrorStatusMock.mockReset();
  });

  it('resolves article owner id from fallback fields', () => {
    const article: ArticleRecord = { id: 1, title_ka: 'a', created_by: 33 };
    expect(getArticleOwnerId(article)).toBe('33');
  });

  it('filters articles by user id', () => {
    const items: ArticleRecord[] = [
      { id: 1, title_ka: 'a', author_id: 1 },
      { id: 2, title_ka: 'b', user_id: 2 },
    ];

    expect(filterArticlesByUser(items, 1)).toEqual([items[0]]);
  });

  it('returns all items for admin visibility', () => {
    const items: ArticleRecord[] = [{ id: 1, title_ka: 'a', author_id: 9 }];
    expect(getVisibleArticles(items, true, 22)).toEqual(items);
  });

  it('detects publish state from boolean and published_at fallback', () => {
    expect(articleIsPublished({ id: 1, title_ka: 'a', published: true })).toBe(true);
    expect(articleIsPublished({ id: 1, title_ka: 'a', published: false })).toBe(false);
    expect(articleIsPublished({ id: 1, title_ka: 'a', published_at: '2026-01-01T00:00:00Z' })).toBe(
      true,
    );
  });

  it('publishes a draft and reports persisted publish state', async () => {
    apiPutMock.mockResolvedValue({ data: { id: 1, title_ka: 'x', published: true } });

    await expect(publishArticleDraft(1)).resolves.toBe(true);
    expect(apiPutMock).toHaveBeenCalledWith(
      '/api/articles/1',
      expect.objectContaining({ published: true }),
    );
  });

  it('deletes article by id', async () => {
    apiDeleteMock.mockResolvedValue(undefined);
    await deleteArticleById(12);
    expect(apiDeleteMock).toHaveBeenCalledWith('/api/articles/12');
  });

  it('fetches array payload response', async () => {
    apiGetMock.mockResolvedValue({ data: [{ id: 1, title_ka: 'one' }] });

    await expect(fetchArticles()).resolves.toEqual({
      items: [{ id: 1, title_ka: 'one' }],
      total: 1,
    });
  });

  it('fallbacks when include_drafts causes 422 and retries without it', async () => {
    const failure = new Error('422');
    apiGetMock.mockRejectedValueOnce(failure);
    apiGetMock.mockResolvedValueOnce({ data: { items: [{ id: 3, title_ka: 'x' }], total: 1 } });
    getErrorStatusMock.mockReturnValue(422);

    await expect(fetchArticles({ include_drafts: true, page: 1 })).resolves.toEqual({
      items: [{ id: 3, title_ka: 'x' }],
      total: 1,
    });

    expect(apiGetMock).toHaveBeenCalledTimes(2);
    expect(apiGetMock).toHaveBeenNthCalledWith(2, '/api/articles', {
      params: { page: 1 },
    });
  });

  it('fallbacks when include_drafts causes 401 and retries without it', async () => {
    const failure = new Error('401');
    apiGetMock.mockRejectedValueOnce(failure);
    apiGetMock.mockResolvedValueOnce({ data: { items: [{ id: 8, title_ka: 'y' }], total: 1 } });
    getErrorStatusMock.mockReturnValue(401);

    await expect(fetchArticles({ include_drafts: true, page: 2 })).resolves.toEqual({
      items: [{ id: 8, title_ka: 'y' }],
      total: 1,
    });

    expect(apiGetMock).toHaveBeenCalledTimes(2);
    expect(apiGetMock).toHaveBeenNthCalledWith(2, '/api/articles', {
      params: { page: 2 },
    });
  });
});
