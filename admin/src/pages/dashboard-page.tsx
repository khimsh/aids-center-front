import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/auth-context';
import { api } from '../lib/api';
import { fetchArticles, filterArticlesByUser, isAdminRole } from '../lib/articles';
import { fetchUsers, isEditorRole } from '../lib/users';
import './dashboard-page.css';

export function DashboardPage() {
  const { user } = useAuth();
  const [articleCount, setArticleCount] = useState(0);
  const [editorCount, setEditorCount] = useState(0);
  const [vacancyCount, setVacancyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const adminView = useMemo(() => isAdminRole(user?.role), [user?.role]);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [articleResult, users, vacanciesResponse] = await Promise.all([
          fetchArticles({ page: 1, per_page: 200, include_drafts: true }),
          adminView ? fetchUsers() : Promise.resolve([]),
          api.get('/api/job-postings')
        ]);

        const visible = adminView ? articleResult.items : filterArticlesByUser(articleResult.items, user?.id);
        setArticleCount(visible.length);
        setVacancyCount(Array.isArray(vacanciesResponse.data) ? vacanciesResponse.data.length : 0);

        if (adminView) {
          setEditorCount(users.filter((entry) => isEditorRole(entry.role)).length);
        }
      } catch {
        toast.error('Could not load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    void loadCounts();
  }, [adminView, user?.id]);

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <section className="dashboard-section">
        <div className="dashboard-cards">
          <Link to="/articles/mine" className="dashboard-card">
            <p className="card-kicker">Articles</p>
            <p className="card-value">{loading ? '...' : articleCount}</p>
            <p className="card-note">{adminView ? 'All articles list' : 'Your articles list'}</p>
          </Link>
          <Link to="/job-postings/list" className="dashboard-card">
            <p className="card-kicker">Vacancies</p>
            <p className="card-value">{loading ? '...' : vacancyCount}</p>
            <p className="card-note">All vacancies list</p>
          </Link>
          {adminView ? (
            <Link to="/users" className="dashboard-card">
              <p className="card-kicker">Editors</p>
              <p className="card-value">{loading ? '...' : editorCount}</p>
              <p className="card-note">All editors list</p>
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
