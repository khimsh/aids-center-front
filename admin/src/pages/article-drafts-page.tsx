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
      const result = await fetchArticles(DEFAULT_ARTICLES_QUERY);
      const visibleArticles = getVisibleArticles(result.items, adminView, user?.id);
      const nextDrafts = visibleArticles.filter((article) => !articleIsPublished(article));

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
      const published = await publishArticleDraft(articleId);
      if (!published) {
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
      await deleteArticleById(articleId);
      setDrafts((current) => current.filter((draft) => draft.id !== articleId));
      toast.success('Draft deleted successfully.');
    } catch {
      toast.error('Could not delete draft.');
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
            <ArticleListCard
              key={draft.id}
              article={draft}
              busy={busyArticleId === draft.id}
              editLabel="Edit Draft"
              showCategoryPrefix={false}
              forceDraftStatus
              onEdit={() => navigate(`/articles/${draft.id}/edit`, { state: { article: draft, returnTo: '/articles/drafts' } })}
              onPublishDraft={() => void publishDraft(draft.id)}
              onDelete={() => setDraftToDeleteId(draft.id)}
            />
          ))
        )}
      </div>

      <ConfirmModal
        open={draftToDeleteId !== null}
        title="Delete Draft"
        message="This will permanently delete the draft from backend and frontend lists."
        confirmLabel="Delete"
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
