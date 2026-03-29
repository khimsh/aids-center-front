import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/use-auth';
import { extractApiErrorMessage } from '../lib/api-errors';
import { isAdminRole } from '../lib/permissions';
import { queryKeys } from '../lib/query-keys';
import { createEditorUser } from '../lib/users';
import './posts-page.css';

type CreateUserRole = 'editor' | 'admin';

export function UsersCreatePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminView = isAdminRole(user?.role);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<CreateUserRole>('editor');

  const createUserMutation = useMutation({
    mutationFn: createEditorUser,
    onSuccess: async () => {
      setEmail('');
      setFullName('');
      setPassword('');
      setRole('editor');
      toast.success('User created successfully.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, 'Could not create user. Check API endpoint/validation rules.'));
    }
  });

  const creating = createUserMutation.isPending;

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

    createUserMutation.mutate({
      email: email.trim(),
      full_name: fullName.trim(),
      password,
      role
    });
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
