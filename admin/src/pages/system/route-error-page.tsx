import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Something went wrong';
  let details = 'An unexpected error occurred while loading this page.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`.trim();
    details = typeof error.data === 'string' ? error.data : details;
  } else if (error instanceof Error) {
    details = error.message;
  }

  return (
    <div className="centered" style={{ padding: '1rem' }}>
      <div
        style={{
          width: 'min(640px, 100%)',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '1rem',
        }}
      >
        <h1>{title}</h1>
        <p className="hint">{details}</p>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
          <Button type="button" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/', { replace: true })}
          >
            Go Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
