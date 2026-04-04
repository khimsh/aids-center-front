import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './auth/auth-context';
import { ProtectedRoute } from './auth/protected-route';
import { AdminLayout } from './components/layout/admin-layout';
import { DashboardPage } from './pages/system/dashboard-page';
import { DoctorsCreatePage } from './pages/doctors/doctors-create-page';
import { JobPostingCreatePage } from './pages/jobs/job-posting-create-page';
import { LoginPage } from './pages/system/login-page';
import { PlaceholderPage } from './pages/system/placeholder-page';
import { RouteErrorPage } from './pages/system/route-error-page';
import { UsersCreatePage } from './pages/users/users-create-page';
import { UsersListPage } from './pages/users/users-list-page';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AdminLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'posts',
            lazy: async () => {
              const { PostsPage } = await import('./pages/articles/posts-page');
              return { Component: PostsPage };
            },
          },
          {
            path: 'articles/drafts',
            lazy: async () => {
              const { ArticleDraftsPage } = await import('./pages/articles/article-drafts-page');
              return { Component: ArticleDraftsPage };
            },
          },
          {
            path: 'articles/drafts/:articleId/edit',
            lazy: async () => {
              const { ArticleEditPage } = await import('./pages/articles/article-edit-page');
              return { Component: ArticleEditPage };
            },
          },
          {
            path: 'articles/:articleId/edit',
            lazy: async () => {
              const { ArticleEditPage } = await import('./pages/articles/article-edit-page');
              return { Component: ArticleEditPage };
            },
          },
          {
            path: 'articles/mine',
            lazy: async () => {
              const { MyArticlesPage } = await import('./pages/articles/my-articles-page');
              return { Component: MyArticlesPage };
            },
          },
          { path: 'users/new', element: <UsersCreatePage /> },
          { path: 'users/list', element: <UsersListPage /> },
          { path: 'users', element: <Navigate to="/users/list" replace /> },
          {
            path: 'articles/deleted',
            lazy: async () => {
              const { DeletedArticlesPage } =
                await import('./pages/articles/deleted-articles-page');
              return { Component: DeletedArticlesPage };
            },
          },
          { path: 'job-postings/new', element: <JobPostingCreatePage /> },
          { path: 'doctors/new', element: <DoctorsCreatePage /> },
          {
            path: 'doctors/list',
            lazy: async () => {
              const { DoctorsListPage } = await import('./pages/doctors/doctors-list-page');
              return { Component: DoctorsListPage };
            },
          },
          {
            path: 'doctors/:doctorId/edit',
            lazy: async () => {
              const { DoctorsEditPage } = await import('./pages/doctors/doctors-edit-page');
              return { Component: DoctorsEditPage };
            },
          },
          {
            path: 'job-postings/list',
            lazy: async () => {
              const { JobPostingsPage } = await import('./pages/jobs/job-postings-page');
              return { Component: JobPostingsPage };
            },
          },
          { path: 'job-postings', element: <Navigate to="/job-postings/list" replace /> },
          { path: 'doctors', element: <Navigate to="/doctors/list" replace /> },
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
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
      />
    </QueryClientProvider>
  );
}

export default App;
