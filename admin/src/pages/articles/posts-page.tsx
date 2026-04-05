import '../shared/content-page.scss';
import { ArticleForm } from '../../components/forms/article-form';

export function PostsPage() {
  return (
    <div className="posts-page">
      <div className="posts-header">
        <h1>ახალი სტატია</h1>
      </div>
      
      <ArticleForm />
    </div>
  );
}
