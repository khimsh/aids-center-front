import { useActionState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';

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
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const isInvalidCredentials = /401|invalid credentials/i.test(message);
        return {
          error: isInvalidCredentials
            ? 'Invalid credentials. Please try again.'
            : 'Login failed. Please try again.',
          success: false
        };
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
        <h1>ადმინისტრატორის შესვლა</h1>
        <p className="hint">შესვლა საიტის მართვისთვის.</p>

        <label>
          მომხმარებლის სახელი ან ელ.ფოსტა
          <input
            type="text"
            name="username"
            required
            autoComplete="username"
          />
        </label>

        <label>
          პაროლი
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>

        {state.error ? <p className="error">{state.error}</p> : null}

        <button type="submit" disabled={isPending}>
          {isPending ? 'შესვლა...' : 'შესვლა'}
        </button>
      </form>
    </div>
  );
}
