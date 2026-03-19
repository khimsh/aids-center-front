import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import { toast } from 'react-toastify';
import 'quill/dist/quill.snow.css';
import { articleIsPublished, fetchArticles, type ArticleRecord } from '../lib/articles';
import { api } from '../lib/api';

type ArticleCategory = 'news' | 'announcements';

type ArticleDetails = {
  id: number;
  title_ka?: string | null;
  title_en?: string | null;
  body_ka?: string | null;
  body_en?: string | null;
  image_url?: string | null;
  category?: string | null;
  featured?: boolean;
  published?: boolean;
  published_at?: string | null;
};

type ArticleFormProps = {
  articleId?: number;
  initialArticle?: ArticleRecord;
  onSaved?: () => void;
};

export function ArticleForm({ articleId, initialArticle, onSaved }: ArticleFormProps) {
  const editorMountRef = useRef<HTMLDivElement | null>(null);
  const editorMountEnRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const quillEnRef = useRef<Quill | null>(null);

  const [titleKa, setTitleKa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('news');
  const [imageUrl, setImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [contentHtmlKa, setContentHtmlKa] = useState('');
  const [contentHtmlEn, setContentHtmlEn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(Boolean(articleId));
  const [pendingEditorHydration, setPendingEditorHydration] = useState(false);
  const [existingPublished, setExistingPublished] = useState(false);

  const hydrateForm = (article: ArticleDetails | ArticleRecord) => {
    const nextCategory = article.category === 'announcements' ? 'announcements' : 'news';

    setTitleKa(article.title_ka ?? '');
    setTitleEn(article.title_en ?? '');
    setCategory(nextCategory);
    setImageUrl(article.image_url ?? '');
    setFeatured(Boolean(article.featured));
    setContentHtmlKa(article.body_ka ?? '');
    setContentHtmlEn(article.body_en ?? '');
    setExistingPublished(articleIsPublished(article as ArticleRecord));
    setPendingEditorHydration(true);
  };

  useEffect(() => {
    if (!editorMountRef.current || quillRef.current) {
      return;
    }

    const quill = new Quill(editorMountRef.current, {
      theme: 'snow',
      placeholder: 'Write Georgian article content here...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'link'],
          ['clean']
        ]
      }
    });

    quillRef.current = quill;

    const syncContent = () => {
      setContentHtmlKa(quill.root.innerHTML);
    };

    quill.on('text-change', syncContent);

    return () => {
      quill.off('text-change', syncContent);
    };
  }, []);

  useEffect(() => {
    if (!editorMountEnRef.current || quillEnRef.current) {
      return;
    }

    const quill = new Quill(editorMountEnRef.current, {
      theme: 'snow',
      placeholder: 'Write English article content here...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'link'],
          ['clean']
        ]
      }
    });

    quillEnRef.current = quill;

    const syncContent = () => {
      setContentHtmlEn(quill.root.innerHTML);
    };

    quill.on('text-change', syncContent);

    return () => {
      quill.off('text-change', syncContent);
    };
  }, []);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    const loadArticle = async () => {
      setLoadingArticle(true);

      if (initialArticle && initialArticle.id === articleId) {
        // Use navigation state for instant paint, but still fetch full details below.
        hydrateForm(initialArticle);
      }

      try {
        const response = await api.get(`/api/articles/${articleId}`);
        const article = response.data as ArticleDetails;
        hydrateForm(article);
      } catch {
        try {
          const result = await fetchArticles({ page: 1, per_page: 200, include_drafts: true });
          const fallbackArticle = result.items.find((item) => item.id === articleId);

          if (fallbackArticle) {
            hydrateForm(fallbackArticle);
            return;
          }
        } catch {
          // Ignore fallback errors and surface a single user-facing message below.
        }

        const message = 'Could not load article details.';
        setError(message);
        toast.error(message);
      } finally {
        setLoadingArticle(false);
      }
    };

    void loadArticle();
  }, [articleId, initialArticle]);

  useEffect(() => {
    if (!pendingEditorHydration || !quillRef.current || !quillEnRef.current) {
      return;
    }

    quillRef.current.root.innerHTML = contentHtmlKa || '';
    quillEnRef.current.root.innerHTML = contentHtmlEn || '';
    setPendingEditorHydration(false);
  }, [contentHtmlEn, contentHtmlKa, pendingEditorHydration]);

  const clearForm = () => {
    setTitleKa('');
    setTitleEn('');
    setCategory('news');
    setImageUrl('');
    setFeatured(false);
    setContentHtmlKa('');
    setContentHtmlEn('');
    quillRef.current?.setContents([]);
    quillEnRef.current?.setContents([]);
  };

  const saveArticle = async (status: 'draft' | 'published') => {
    const plainTextKa = quillRef.current?.getText().trim() ?? '';
    const plainTextEn = quillEnRef.current?.getText().trim() ?? '';

    if (!titleKa.trim()) {
      const message = 'Georgian title is required.';
      setError(message);
      toast.error(message);
      return;
    }

    if (!titleEn.trim()) {
      const message = 'English title is required.';
      setError(message);
      toast.error(message);
      return;
    }

    if (plainTextKa.length < 10) {
      const message = 'Georgian content is too short. Add at least 10 characters.';
      setError(message);
      toast.error(message);
      return;
    }

    if (plainTextEn.length < 10) {
      const message = 'English content is too short. Add at least 10 characters.';
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title_ka: titleKa.trim(),
        title_en: titleEn.trim(),
        body_ka: contentHtmlKa,
        body_en: contentHtmlEn,
        image_url: imageUrl.trim() || null,
        category,
        featured,
        published: status === 'published',
        published_at: status === 'published' ? new Date().toISOString() : null
      };

      if (articleId) {
        await api.put(`/api/articles/${articleId}`, payload);
      } else {
        await api.post('/api/articles', payload);
      }

      setError(null);
      if (articleId) {
        toast.success(status === 'published' ? 'Article updated and published.' : 'Article updated successfully.');
      } else {
        toast.success(status === 'published' ? 'Article published successfully.' : 'Article draft saved successfully.');
      }

      if (!articleId) {
        clearForm();
      }

      onSaved?.();
    } catch {
      const message = articleId
        ? 'Could not update article. Check authentication and validation rules.'
        : 'Could not save article. Check authentication and validation rules.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingArticle) {
    return <p className="hint">Loading draft...</p>;
  }

  return (
    <form className="posts-editor" onSubmit={(event) => event.preventDefault()}>
      <div className="field-row">
        <label>
          Title (KA)
          <input
            type="text"
            value={titleKa}
            onChange={(event) => setTitleKa(event.target.value)}
            placeholder="Enter Georgian title"
            required
          />
        </label>

        <label>
          Title (EN)
          <input
            type="text"
            value={titleEn}
            onChange={(event) => setTitleEn(event.target.value)}
            placeholder="Enter English title"
            required
          />
        </label>
      </div>

      <div className="field-row">
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value as ArticleCategory)}>
            <option value="news">news</option>
            <option value="announcements">announcements</option>
          </select>
        </label>

        <label>
          Image URL
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </label>
      </div>

      <label className="featured-checkbox">
        <input
          type="checkbox"
          checked={featured}
          onChange={(event) => setFeatured(event.target.checked)}
        />
        Mark as featured
      </label>
      <p className="hint featured-note">
        If another article is already featured, selecting this will replace it.
      </p>

      <div className="field-row">
        <div>
          <p className="editor-label">Body (KA)</p>
          <div className="editor-shell">
            <div ref={editorMountRef} className="quill-host" />
          </div>
        </div>

        <div>
          <p className="editor-label">Body (EN)</p>
          <div className="editor-shell">
            <div ref={editorMountEnRef} className="quill-host" />
          </div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="posts-actions">
        {articleId ? (
          <>
            <button
              type="button"
              className="button-secondary"
              onClick={() => void saveArticle(existingPublished ? 'published' : 'draft')}
              disabled={saving}
            >
              Save Changes
            </button>
            {!existingPublished ? (
              <button type="button" onClick={() => void saveArticle('published')} disabled={saving}>
                Publish Draft
              </button>
            ) : null}
          </>
        ) : (
          <>
            <button type="button" className="button-secondary" onClick={() => void saveArticle('draft')} disabled={saving}>
              Save Draft
            </button>
            <button type="button" onClick={() => void saveArticle('published')} disabled={saving}>
              Publish Article
            </button>
          </>
        )}
      </div>
    </form>
  );
}