import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/use-auth';
import { ConfirmModal } from '../components/ui/confirm-modal';
import {
  canViewDeletedEntry,
  listDeletedArticles,
  moveDeletedArticleToDraft,
  permanentlyDeleteArticle,
  restoreDeletedArticle,
  type DeletedArticleEntry
} from '../lib/deleted-articles';
import { articleIsPublished } from '../lib/articles';
import { isAdminRole } from '../lib/permissions';
import './posts-page.css';

function getDaysLeft(deleteAfterIso: string) {
  const msLeft = new Date(deleteAfterIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

export function DeletedArticlesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<DeletedArticleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyArticleId, setBusyArticleId] = useState<number | null>(null);
  const [itemToPermanentlyDeleteId, setItemToPermanentlyDeleteId] = useState<number | null>(null);

  const adminView = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const loadDeleted = useCallback(async () => {
    try {
      const all = await listDeletedArticles();
      const visible = all.filter((item) => canViewDeletedEntry(item, adminView, user?.id));
      setItems(visible);
    } catch {
      toast.error('Could not load Deleted items.');
    } finally {
      setLoading(false);
    }
  }, [adminView, user?.id]);

  useEffect(() => {
    setLoading(true);
    void loadDeleted();
  }, [loadDeleted]);

  const permanentlyDelete = async (articleId: number) => {
    setBusyArticleId(articleId);

    try {
      await permanentlyDeleteArticle(articleId);
      setItems((current) => current.filter((item) => item.id !== articleId));
      toast.success('Article permanently deleted.');
    } catch {
      toast.error('Could not permanently delete article.');
    } finally {
      setBusyArticleId(null);
    }
  };

  const restoreArticle = (articleId: number) => {
    restoreDeletedArticle(articleId);
    setItems((current) => current.filter((item) => item.id !== articleId));
    toast.success('Article restored.');
  };

  const moveToDrafts = async (articleId: number) => {
    setBusyArticleId(articleId);

    try {
      await moveDeletedArticleToDraft(articleId);
      setItems((current) => current.filter((item) => item.id !== articleId));
      toast.success('Article moved to drafts and restored.');
    } catch {
      toast.error('Could not move article to drafts.');
    } finally {
      setBusyArticleId(null);
    }
  };

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>Deleted Articles</h1>
          <p className="hint">
            Deleted items are kept for 30 days and then auto-purged.
          </p>
        </div>
      </div>

      <div className="posts-list">
        {loading ? <p className="hint">Loading deleted items...</p> : null}

        {!loading && items.length === 0 ? (
          <p className="hint">No deleted items.</p>
        ) : (
          items.map((item) => (
            <article className="post-card" key={item.id}>
              <div className="post-meta">
                <div className="post-badges">
                  <span className={`status-pill ${articleIsPublished(item) ? 'published' : 'draft'}`}>
                    {articleIsPublished(item) ? 'published' : 'draft'}
                  </span>
                  {item.featured ? <span className="status-pill featured">featured</span> : null}
                </div>
                <span>Deleted: {new Date(item.deleted_at).toLocaleString()}</span>
              </div>
              <h3>{item.title_ka}</h3>
              {item.title_en ? <p className="hint">EN: {item.title_en}</p> : null}
              <p className="hint">Category: {item.category ?? 'uncategorized'}</p>
              <p className="hint">Will be permanently deleted in {getDaysLeft(item.delete_after)} day(s).</p>

              <div className="post-actions">
                <button
                  type="button"
                  onClick={() => restoreArticle(item.id)}
                  disabled={busyArticleId === item.id}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => void moveToDrafts(item.id)}
                  disabled={busyArticleId === item.id}
                >
                  Move to Drafts
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setItemToPermanentlyDeleteId(item.id)}
                  disabled={busyArticleId === item.id}
                >
                  Delete Permanently
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <ConfirmModal
        open={itemToPermanentlyDeleteId !== null}
        title="Delete Permanently"
        message="This will permanently remove the article and cannot be undone."
        confirmLabel="Delete Permanently"
        destructive
        busy={itemToPermanentlyDeleteId !== null && busyArticleId === itemToPermanentlyDeleteId}
        onCancel={() => setItemToPermanentlyDeleteId(null)}
        onConfirm={() => {
          if (itemToPermanentlyDeleteId == null) {
            return;
          }

          void permanentlyDelete(itemToPermanentlyDeleteId);
          setItemToPermanentlyDeleteId(null);
        }}
      />
    </div>
  );
}
