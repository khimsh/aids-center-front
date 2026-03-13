import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import './posts-page.css';
import { api } from '../lib/api';

type DraftPost = {
  id: number;
  title: string;
  summary: string;
  contentHtml: string;
  status: 'draft' | 'published';
  updatedAt: string;
};

type ArticleOut = {
  id: number;
  title_ka: string;
  body_ka: string | null;
  excerpt_ka: string | null;
  published: boolean;
  updated_at: string;
};

export function PostsPage() {
  const editorMountRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<DraftPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [busyPostId, setBusyPostId] = useState<number | null>(null);

  const toPostCard = (article: ArticleOut): DraftPost => ({
    id: article.id,
    title: article.title_ka,
    summary: article.excerpt_ka ?? '',
    contentHtml: article.body_ka ?? '',
    status: article.published ? 'published' : 'draft',
    updatedAt: new Date(article.updated_at).toLocaleString()
  });

  useEffect(() => {
    const loadPublished = async () => {
      try {
        const response = await api.get('/api/articles', {
          params: { page: 1, per_page: 20 }
        });

        const items = (response.data?.items ?? []) as Array<{
          id: number;
          title_ka: string;
          excerpt_ka: string | null;
          published_at: string | null;
          created_at: string;
        }>;

        setPosts(
          items.map((item) => ({
            id: item.id,
            title: item.title_ka,
            summary: item.excerpt_ka ?? '',
            contentHtml: '',
            status: 'published',
            updatedAt: new Date(item.published_at ?? item.created_at).toLocaleString()
          }))
        );
      } catch {
        setError('Could not load existing posts.');
      }
    };

    loadPublished();
  }, []);

  useEffect(() => {
    if (!editorMountRef.current || quillRef.current) {
      return;
    }

    const quill = new Quill(editorMountRef.current, {
      theme: 'snow',
      placeholder: 'Write your post content here...',
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
      setContentHtml(quill.root.innerHTML);
    };

    quill.on('text-change', syncContent);
  }, []);

  const clearForm = () => {
    setTitle('');
    setSummary('');
    setContentHtml('');
    quillRef.current?.setContents([]);
  };

  const savePost = async (status: DraftPost['status']) => {
    const plainText = quillRef.current?.getText().trim() ?? '';

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (plainText.length < 10) {
      setError('Content is too short. Add at least 10 characters.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title_ka: title.trim(),
        title_en: null,
        body_ka: contentHtml,
        body_en: null,
        excerpt_ka: summary.trim() || null,
        excerpt_en: null,
        image_url: null,
        category: 'news',
        featured: false,
        published: status === 'published',
        published_at: status === 'published' ? new Date().toISOString() : null,
        slug: null
      };

      const response = await api.post('/api/articles', payload);
      const created = toPostCard(response.data as ArticleOut);

      setPosts((current) => [created, ...current]);
      setError(null);
      clearForm();
    } catch {
      setError('Could not save post. Check authentication and API validation rules.');
    } finally {
      setSaving(false);
    }
  };

  const publishDraft = async (postId: number) => {
    setBusyPostId(postId);

    try {
      const response = await api.put(`/api/articles/${postId}`, {
        published: true,
        published_at: new Date().toISOString()
      });

      const updated = toPostCard(response.data as ArticleOut);

      setPosts((current) =>
        current.map((post) => (post.id === postId ? updated : post))
      );
      setError(null);
    } catch {
      setError('Could not publish draft.');
    } finally {
      setBusyPostId(null);
    }
  };

  const removePost = async (postId: number) => {
    setBusyPostId(postId);

    try {
      await api.delete(`/api/articles/${postId}`);
      setPosts((current) => current.filter((post) => post.id !== postId));
      setError(null);
    } catch {
      setError('Could not delete post.');
    } finally {
      setBusyPostId(null);
    }
  };

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>Posts</h1>
          <p className="hint">Create and publish content with a rich text editor.</p>
        </div>
      </div>

      <div className="posts-editor">
        <label>
          Post title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter title"
            required
          />
        </label>

        <label>
          Short summary
          <input
            type="text"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="One sentence summary"
          />
        </label>

        <div className="editor-shell">
          <div ref={editorMountRef} className="quill-host" />
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="posts-actions">
          <button type="button" className="button-secondary" onClick={() => void savePost('draft')} disabled={saving}>
            Save Draft
          </button>
          <button type="button" onClick={() => void savePost('published')} disabled={saving}>
            Publish Post
          </button>
        </div>
      </div>

      <div className="posts-list">
        <h2>Saved Posts</h2>

        {posts.length === 0 ? (
          <p className="hint">No posts yet. Create your first post above.</p>
        ) : (
          posts.map((post) => (
            <article className="post-card" key={post.id}>
              <div className="post-meta">
                <span className={`status-pill ${post.status}`}>{post.status}</span>
                <span>{post.updatedAt}</span>
              </div>
              <h3>{post.title}</h3>
              {post.summary ? <p>{post.summary}</p> : null}
              <div className="post-actions">
                {post.status === 'draft' ? (
                  <button type="button" onClick={() => void publishDraft(post.id)} disabled={busyPostId === post.id}>
                    Publish Draft
                  </button>
                ) : null}
                <button type="button" className="button-secondary" onClick={() => void removePost(post.id)} disabled={busyPostId === post.id}>
                  Delete
                </button>
              </div>
              <div className="post-preview" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            </article>
          ))
        )}
      </div>
    </div>
  );
}
