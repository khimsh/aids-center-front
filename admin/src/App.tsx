import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './auth/auth-context';
import { ProtectedRoute } from './auth/protected-route';
import { AdminLayout } from './components/admin-layout';
import { DashboardPage } from './pages/dashboard-page';
import { JobPostingCreatePage } from './pages/job-posting-create-page';
import { LoginPage } from './pages/login-page';
import { PlaceholderPage } from './pages/placeholder-page';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'posts',
            lazy: async () => {
              const { PostsPage } = await import('./pages/posts-page');
              return { Component: PostsPage };
            },
          },
          {
            path: 'articles/drafts',
            lazy: async () => {
              const { ArticleDraftsPage } = await import('./pages/article-drafts-page');
              return { Component: ArticleDraftsPage };
            },
          },
          {
            path: 'articles/drafts/:articleId/edit',
            lazy: async () => {
              const { ArticleEditPage } = await import('./pages/article-edit-page');
              return { Component: ArticleEditPage };
            },
          },
          {
            path: 'articles/:articleId/edit',
            lazy: async () => {
              const { ArticleEditPage } = await import('./pages/article-edit-page');
              return { Component: ArticleEditPage };
            },
          },
          {
            path: 'articles/mine',
            lazy: async () => {
              const { MyArticlesPage } = await import('./pages/my-articles-page');
              return { Component: MyArticlesPage };
            },
          },
          {
            path: 'users',
            lazy: async () => {
              const { UsersPage } = await import('./pages/users-page');
              return { Component: UsersPage };
            },
          },
          {
            path: 'articles/deleted',
            lazy: async () => {
              const { DeletedArticlesPage } = await import('./pages/deleted-articles-page');
              return { Component: DeletedArticlesPage };
            },
          },
          { path: 'job-postings/new', element: <JobPostingCreatePage /> },
          {
            path: 'job-postings/list',
            lazy: async () => {
              const { JobPostingsPage } = await import('./pages/job-postings-page');
              return { Component: JobPostingsPage };
            },
          },
          { path: 'job-postings', element: <Navigate to="/job-postings/list" replace /> },
          { path: 'articles', element: <Navigate to="/articles/mine" replace /> },
          { path: 'programs', element: <Navigate to="/job-postings/list" replace /> },
          { path: 'settings', element: <PlaceholderPage title="Settings" /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <ToastContainer position="bottom-right" autoClose={4000} newestOnTop closeOnClick pauseOnFocusLoss={false} />
    </QueryClientProvider>
  );
}

export default App;

