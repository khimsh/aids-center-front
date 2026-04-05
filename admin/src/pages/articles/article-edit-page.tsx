import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArticleForm } from '../../components/forms/article-form';
import type { ArticleRecord } from '../../lib/articles';
import '../shared/content-page.scss';

export function ArticleEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const routeState = location.state as {
    draft?: ArticleRecord;
    article?: ArticleRecord;
    returnTo?: string;
  } | null;
  const initialArticle = routeState?.article ?? routeState?.draft;
  const returnTo = routeState?.returnTo ?? '/articles/mine';

  const articleId = useMemo(() => {
    const parsed = Number(params.articleId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [params.articleId]);

  if (articleId == null) {
    return (
      <div className="posts-page">
        <h1>სტატიის რედაქტირება</h1>
        <p className="error">არასწორი სტატიის ID.</p>
      </div>
    );
  }

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>სტატიის რედაქტირება</h1>
          <p className="hint">განაახლეთ სტატიის შინაარსი და შეინახეთ ცვლილებები.</p>
        </div>
      </div>

      <ArticleForm
        articleId={articleId}
        initialArticle={initialArticle}
        onSaved={() => navigate(returnTo)}
      />
    </div>
  );
}
