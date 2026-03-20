import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/use-auth';
import { isAdminRole } from '../lib/articles';
import { createEditorUser } from '../lib/users';
import './posts-page.css';

type CreateUserRole = 'editor' | 'admin';

type ApiValidationIssue = {
  loc?: Array<string | number>;
  msg?: string;
};

type ApiErrorBody = {
  detail?: string | ApiValidationIssue[];
  message?: string;
};

function extractApiErrorMessage(error: unknown): string {
  const fallback = 'Could not create user. Check API endpoint/validation rules.';

  const apiError = error as {
    response?: {
      status?: number;
      data?: ApiErrorBody;
    };
    message?: string;
  };

  const status = apiError.response?.status;
  const data = apiError.response?.data;

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return status ? `${status}: ${data.detail}` : data.detail;
  }

  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    const loc = Array.isArray(first.loc) ? first.loc.join('.') : 'field';
    const msg = first.msg ?? 'Validation error';
    return status ? `${status}: ${loc} - ${msg}` : `${loc} - ${msg}`;
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return status ? `${status}: ${data.message}` : data.message;
  }

  if (typeof apiError.message === 'string' && apiError.message.trim()) {
    return apiError.message;
  }

  return fallback;
}

export function UsersCreatePage() {
  const { user } = useAuth();
  const adminView = isAdminRole(user?.role);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<CreateUserRole>('editor');
  const [creating, setCreating] = useState(false);

  const onCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminView) {
      toast.error('Only admins can create users.');
      return;
    }

    if (!email.trim() || !fullName.trim() || !password) {
      toast.error('All fields are required.');
      return;
    }

    setCreating(true);

    try {
      await createEditorUser({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        role
      });

      setEmail('');
      setFullName('');
      setPassword('');
      setRole('editor');
      toast.success('User created successfully.');
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  if (!adminView) {
    return (
      <div>
        <h1>Users</h1>
        <p className="error">You do not have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>Register User</h1>
          <p className="hint">Create a new editor or admin account.</p>
        </div>
        <Link to="/users/list" className="button-secondary">View Users List</Link>
      </div>

      <form className="posts-editor" onSubmit={onCreateUser}>
        <div className="field-row">
          <label>
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Full Name
            <input
              type="text"
              name="full_name"
              required
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
        </div>

        <div className="field-row">
          <label>
            Role
            <select
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as CreateUserRole)}
            >
              <option value="editor">editor</option>
              <option value="admin">admin</option>
            </select>
          </label>
        </div>

        <label>
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <div className="posts-actions">
          <button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}
