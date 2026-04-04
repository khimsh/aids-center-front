import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../../auth/use-auth';
import { Button } from '../../components/ui/button';
import { ConfirmModal } from '../../components/ui/confirm-modal';
import {
  canViewDeletedEntry,
  listDeletedArticles,
  moveDeletedArticleToDraft,
  permanentlyDeleteArticle,
  restoreDeletedArticle,
  type DeletedArticleEntry,
} from '../../lib/deleted-articles';
import { articleIsPublished } from '../../lib/articles';
import { isAdminRole } from '../../lib/permissions';
import { queryKeys } from '../../lib/query-keys';
import '../shared/content-page.scss';

function getDaysLeft(deleteAfterIso: string) {
  const msLeft = new Date(deleteAfterIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

export function DeletedArticlesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [busyArticleId, setBusyArticleId] = useState<number | null>(null);
  const [itemToPermanentlyDeleteId, setItemToPermanentlyDeleteId] = useState<number | null>(null);

  const adminView = useMemo(() => isAdminRole(user?.role), [user?.role]);
  const deletedQueryKey = queryKeys.deletedArticles(adminView, user?.id);

  const deletedItemsQuery = useQuery<DeletedArticleEntry[]>({
    queryKey: deletedQueryKey,
    queryFn: async () => {
      const all = await listDeletedArticles();
      return all.filter((item) => canViewDeletedEntry(item, adminView, user?.id));
    },
  });

  useEffect(() => {
    if (deletedItemsQuery.isError) {
      toast.error('Could not load Deleted items.');
    }
  }, [deletedItemsQuery.isError]);

  const permanentlyDeleteMutation = useMutation({
    mutationFn: permanentlyDeleteArticle,
    onSuccess: async () => {
      toast.success('Article permanently deleted.');
      await queryClient.invalidateQueries({ queryKey: deletedQueryKey });
    },
    onError: () => {
      toast.error('Could not permanently delete article.');
    },
    onSettled: () => {
      setBusyArticleId(null);
    },
  });

  const moveToDraftsMutation = useMutation({
    mutationFn: moveDeletedArticleToDraft,
    onSuccess: async () => {
      toast.success('Article moved to drafts and restored.');
      await queryClient.invalidateQueries({ queryKey: deletedQueryKey });
    },
    onError: () => {
      toast.error('Could not move article to drafts.');
    },
    onSettled: () => {
      setBusyArticleId(null);
    },
  });

  const permanentlyDelete = (articleId: number) => {
    setBusyArticleId(articleId);
    permanentlyDeleteMutation.mutate(articleId);
  };

  const restoreArticle = async (articleId: number) => {
    restoreDeletedArticle(articleId);
    toast.success('Article restored.');
    await queryClient.invalidateQueries({ queryKey: deletedQueryKey });
  };

  const moveToDrafts = (articleId: number) => {
    setBusyArticleId(articleId);
    moveToDraftsMutation.mutate(articleId);
  };

  const items = deletedItemsQuery.data ?? [];
  const loading = deletedItemsQuery.isLoading;

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>Deleted Articles</h1>
          <p className="hint">Deleted items are kept for 30 days and then auto-purged.</p>
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
                  <span
                    className={`status-pill ${articleIsPublished(item) ? 'published' : 'draft'}`}
                  >
                    {articleIsPublished(item) ? 'published' : 'draft'}
                  </span>
                  {item.featured ? <span className="status-pill featured">featured</span> : null}
                </div>
                <span>Deleted: {new Date(item.deleted_at).toLocaleString()}</span>
              </div>
              <h3>{item.title_ka}</h3>
              {item.title_en ? <p className="hint">EN: {item.title_en}</p> : null}
              <p className="hint">Category: {item.category ?? 'uncategorized'}</p>
              <p className="hint">
                Will be permanently deleted in {getDaysLeft(item.delete_after)} day(s).
              </p>

              <div className="post-actions">
                <Button
                  type="button"
                  onClick={() => void restoreArticle(item.id)}
                  disabled={busyArticleId === item.id}
                >
                  Restore
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => moveToDrafts(item.id)}
                  disabled={busyArticleId === item.id}
                >
                  Move to Drafts
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setItemToPermanentlyDeleteId(item.id)}
                  disabled={busyArticleId === item.id}
                >
                  Delete Permanently
                </Button>
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

          permanentlyDelete(itemToPermanentlyDeleteId);
          setItemToPermanentlyDeleteId(null);
        }}
      />
    </div>
  );
}
