import { articleIsPublished, type ArticleRecord } from '../../lib/articles';
import { Button, ButtonAnchor } from '../ui/button';

type ArticleListCardProps = {
  article: ArticleRecord;
  busy: boolean;
  editLabel: string;
  viewPublishedUrl?: string;
  showEnglishTitle?: boolean;
  showCategoryPrefix?: boolean;
  forceDraftStatus?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPublishDraft?: () => void;
};

export function ArticleListCard({
  article,
  busy,
  editLabel,
  viewPublishedUrl,
  showEnglishTitle = false,
  showCategoryPrefix = true,
  forceDraftStatus = false,
  onEdit,
  onDelete,
  onPublishDraft,
}: ArticleListCardProps) {
  const isPublished = forceDraftStatus ? false : articleIsPublished(article);

  return (
    <article className="post-card">
      <div className="post-meta">
        <div className="post-badges">
          <span className={`status-pill ${isPublished ? 'published' : 'draft'}`}>
            {isPublished ? 'published' : 'draft'}
          </span>
          {article.featured ? <span className="status-pill featured">featured</span> : null}
        </div>
        <span>
          {new Date(article.updated_at ?? article.created_at ?? Date.now()).toLocaleString()}
        </span>
      </div>

      <h3>{article.title_ka}</h3>
      {showEnglishTitle && article.title_en ? <p className="hint">EN: {article.title_en}</p> : null}
      <p className="hint">
        {showCategoryPrefix
          ? `Category: ${article.category ?? 'uncategorized'}`
          : (article.category ?? 'uncategorized')}
      </p>

      <div className="post-actions">
        <Button type="button" variant="secondary" onClick={onEdit} disabled={busy}>
          {editLabel}
        </Button>

        {isPublished && viewPublishedUrl ? (
          <ButtonAnchor variant="secondary" href={viewPublishedUrl}>
            View Published
          </ButtonAnchor>
        ) : null}

        {!isPublished && onPublishDraft ? (
          <Button type="button" onClick={onPublishDraft} disabled={busy}>
            Publish Draft
          </Button>
        ) : null}

        <Button type="button" variant="secondary" onClick={onDelete} disabled={busy}>
          Delete
        </Button>
      </div>
    </article>
  );
}
