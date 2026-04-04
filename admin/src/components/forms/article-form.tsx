import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import { toast } from 'react-toastify';
import type { AxiosError } from 'axios';
import 'quill/dist/quill.snow.css';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { articleIsPublished, fetchArticles, type ArticleRecord } from '../../lib/articles';
import { api } from '../../lib/api';

type ArticleCategory = 'news' | 'announcements';

type ArticleDetails = {
  id: number | string;
  slug?: string | null;
  title_ka?: string | null;
  title_en?: string | null;
  body_ka?: string | null;
  body_en?: string | null;
  content_ka?: string | null;
  content_en?: string | null;
  image_url?: string | null;
  category?: string | null;
  featured?: boolean;
  published?: boolean;
  published_at?: string | null;
  [key: string]: unknown;
};

type ArticleDetailResponse =
  | ArticleDetails
  | {
      item?: ArticleDetails;
      article?: ArticleDetails;
      data?: ArticleDetails;
      result?: ArticleDetails;
      items?: ArticleDetails[];
      payload?: ArticleDetails;
      record?: ArticleDetails;
    };

type ArticleFormProps = {
  articleId?: number;
  initialArticle?: ArticleRecord;
  onSaved?: () => void;
};

function getApiErrorMessage(error: unknown): string | null {
  const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
  const status = axiosError.response?.status;
  const detail = axiosError.response?.data?.detail?.trim();
  const message = axiosError.response?.data?.message?.trim();

  if (detail) {
    return detail;
  }

  if (message) {
    return message;
  }

  if (status === 401) {
    return 'You are not authenticated. Please log in again.';
  }

  if (status === 403) {
    return 'You do not have permission to create or edit articles.';
  }

  if (status === 422) {
    return 'Validation failed. Please check required fields and try again.';
  }

  return null;
}

export function ArticleForm({ articleId, initialArticle, onSaved }: ArticleFormProps) {
  const editorMountRef = useRef<HTMLDivElement | null>(null);
  const editorMountEnRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const quillEnRef = useRef<Quill | null>(null);

  const [titleKa, setTitleKa] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('news');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [contentHtmlKa, setContentHtmlKa] = useState('');
  const [contentHtmlEn, setContentHtmlEn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(Boolean(articleId));
  const [existingPublished, setExistingPublished] = useState(false);
  const pendingBodyKaRef = useRef<string>('');
  const pendingBodyEnRef = useRef<string>('');

  const normalizeText = (value: unknown): string => {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim();
    }

    return '';
  };

  const getLocalizedText = (
    article: ArticleDetails | ArticleRecord,
    language: 'ka' | 'en',
  ): string => {
    const record = article as Record<string, unknown>;

    const languageSuffix = language === 'ka' ? 'ka' : 'en';
    const languageField = language === 'ka' ? 'ge' : 'en';

    const directCandidates = [
      record[`body_${languageSuffix}`],
      record[`content_${languageSuffix}`],
      record[`description_${languageSuffix}`],
      record[`text_${languageSuffix}`],
      record[`body${languageSuffix.toUpperCase()}`],
      record[`content${languageSuffix.toUpperCase()}`],
    ];

    for (const value of directCandidates) {
      const normalized = normalizeText(value);
      if (normalized) {
        return normalized;
      }
    }

    const body = record.body;
    if (body && typeof body === 'object') {
      const nested = body as Record<string, unknown>;
      const normalized = normalizeText(nested[languageField] ?? nested[languageSuffix]);
      if (normalized) {
        return normalized;
      }
    }

    const content = record.content;
    if (content && typeof content === 'object') {
      const nested = content as Record<string, unknown>;
      const normalized = normalizeText(nested[languageField] ?? nested[languageSuffix]);
      if (normalized) {
        return normalized;
      }
    }

    return '';
  };

  const getBodyKa = (article: ArticleDetails | ArticleRecord): string =>
    getLocalizedText(article, 'ka');

  const getBodyEn = (article: ArticleDetails | ArticleRecord): string =>
    getLocalizedText(article, 'en');

  const applyBodyToEditors = (bodyKa: string, bodyEn: string) => {
    if (quillRef.current) {
      quillRef.current.root.innerHTML = bodyKa || '';
    } else {
      pendingBodyKaRef.current = bodyKa;
    }

    if (quillEnRef.current) {
      quillEnRef.current.root.innerHTML = bodyEn || '';
    } else {
      pendingBodyEnRef.current = bodyEn;
    }
  };

  const extractArticleDetails = (raw: ArticleDetailResponse): ArticleDetails | null => {
    const hasValidId = (value: unknown) => {
      if (typeof value === 'number') {
        return Number.isFinite(value);
      }

      if (typeof value === 'string') {
        return value.trim().length > 0;
      }

      return false;
    };

    const isArticleDetails = (value: unknown): value is ArticleDetails =>
      Boolean(value) && typeof value === 'object' && hasValidId((value as { id?: unknown }).id);

    if (!raw || typeof raw !== 'object') {
      return null;
    }

    if (isArticleDetails(raw)) {
      return raw as ArticleDetails;
    }

    const fromWrapper =
      raw.item ?? raw.article ?? raw.data ?? raw.result ?? raw.payload ?? raw.record;
    if (isArticleDetails(fromWrapper)) {
      return fromWrapper;
    }

    if (Array.isArray(raw.items) && raw.items.length > 0 && isArticleDetails(raw.items[0])) {
      return raw.items[0];
    }

    return null;
  };

  const hydrateForm = (article: ArticleDetails | ArticleRecord) => {
    const nextCategory = article.category === 'announcements' ? 'announcements' : 'news';

    setTitleKa(article.title_ka ?? '');
    setTitleEn(article.title_en ?? '');
    setCategory(nextCategory);
    setImageUrl(article.image_url ?? '');
    setFeatured(Boolean(article.featured));
    const bodyKa = getBodyKa(article);
    const bodyEn = getBodyEn(article);
    setContentHtmlKa(bodyKa);
    setContentHtmlEn(bodyEn);
    setExistingPublished(articleIsPublished(article as ArticleRecord));
    applyBodyToEditors(bodyKa, bodyEn);
  };

  useEffect(() => {
    if (loadingArticle || !editorMountRef.current || quillRef.current) {
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
          ['clean'],
        ],
      },
    });

    quillRef.current = quill;

    if (pendingBodyKaRef.current) {
      quill.root.innerHTML = pendingBodyKaRef.current;
      pendingBodyKaRef.current = '';
    }

    const syncContent = () => {
      setContentHtmlKa(quill.root.innerHTML);
    };

    quill.on('text-change', syncContent);

    return () => {
      quill.off('text-change', syncContent);
    };
  }, [loadingArticle]);

  useEffect(() => {
    if (loadingArticle || !editorMountEnRef.current || quillEnRef.current) {
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
          ['clean'],
        ],
      },
    });

    quillEnRef.current = quill;

    if (pendingBodyEnRef.current) {
      quill.root.innerHTML = pendingBodyEnRef.current;
      pendingBodyEnRef.current = '';
    }

    const syncContent = () => {
      setContentHtmlEn(quill.root.innerHTML);
    };

    quill.on('text-change', syncContent);

    return () => {
      quill.off('text-change', syncContent);
    };
  }, [loadingArticle]);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    const loadArticle = async () => {
      setLoadingArticle(true);

      const fetchBySlug = async (slug: string) => {
        const response = await api.get(`/api/articles/${encodeURIComponent(slug)}`);
        return extractArticleDetails(response.data as ArticleDetailResponse);
      };

      if (initialArticle && initialArticle.id === articleId) {
        // Use navigation state for instant paint, but still fetch full details below.
        hydrateForm(initialArticle);
      }

      try {
        const initialSlug = initialArticle?.slug?.trim();
        if (initialSlug) {
          const slugArticle = await fetchBySlug(initialSlug);
          if (slugArticle) {
            hydrateForm(slugArticle);
            return;
          }
        }

        // Backward-compatibility for backends that still support id-based detail routes.
        const response = await api.get(`/api/articles/${articleId}`);
        const article = extractArticleDetails(response.data as ArticleDetailResponse);

        if (!article) {
          throw new Error('Invalid article details response.');
        }

        hydrateForm(article);
      } catch {
        try {
          const result = await fetchArticles({ page: 1, per_page: 200, include_drafts: true });
          const fallbackArticle = result.items.find(
            (item) => String(item.id) === String(articleId),
          );

          if (fallbackArticle) {
            hydrateForm(fallbackArticle);

            const fallbackSlug = fallbackArticle.slug?.trim();
            if (fallbackSlug) {
              try {
                const slugArticle = await fetchBySlug(fallbackSlug);
                if (slugArticle) {
                  hydrateForm(slugArticle);
                }
              } catch {
                // Keep fallback hydration if slug fetch fails.
              }
            }

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

  const clearForm = () => {
    setTitleKa('');
    setTitleEn('');
    setCategory('news');
    setImageUrl('');
    setSelectedImage(null);
    setFeatured(false);
    setContentHtmlKa('');
    setContentHtmlEn('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    quillRef.current?.setContents([]);
    quillEnRef.current?.setContents([]);
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      return imageUrl.trim() || null;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedImage);

      const response = await api.post('/api/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = (response.data as { url?: string }).url?.trim();
      if (!uploadedUrl) {
        throw new Error('Upload response did not include file URL.');
      }

      setImageUrl(uploadedUrl);
      return uploadedUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  const clearOtherFeaturedArticles = async () => {
    if (!featured) {
      return;
    }

    const result = await fetchArticles({ page: 1, per_page: 200, include_drafts: true });
    const otherFeaturedArticles = result.items.filter(
      (item) => item.featured && item.id !== articleId,
    );

    if (otherFeaturedArticles.length === 0) {
      return;
    }

    await Promise.all(
      otherFeaturedArticles.map((item) => api.put(`/api/articles/${item.id}`, { featured: false })),
    );
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
      const uploadedImageUrl = await uploadImage();
      await clearOtherFeaturedArticles();

      const bodyKa = quillRef.current?.root.innerHTML ?? contentHtmlKa;
      const bodyEn = quillEnRef.current?.root.innerHTML ?? contentHtmlEn;

      const payload = {
        title_ka: titleKa.trim(),
        title_en: titleEn.trim(),
        body_ka: bodyKa,
        body_en: bodyEn,
        image_url: uploadedImageUrl,
        category,
        featured,
        published: status === 'published',
        published_at: status === 'published' ? new Date().toISOString() : null,
      };

      if (articleId) {
        await api.put(`/api/articles/${articleId}`, payload);
      } else {
        await api.post('/api/articles', payload);
      }

      setError(null);
      if (articleId) {
        toast.success(
          status === 'published'
            ? 'Article updated and published.'
            : 'Article updated successfully.',
        );
      } else {
        toast.success(
          status === 'published'
            ? 'Article published successfully.'
            : 'Article draft saved successfully.',
        );
      }

      if (!articleId) {
        clearForm();
      }

      onSaved?.();
    } catch (error) {
      const fallback = articleId
        ? 'Could not update article. Check authentication and validation rules.'
        : 'Could not save article. Check authentication and validation rules.';
      const message = getApiErrorMessage(error) ?? fallback;

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="posts-editor" onSubmit={(event) => event.preventDefault()}>
      {loadingArticle ? <p className="hint">Loading article...</p> : null}
      <div className="field-row">
        <label>
          Title (KA)
          <Input
            type="text"
            value={titleKa}
            onChange={(event) => setTitleKa(event.target.value)}
            placeholder="Enter Georgian title"
            required
          />
        </label>

        <label>
          Title (EN)
          <Input
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
          <Select
            value={category}
            onChange={(event) => setCategory(event.target.value as ArticleCategory)}
          >
            <option value="news">news</option>
            <option value="announcements">announcements</option>
          </Select>
        </label>

        <label>
          Upload Image
          <Input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
            disabled={saving || uploadingImage}
          />
          {selectedImage ? <span className="hint">Selected: {selectedImage.name}</span> : null}
          {!selectedImage && imageUrl ? (
            <span className="hint">Current image: {imageUrl}</span>
          ) : null}
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => void saveArticle(existingPublished ? 'published' : 'draft')}
              disabled={saving}
            >
              Save Changes
            </Button>
            {!existingPublished ? (
              <Button type="button" onClick={() => void saveArticle('published')} disabled={saving}>
                Publish Draft
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void saveArticle('draft')}
              disabled={saving}
            >
              Save Draft
            </Button>
            <Button type="button" onClick={() => void saveArticle('published')} disabled={saving}>
              Publish Article
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
