import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../auth/use-auth';
import { ArticleListCard } from '../../components/cards/article-list-card';
import { ConfirmModal } from '../../components/ui/confirm-modal';
import {
  articleIsPublished,
  deleteArticleById,
  DEFAULT_ARTICLES_QUERY,
  fetchArticles,
  getVisibleArticles,
  publishArticleDraft,
  type ArticleRecord,
} from '../../lib/articles';
import { isAdminRole } from '../../lib/permissions';
import { queryKeys } from '../../lib/query-keys';
import '../shared/content-page.scss';

function isNoDraftsResponse(error: unknown): boolean {
  const response = (error as { response?: { status?: number; data?: unknown } }).response;
  const status = response?.status;

  if (status === 404) {
    return true;
  }

  const detail = (response?.data as { detail?: unknown } | undefined)?.detail;
  const message = typeof detail === 'string' ? detail.toLowerCase() : '';

  return message.includes('no draft') || message.includes('not found');
}

export function ArticleDraftsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [busyArticleId, setBusyArticleId] = useState<number | null>(null);
  const [draftToDeleteId, setDraftToDeleteId] = useState<number | null>(null);

  const adminView = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const draftsQuery = useQuery<ArticleRecord[]>({
    queryKey: queryKeys.articleDrafts(adminView, user?.id),
    queryFn: async () => {
      try {
        const result = await fetchArticles(DEFAULT_ARTICLES_QUERY);
        const visibleArticles = getVisibleArticles(result.items, adminView, user?.id);
        return visibleArticles.filter((article) => !articleIsPublished(article));
      } catch (error) {
        if (isNoDraftsResponse(error)) {
          return [];
        }

        throw error;
      }
    },
  });

  useEffect(() => {
    if (draftsQuery.isError) {
      toast.error('Could not load article drafts.');
    }
  }, [draftsQuery.isError]);

  const publishDraftMutation = useMutation({
    mutationFn: publishArticleDraft,
    onSuccess: async (published) => {
      if (!published) {
        toast.error('Draft publish was not persisted by the server.');
      } else {
        toast.success('Draft published successfully.');
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.articleDrafts(adminView, user?.id),
      });
    },
    onError: () => {
      toast.error('Could not publish draft.');
    },
    onSettled: () => {
      setBusyArticleId(null);
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: deleteArticleById,
    onSuccess: async () => {
      toast.success('Draft deleted successfully.');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.articleDrafts(adminView, user?.id),
      });
    },
    onError: () => {
      toast.error('Could not delete draft.');
    },
    onSettled: () => {
      setBusyArticleId(null);
    },
  });

  const publishDraft = (articleId: number) => {
    setBusyArticleId(articleId);
    publishDraftMutation.mutate(articleId);
  };

  const removeDraft = (articleId: number) => {
    setBusyArticleId(articleId);
    deleteDraftMutation.mutate(articleId);
  };

  const drafts = draftsQuery.data ?? [];
  const loading = draftsQuery.isLoading;

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
              editLabel="დრაფტის რედაქტირება"
              showCategoryPrefix={false}
              forceDraftStatus
              onEdit={() =>
                navigate(`/articles/${draft.id}/edit`, {
                  state: { article: draft, returnTo: '/articles/drafts' },
                })
              }
              onPublishDraft={() => publishDraft(draft.id)}
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

          removeDraft(draftToDeleteId);
          setDraftToDeleteId(null);
        }}
      />
    </div>
  );
}
