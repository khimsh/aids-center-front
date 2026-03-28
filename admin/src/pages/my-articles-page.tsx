import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/use-auth';
import { ArticleListCard } from '../components/article-list-card';
import { ConfirmModal } from '../components/confirm-modal';
import {
  articleIsPublished,
  deleteArticleById,
  DEFAULT_ARTICLES_QUERY,
  fetchArticles,
  getVisibleArticles,
  isAdminRole,
  publishArticleDraft,
  type ArticleRecord
} from '../lib/articles';
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
  const { user } = useAuth();
  const [articles, setArticles] = useState<ArticleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyArticleId, setBusyArticleId] = useState<number | null>(null);
  const [articleToDeleteId, setArticleToDeleteId] = useState<number | null>(null);

  const adminView = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const loadArticles = useCallback(async () => {
    try {
      const result = await fetchArticles(DEFAULT_ARTICLES_QUERY);
      const visible = getVisibleArticles(result.items, adminView, user?.id);
      const withSlugs = await attachPublishedSlugs(visible);
      setArticles(withSlugs);
    } catch {
      toast.error('Could not load articles.');
    } finally {
      setLoading(false);
    }
  }, [adminView, user?.id]);

  useEffect(() => {
    setLoading(true);
    void loadArticles();
  }, [loadArticles]);

  const publishDraft = async (articleId: number) => {
    setBusyArticleId(articleId);

    try {
      const published = await publishArticleDraft(articleId);
      if (!published) {
        toast.error('Draft publish was not persisted by the server.');
      }

      await loadArticles();
      toast.success('Draft published successfully.');
    } catch {
      toast.error('Could not publish draft.');
    } finally {
      setBusyArticleId(null);
    }
  };

  const removeArticle = async (articleId: number) => {
    setBusyArticleId(articleId);

    try {
      await deleteArticleById(articleId);
      setArticles((current) => current.filter((article) => article.id !== articleId));
      toast.success('Article deleted successfully.');
    } catch {
      toast.error('Could not delete article.');
    } finally {
      setBusyArticleId(null);
    }
  };

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
                onPublishDraft={() => void publishDraft(article.id)}
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

          void removeArticle(articleToDeleteId);
          setArticleToDeleteId(null);
        }}
      />
    </div>
  );
}
