import { articleIsPublished, type ArticleRecord } from '../../lib/articles';

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
  onPublishDraft
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
        <span>{new Date(article.updated_at ?? article.created_at ?? Date.now()).toLocaleString()}</span>
      </div>

      <h3>{article.title_ka}</h3>
      {showEnglishTitle && article.title_en ? <p className="hint">EN: {article.title_en}</p> : null}
      <p className="hint">{showCategoryPrefix ? `Category: ${article.category ?? 'uncategorized'}` : (article.category ?? 'uncategorized')}</p>

      <div className="post-actions">
        <button type="button" className="button-secondary" onClick={onEdit} disabled={busy}>
          {editLabel}
        </button>

        {isPublished && viewPublishedUrl ? (
          <a className="button-secondary" href={viewPublishedUrl}>
            View Published
          </a>
        ) : null}

        {!isPublished && onPublishDraft ? (
          <button type="button" onClick={onPublishDraft} disabled={busy}>
            Publish Draft
          </button>
        ) : null}

        <button type="button" className="button-secondary" onClick={onDelete} disabled={busy}>
          Delete
        </button>
      </div>
    </article>
  );
}