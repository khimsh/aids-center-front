import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/use-auth';
import { ConfirmModal } from '../components/confirm-modal';
import { articleIsPublished, filterArticlesByUser, fetchArticles, isAdminRole, type ArticleRecord } from '../lib/articles';
import { getDeletedArticleIdSet, moveArticleToDeleted } from '../lib/deleted-articles';
import { api } from '../lib/api';
import './posts-page.css';

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
      const result = await fetchArticles({ page: 1, per_page: 200, include_drafts: true });
      const deletedIds = await getDeletedArticleIdSet();
      let nextArticles = result.items.filter((article) => !deletedIds.has(article.id));

      if (!adminView) {
        nextArticles = filterArticlesByUser(nextArticles, user?.id);
      }

      setArticles(nextArticles);
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
      const response = await api.put(`/api/articles/${articleId}`, {
        published: true,
        published_at: new Date().toISOString()
      });

      const published = response.data as ArticleRecord;

      if (!articleIsPublished(published)) {
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
      const item = articles.find((article) => article.id === articleId);
      if (!item) {
        toast.error('Article not found.');
        return;
      }

      moveArticleToDeleted(item);
      setArticles((current) => current.filter((article) => article.id !== articleId));
      toast.success('Article moved to Deleted. It will be kept for 30 days.');
    } catch {
      toast.error('Could not move article to Deleted.');
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
              <article className="post-card" key={article.id}>
                <div className="post-meta">
                  <div className="post-badges">
                    <span className={`status-pill ${isPublished ? 'published' : 'draft'}`}>
                      {isPublished ? 'published' : 'draft'}
                    </span>
                    {article.featured ? <span className="status-pill featured">featured</span> : null}
                  </div>
                  <span>{new Date(article.updated_at ?? article.created_at ?? Date.now()).toLocaleString()}</span>
                </div>
                <h3>{article.title_ka}</h3>
                {article.title_en ? <p className="hint">EN: {article.title_en}</p> : null}
                <p className="hint">Category: {article.category ?? 'uncategorized'}</p>
                <div className="post-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => navigate(`/articles/${article.id}/edit`, { state: { article, returnTo: '/articles/mine' } })}
                    disabled={busyArticleId === article.id}
                  >
                    {isPublished ? 'Edit Article' : 'Edit Draft'}
                  </button>
                  {!isPublished ? (
                    <button
                      type="button"
                      onClick={() => void publishDraft(article.id)}
                      disabled={busyArticleId === article.id}
                    >
                      Publish Draft
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setArticleToDeleteId(article.id)}
                    disabled={busyArticleId === article.id}
                  >
                    Move to Deleted
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

        <ConfirmModal
          open={articleToDeleteId !== null}
          title="Move Article to Deleted"
          message="This article will be hidden from active lists and kept for 30 days in Deleted."
          confirmLabel="Move"
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
