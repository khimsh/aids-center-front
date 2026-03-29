import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/use-auth';
import { ArticleListCard } from '../components/cards/article-list-card';
import { ConfirmModal } from '../components/ui/confirm-modal';
import {
  articleIsPublished,
  deleteArticleById,
  DEFAULT_ARTICLES_QUERY,
  fetchArticles,
  getVisibleArticles,
  publishArticleDraft,
  type ArticleRecord
} from '../lib/articles';
import { isAdminRole } from '../lib/permissions';
import { queryKeys } from '../lib/query-keys';
import './posts-page.css';

const configuredPublicSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim();
const configuredSiteUrlFallback = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();

function getPublicSiteBase(): string {
  if (configuredPublicSiteUrl) {
    return configuredPublicSiteUrl.replace(/\/$/, '');
  }

  if (configuredSiteUrlFallback) {
    return configuredSiteUrlFallback.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { protocol, hostname, origin } = window.location;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalHost) {
    return `${protocol}//${hostname}:4321`;
  }

  return origin;
}

function getPublicArticleUrl(article: ArticleRecord): string | undefined {
  const slug = article.slug?.trim();
  if (!slug || !articleIsPublished(article)) {
    return undefined;
  }

  const base = getPublicSiteBase();
  if (!base) {
    return undefined;
  }

  return `${base}/news/${encodeURIComponent(slug)}`;
}

async function attachPublishedSlugs(items: ArticleRecord[]): Promise<ArticleRecord[]> {
  return items;
}

export function MyArticlesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [busyArticleId, setBusyArticleId] = useState<number | null>(null);
  const [articleToDeleteId, setArticleToDeleteId] = useState<number | null>(null);

  const adminView = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const articlesQuery = useQuery<ArticleRecord[]>({
    queryKey: queryKeys.myArticles(adminView, user?.id),
    queryFn: async () => {
      const result = await fetchArticles(DEFAULT_ARTICLES_QUERY);
      const visible = getVisibleArticles(result.items, adminView, user?.id);
      return attachPublishedSlugs(visible);
    }
  });

  useEffect(() => {
    if (articlesQuery.isError) {
      toast.error('Could not load articles.');
    }
  }, [articlesQuery.isError]);

  const publishDraftMutation = useMutation({
    mutationFn: publishArticleDraft,
    onSuccess: async (published) => {
      if (!published) {
        toast.error('Draft publish was not persisted by the server.');
      } else {
        toast.success('Draft published successfully.');
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.myArticles(adminView, user?.id) });
    },
    onError: () => {
      toast.error('Could not publish draft.');
    },
    onSettled: () => {
      setBusyArticleId(null);
    }
  });

  const removeArticleMutation = useMutation({
    mutationFn: deleteArticleById,
    onSuccess: async () => {
      toast.success('Article deleted successfully.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.myArticles(adminView, user?.id) });
    },
    onError: () => {
      toast.error('Could not delete article.');
    },
    onSettled: () => {
      setBusyArticleId(null);
    }
  });

  const publishDraft = (articleId: number) => {
    setBusyArticleId(articleId);
    publishDraftMutation.mutate(articleId);
  };

  const removeArticle = (articleId: number) => {
    setBusyArticleId(articleId);
    removeArticleMutation.mutate(articleId);
  };

  const articles = articlesQuery.data ?? [];
  const loading = articlesQuery.isLoading;

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>{adminView ? 'All Articles' : 'My Articles'}</h1>
          <p className="hint">
            {adminView ? 'All articles created by all users.' : 'All articles you have created.'}
          </p>
        </div>
      </div>

      <div className="posts-list">
        {loading ? <p className="hint">Loading articles...</p> : null}

        {!loading && articles.length === 0 ? (
          <p className="hint">No articles found.</p>
        ) : (
          articles.map((article) => {
            const isPublished = articleIsPublished(article);

            return (
              <ArticleListCard
                key={article.id}
                article={article}
                busy={busyArticleId === article.id}
                editLabel={isPublished ? 'Edit Article' : 'Edit Draft'}
                viewPublishedUrl={getPublicArticleUrl(article)}
                showEnglishTitle
                onEdit={() => navigate(`/articles/${article.id}/edit`, { state: { article, returnTo: '/articles/mine' } })}
                onPublishDraft={() => publishDraft(article.id)}
                onDelete={() => setArticleToDeleteId(article.id)}
              />
            );
          })
        )}
      </div>

      <ConfirmModal
        open={articleToDeleteId !== null}
        title="Delete Article"
        message="This will permanently delete the article from backend and frontend lists."
        confirmLabel="Delete"
        destructive
        busy={articleToDeleteId !== null && busyArticleId === articleToDeleteId}
        onCancel={() => setArticleToDeleteId(null)}
        onConfirm={() => {
          if (articleToDeleteId == null) {
            return;
          }

          removeArticle(articleToDeleteId);
          setArticleToDeleteId(null);
        }}
      />
    </div>
  );
}
