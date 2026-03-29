import './posts-page.css';
import { ArticleForm } from '../components/forms/article-form';

export function PostsPage() {

  return (
    <div className="posts-page">
      <div className="posts-header">
        <h1>Create Article</h1>
        <p className="hint">Create and publish content with a rich text editor.</p>
      </div>

      <ArticleForm />
    </div>
  );
}
