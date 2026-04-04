import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiDeleteMock, apiPutMock } = vi.hoisted(() => ({
  apiDeleteMock: vi.fn(),
  apiPutMock: vi.fn(),
}));

vi.mock('../api', () => ({
  api: {
    delete: apiDeleteMock,
    put: apiPutMock,
  },
}));

import {
  canViewDeletedEntry,
  listDeletedArticles,
  moveArticleToDeleted,
  restoreDeletedArticle,
  type DeletedArticleEntry,
} from '../deleted-articles';

const STORAGE_KEY = 'admin_deleted_articles_v1';

describe('deleted articles lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    apiDeleteMock.mockReset();
    apiPutMock.mockReset();
  });

  it('moves an article to deleted storage and can restore it', () => {
    moveArticleToDeleted({
      id: 12,
      title_ka: 'test title',
      author_id: 77,
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw as string) as DeletedArticleEntry[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(12);
    expect(parsed[0].owner_id).toBe('77');

    restoreDeletedArticle(12);

    const restoredRaw = localStorage.getItem(STORAGE_KEY);
    const restored = JSON.parse(restoredRaw as string) as DeletedArticleEntry[];
    expect(restored).toHaveLength(0);
  });

  it('prunes expired entries and calls backend purge', async () => {
    const now = Date.now();
    const expired: DeletedArticleEntry = {
      id: 1,
      title_ka: 'expired',
      deleted_at: new Date(now - 10000).toISOString(),
      delete_after: new Date(now - 1000).toISOString(),
    };
    const active: DeletedArticleEntry = {
      id: 2,
      title_ka: 'active',
      deleted_at: new Date(now).toISOString(),
      delete_after: new Date(now + 86_400_000).toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([expired, active]));

    const items = await listDeletedArticles();

    expect(apiDeleteMock).toHaveBeenCalledTimes(1);
    expect(apiDeleteMock).toHaveBeenCalledWith('/api/articles/1');
    expect(items).toEqual([active]);
  });

  it('applies visibility checks by role and owner', () => {
    const entry: DeletedArticleEntry = {
      id: 9,
      title_ka: 'record',
      owner_id: '100',
      deleted_at: new Date().toISOString(),
      delete_after: new Date(Date.now() + 1000).toISOString(),
    };

    expect(canViewDeletedEntry(entry, true, undefined)).toBe(true);
    expect(canViewDeletedEntry(entry, false, 100)).toBe(true);
    expect(canViewDeletedEntry(entry, false, 200)).toBe(false);
    expect(canViewDeletedEntry(entry, false, undefined)).toBe(false);
  });
});
