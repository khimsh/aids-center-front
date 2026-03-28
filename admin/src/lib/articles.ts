import { api } from './api';

export type ArticleRecord = {
  id: number;
  slug?: string | null;
  title_ka: string;
  title_en?: string | null;
  body_ka?: string | null;
  body_en?: string | null;
  image_url?: string | null;
  category?: string | null;
  featured?: boolean;
  published?: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  author_id?: string | number | null;
  user_id?: string | number | null;
  created_by?: string | number | null;
  author?: {
    id?: string | number;
    email?: string;
    full_name?: string;
  } | null;
};

type ArticleListResponse = {
  items?: ArticleRecord[];
  total?: number;
};

export type ArticleListResult = {
  items: ArticleRecord[];
  total: number;
};

export const DEFAULT_ARTICLES_QUERY = {
  page: 1,
  per_page: 200,
  include_drafts: true
} as const;

export function isAdminRole(role?: string) {
  const normalized = (role ?? '').toLowerCase();
  return normalized === 'admin' || normalized === 'superadmin';
}

export function getArticleOwnerId(article: ArticleRecord): string {
  const candidate = article.author_id ?? article.user_id ?? article.created_by ?? article.author?.id;
  return candidate == null ? '' : String(candidate);
}

export function filterArticlesByUser(items: ArticleRecord[], userId?: string | number) {
  if (userId == null) {
    return items;
  }

  const ownerId = String(userId);
  return items.filter((item) => getArticleOwnerId(item) === ownerId);
}

export function getVisibleArticles(items: ArticleRecord[], adminView: boolean, userId?: string | number) {
  if (adminView) {
    return items;
  }

  return filterArticlesByUser(items, userId);
}

export async function publishArticleDraft(articleId: number): Promise<boolean> {
  const response = await api.put(`/api/articles/${articleId}`, {
    published: true,
    published_at: new Date().toISOString()
  });

  const published = response.data as ArticleRecord;
  return articleIsPublished(published);
}

export async function deleteArticleById(articleId: number) {
  await api.delete(`/api/articles/${articleId}`);
}

export function articleIsPublished(article: ArticleRecord): boolean {
  if (typeof article.published === 'boolean') {
    return article.published;
  }

  return Boolean(article.published_at);
}

export async function fetchArticles(params?: Record<string, unknown>): Promise<ArticleListResult> {
  let response;

  try {
    response = await api.get('/api/articles', { params });
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    const hasIncludeDrafts = typeof params !== 'undefined' && Object.prototype.hasOwnProperty.call(params, 'include_drafts');

    if (status === 422 && hasIncludeDrafts) {
      const fallbackParams = { ...(params ?? {}) };
      delete fallbackParams.include_drafts;
      response = await api.get('/api/articles', { params: fallbackParams });
    } else {
      throw error;
    }
  }

  const data = response.data as ArticleListResponse | ArticleRecord[];

  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length
    };
  }

  const items = data?.items ?? [];
  return {
    items,
    total: data?.total ?? items.length
  };
}
