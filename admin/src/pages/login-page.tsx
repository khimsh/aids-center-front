import { useActionState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';

type FormState = { error: string | null; success: boolean };

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      try {
        await login({
          username: formData.get('username') as string,
          password: formData.get('password') as string,
        });
        return { error: null, success: true };
      } catch {
        return { error: 'Invalid credentials. Please try again.', success: false };
      }
    },
    { error: null, success: false }
  );

  useEffect(() => {
    if (state.success) navigate(from, { replace: true });
  }, [state.success, from, navigate]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-page">
      <form className="auth-card" action={formAction}>
        <h1>Admin Login</h1>
        <p className="hint">Sign in to manage site content.</p>

        <label>
          Username or Email
          <input
            type="text"
            name="username"
            required
            autoComplete="username"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>

        {state.error ? <p className="error">{state.error}</p> : null}

        <button type="submit" disabled={isPending}>
          {isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
