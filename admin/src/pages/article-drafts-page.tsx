import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/use-auth';
import { ConfirmModal } from '../components/confirm-modal';
import { articleIsPublished, filterArticlesByUser, fetchArticles, isAdminRole, type ArticleRecord } from '../lib/articles';
import { getDeletedArticleIdSet, moveArticleToDeleted } from '../lib/deleted-articles';
import { api } from '../lib/api';
import './posts-page.css';

export function ArticleDraftsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<ArticleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyArticleId, setBusyArticleId] = useState<number | null>(null);
  const [draftToDeleteId, setDraftToDeleteId] = useState<number | null>(null);

  const adminView = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const loadDrafts = useCallback(async () => {
    try {
      const result = await fetchArticles({ page: 1, per_page: 200, include_drafts: true });
      const deletedIds = await getDeletedArticleIdSet();
      let nextDrafts = result.items
        .filter((article) => !deletedIds.has(article.id))
        .filter((article) => !articleIsPublished(article));

      if (!adminView) {
        nextDrafts = filterArticlesByUser(nextDrafts, user?.id);
      }

      setDrafts(nextDrafts);
    } catch {
      toast.error('Could not load article drafts.');
    } finally {
      setLoading(false);
    }
  }, [adminView, user?.id]);

  useEffect(() => {
    setLoading(true);
    void loadDrafts();
  }, [loadDrafts]);

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

      await loadDrafts();
      toast.success('Draft published successfully.');
    } catch {
      toast.error('Could not publish draft.');
    } finally {
      setBusyArticleId(null);
    }
  };

  const removeDraft = async (articleId: number) => {
    setBusyArticleId(articleId);

    try {
      const item = drafts.find((draft) => draft.id === articleId);
      if (!item) {
        toast.error('Draft not found.');
        return;
      }

      moveArticleToDeleted(item);
      setDrafts((current) => current.filter((draft) => draft.id !== articleId));
      toast.success('Draft moved to Deleted. It will be kept for 30 days.');
    } catch {
      toast.error('Could not move draft to Deleted.');
    } finally {
      setBusyArticleId(null);
    }
  };

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>Article Drafts</h1>
          <p className="hint">
            {adminView ? 'Manage all article drafts across users.' : 'Manage your draft articles.'}
          </p>
        </div>
      </div>

      <div className="posts-list">
        {loading ? <p className="hint">Loading drafts...</p> : null}

        {!loading && drafts.length === 0 ? (
          <p className="hint">No drafts found.</p>
        ) : (
          drafts.map((draft) => (
            <article className="post-card" key={draft.id}>
              <div className="post-meta">
                <div className="post-badges">
                  <span className="status-pill draft">draft</span>
                  {draft.featured ? <span className="status-pill featured">featured</span> : null}
                </div>
                <span>{new Date(draft.updated_at ?? draft.created_at ?? Date.now()).toLocaleString()}</span>
              </div>
              <h3>{draft.title_ka}</h3>
              <p className="hint">{draft.category ?? 'uncategorized'}</p>
              <div className="post-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => navigate(`/articles/${draft.id}/edit`, { state: { article: draft, returnTo: '/articles/drafts' } })}
                  disabled={busyArticleId === draft.id}
                >
                  Edit Draft
                </button>
                <button
                  type="button"
                  onClick={() => void publishDraft(draft.id)}
                  disabled={busyArticleId === draft.id}
                >
                  Publish Draft
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setDraftToDeleteId(draft.id)}
                  disabled={busyArticleId === draft.id}
                >
                  Move to Deleted
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <ConfirmModal
        open={draftToDeleteId !== null}
        title="Move Draft to Deleted"
        message="This draft will be removed from active drafts and kept for 30 days in Deleted."
        confirmLabel="Move"
        destructive
        busy={draftToDeleteId !== null && busyArticleId === draftToDeleteId}
        onCancel={() => setDraftToDeleteId(null)}
        onConfirm={() => {
          if (draftToDeleteId == null) {
            return;
          }

          void removeDraft(draftToDeleteId);
          setDraftToDeleteId(null);
        }}
      />
    </div>
  );
}
