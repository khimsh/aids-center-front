import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { ProtectedRoute } from './auth/protected-route';
import { AdminLayout } from './components/admin-layout';
import { DashboardPage } from './pages/dashboard-page';
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
            path: 'job-postings',
            lazy: async () => {
              const { JobPostingsPage } = await import('./pages/job-postings-page');
              return { Component: JobPostingsPage };
            },
          },
          { path: 'articles', element: <Navigate to="/posts" replace /> },
          { path: 'programs', element: <Navigate to="/job-postings" replace /> },
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
    </QueryClientProvider>
  );
}

export default App;

