import { getArticleOwnerId, type ArticleRecord } from './articles';
import { api } from './api';

const DELETED_ARTICLES_KEY = 'admin_deleted_articles_v1';
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export type DeletedArticleEntry = {
  id: number;
  title_ka: string;
  title_en?: string | null;
  category?: string | null;
  featured?: boolean;
  published?: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  owner_id?: string;
  deleted_at: string;
  delete_after: string;
};

function readRawDeletedArticles(): DeletedArticleEntry[] {
  try {
    const raw = localStorage.getItem(DELETED_ARTICLES_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as DeletedArticleEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRawDeletedArticles(items: DeletedArticleEntry[]) {
  localStorage.setItem(DELETED_ARTICLES_KEY, JSON.stringify(items));
}

function isExpired(entry: DeletedArticleEntry) {
  return Date.now() >= new Date(entry.delete_after).getTime();
}

async function pruneExpiredDeletedArticles(items: DeletedArticleEntry[]) {
  const expired = items.filter(isExpired);
  const active = items.filter((item) => !isExpired(item));

  if (expired.length > 0) {
    await Promise.all(
      expired.map(async (entry) => {
        try {
          await api.delete(`/api/articles/${entry.id}`);
        } catch {
          // Ignore purge errors; entry is removed from recycle bin regardless.
        }
      }),
    );
  }

  writeRawDeletedArticles(active);
  return active;
}

export async function listDeletedArticles() {
  const current = readRawDeletedArticles();
  return pruneExpiredDeletedArticles(current);
}

export async function getDeletedArticleIdSet() {
  const items = await listDeletedArticles();
  return new Set(items.map((item) => item.id));
}

export function moveArticleToDeleted(article: ArticleRecord) {
  const current = readRawDeletedArticles();
  const nowIso = new Date().toISOString();
  const deleteAfterIso = new Date(Date.now() + RETENTION_MS).toISOString();

  const nextEntry: DeletedArticleEntry = {
    id: article.id,
    title_ka: article.title_ka,
    title_en: article.title_en ?? null,
    category: article.category ?? null,
    featured: article.featured,
    published: article.published,
    published_at: article.published_at ?? null,
    created_at: article.created_at,
    updated_at: article.updated_at,
    owner_id: getArticleOwnerId(article) || undefined,
    deleted_at: nowIso,
    delete_after: deleteAfterIso,
  };

  const withoutCurrent = current.filter((item) => item.id !== article.id);
  writeRawDeletedArticles([nextEntry, ...withoutCurrent]);
}

export async function permanentlyDeleteArticle(articleId: number) {
  await api.delete(`/api/articles/${articleId}`);
  const current = readRawDeletedArticles();
  writeRawDeletedArticles(current.filter((item) => item.id !== articleId));
}

export function restoreDeletedArticle(articleId: number) {
  const current = readRawDeletedArticles();
  writeRawDeletedArticles(current.filter((item) => item.id !== articleId));
}

export async function moveDeletedArticleToDraft(articleId: number) {
  await api.put(`/api/articles/${articleId}`, {
    published: false,
    published_at: null,
  });

  restoreDeletedArticle(articleId);
}

export function canViewDeletedEntry(
  entry: DeletedArticleEntry,
  isAdmin: boolean,
  userId?: string | number,
) {
  if (isAdmin) {
    return true;
  }

  if (userId == null) {
    return false;
  }

  return entry.owner_id === String(userId);
}
