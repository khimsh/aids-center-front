export type ArticleListItem = {
  id?: number;
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
  featured?: boolean;
  published?: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ArticleListResponse =
  | ArticleDetails[]
  | {
      items?: ArticleDetails[];
      total?: number;
      page?: number;
      per_page?: number;
    };

export type PaginatedArticlesResult = {
  items: ArticleDetails[];
  total: number;
  page: number;
  perPage: number;
};

export function getArticlesApiBase(): string {
  return import.meta.env.PUBLIC_API_URL?.trim() || 'http://localhost:8000';
}

export async function fetchArticleSlugs(apiBase: string): Promise<string[]> {
  const collected = new Set<string>();
  const perPage = 100;

  let response = await fetch(`${apiBase}/api/articles?page=1&per_page=${perPage}`);

  if (!response.ok && response.status === 422) {
    response = await fetch(`${apiBase}/api/articles`);
  }

  if (!response.ok) {
    throw new Error(`List fetch failed: ${response.status}`);
  }

  const firstPayload = (await response.json()) as ArticleListResponse;

  if (Array.isArray(firstPayload)) {
    firstPayload
      .map((item) => item.slug?.trim())
      .filter((slug): slug is string => Boolean(slug))
      .forEach((slug) => collected.add(slug));

    return Array.from(collected);
  }

  const firstItems = firstPayload.items ?? [];
  firstItems
    .map((item) => item.slug?.trim())
    .filter((slug): slug is string => Boolean(slug))
    .forEach((slug) => collected.add(slug));

  const reportedPerPage = firstPayload.per_page ?? perPage;
  const totalPagesFromTotal = firstPayload.total
    ? Math.max(1, Math.ceil(firstPayload.total / reportedPerPage))
    : null;

  if (totalPagesFromTotal) {
    for (let page = 2; page <= totalPagesFromTotal; page += 1) {
      const pageResponse = await fetch(
        `${apiBase}/api/articles?page=${page}&per_page=${reportedPerPage}`,
      );

      if (!pageResponse.ok) {
        break;
      }

      const pagePayload = (await pageResponse.json()) as ArticleListResponse;
      const pageItems = Array.isArray(pagePayload) ? pagePayload : (pagePayload.items ?? []);

      pageItems
        .map((item) => item.slug?.trim())
        .filter((slug): slug is string => Boolean(slug))
        .forEach((slug) => collected.add(slug));
    }

    return Array.from(collected);
  }

  // Fallback when total/per_page is unavailable: keep requesting until page is empty.
  for (let page = 2; page <= 200; page += 1) {
    const pageResponse = await fetch(
      `${apiBase}/api/articles?page=${page}&per_page=${reportedPerPage}`,
    );

    if (!pageResponse.ok) {
      break;
    }

    const pagePayload = (await pageResponse.json()) as ArticleListResponse;
    const pageItems = Array.isArray(pagePayload) ? pagePayload : (pagePayload.items ?? []);

    if (pageItems.length === 0) {
      break;
    }

    pageItems
      .map((item) => item.slug?.trim())
      .filter((slug): slug is string => Boolean(slug))
      .forEach((slug) => collected.add(slug));

    if (pageItems.length < reportedPerPage) {
      break;
    }
  }

  return Array.from(collected);
}

export async function fetchArticleBySlug(
  apiBase: string,
  slug: string,
): Promise<ArticleDetails | null> {
  const response = await fetch(`${apiBase}/api/articles/${encodeURIComponent(slug)}`);
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ArticleDetails;
}

export function isArticlePublished(
  article: Pick<ArticleDetails, 'published' | 'published_at'>,
): boolean {
  if (typeof article.published === 'boolean') {
    return article.published;
  }

  if (article.published == null && article.published_at == null) {
    return true;
  }

  return Boolean(article.published_at);
}

export async function fetchPublishedArticlesPage(
  apiBase: string,
  page: number,
  perPage: number,
): Promise<PaginatedArticlesResult> {
  let response = await fetch(`${apiBase}/api/articles?page=${page}&per_page=${perPage}`);

  if (!response.ok && response.status === 422) {
    response = await fetch(`${apiBase}/api/articles`);
  }

  if (!response.ok) {
    throw new Error(`Published articles fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as ArticleListResponse;
  const items = Array.isArray(data) ? data : (data.items ?? []);
  const publishedItems = items.filter((item) => isArticlePublished(item));

  if (Array.isArray(data)) {
    const startIndex = Math.max(0, (page - 1) * perPage);

    return {
      items: publishedItems.slice(startIndex, startIndex + perPage),
      total: publishedItems.length,
      page,
      perPage,
    };
  }

  return {
    items: publishedItems,
    total: data.total ?? publishedItems.length,
    page: data.page ?? page,
    perPage: data.per_page ?? perPage,
  };
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
