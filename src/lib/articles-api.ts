export type ArticleListItem = {
  slug?: string | null;
};

export type ArticleDetails = {
  id: number;
  slug: string;
  title_ka: string;
  title_en: string | null;
  body_ka?: string | null;
  body_en?: string | null;
  image_url?: string | null;
  category?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ArticlesResponse =
  | ArticleListItem[]
  | {
      items?: ArticleListItem[];
    };

export function getArticlesApiBase(): string {
  return import.meta.env.PUBLIC_API_URL?.trim() || 'http://localhost:8000';
}

export async function fetchArticleSlugs(apiBase: string): Promise<string[]> {
  let response = await fetch(`${apiBase}/api/articles?page=1&per_page=500`);

  if (!response.ok && response.status === 422) {
    response = await fetch(`${apiBase}/api/articles`);
  }

  if (!response.ok) {
    throw new Error(`List fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as ArticlesResponse;
  const items = Array.isArray(data) ? data : (data.items ?? []);

  return items
    .map((item) => item.slug?.trim())
    .filter((slug): slug is string => Boolean(slug));
}

export async function fetchArticleBySlug(
  apiBase: string,
  slug: string
): Promise<ArticleDetails | null> {
  const response = await fetch(`${apiBase}/api/articles/${encodeURIComponent(slug)}`);
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ArticleDetails;
}

export function toAbsoluteImageUrl(apiBase: string, value?: string | null): string {
  const raw = value?.trim();
  if (!raw) {
    return '';
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith('/')) {
    return `${apiBase}${raw}`;
  }

  return `${apiBase}/${raw}`;
}
