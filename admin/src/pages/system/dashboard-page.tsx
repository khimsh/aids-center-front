import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../auth/use-auth';
import { api } from '../../lib/api';
import { fetchArticles, filterArticlesByUser } from '../../lib/articles';
import { isAdminRole, isEditorRole } from '../../lib/permissions';
import { queryKeys } from '../../lib/query-keys';
import { fetchUsers } from '../../lib/users';
import './dashboard-page.scss';

export function DashboardPage() {
  const { user } = useAuth();

  const adminView = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const metricsQuery = useQuery({
    queryKey: queryKeys.dashboardMetrics(adminView, user?.id),
    queryFn: async () => {
      const [articleResult, users, vacanciesResponse] = await Promise.all([
        fetchArticles({ page: 1, per_page: 200, include_drafts: true }),
        adminView ? fetchUsers() : Promise.resolve([]),
        api.get('/api/job-postings'),
      ]);

      const visible = adminView
        ? articleResult.items
        : filterArticlesByUser(articleResult.items, user?.id);
      return {
        articleCount: visible.length,
        vacancyCount: Array.isArray(vacanciesResponse.data) ? vacanciesResponse.data.length : 0,
        editorCount: adminView ? users.filter((entry) => isEditorRole(entry.role)).length : 0,
      };
    },
  });

  useEffect(() => {
    if (metricsQuery.isError) {
      toast.error('Could not load dashboard metrics.');
    }
  }, [metricsQuery.isError]);

  const loading = metricsQuery.isLoading;
  const articleCount = metricsQuery.data?.articleCount ?? 0;
  const vacancyCount = metricsQuery.data?.vacancyCount ?? 0;
  const editorCount = metricsQuery.data?.editorCount ?? 0;

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
            <Link to="/users/list" className="dashboard-card">
              <p className="card-kicker">Editors List</p>
              <p className="card-value">{loading ? '...' : editorCount}</p>
              <p className="card-note">Manage all registered editors</p>
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
