import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/auth-context';
import { ConfirmModal } from '../components/confirm-modal';
import { isAdminRole } from '../lib/articles';
import {
  changeEditorPassword,
  createEditorUser,
  deleteEditorUser,
  fetchUsers,
  getUserId,
  isEditorRole,
  type UserRecord
} from '../lib/users';
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

export function UsersPage() {
  const { user } = useAuth();
  const adminView = isAdminRole(user?.role);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<CreateUserRole>('editor');

  const [creating, setCreating] = useState(false);
  const [loadingEditors, setLoadingEditors] = useState(true);
  const [busyEditorId, setBusyEditorId] = useState<string | null>(null);
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [editorToDelete, setEditorToDelete] = useState<UserRecord | null>(null);

  const editors = useMemo(
    () => users.filter((entry) => isEditorRole(entry.role)),
    [users]
  );

  const loadEditors = async () => {
    try {
      const allUsers = await fetchUsers();
      setUsers(allUsers);
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setLoadingEditors(false);
    }
  };

  useEffect(() => {
    if (!adminView) {
      return;
    }

    setLoadingEditors(true);
    void loadEditors();
  }, [adminView]);

  const onCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminView) {
      const message = 'Only admins can create users.';
      toast.error(message);
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
      await loadEditors();
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const onDeleteEditor = async (editor: UserRecord) => {
    const editorId = getUserId(editor);
    if (!editorId) {
      toast.error('Editor id is missing.');
      return;
    }

    setBusyEditorId(editorId);
    try {
      await deleteEditorUser(editorId);
      toast.success('Editor deleted successfully.');
      await loadEditors();
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setBusyEditorId(null);
    }
  };

  const onChangePassword = async (editor: UserRecord) => {
    const editorId = getUserId(editor);
    if (!editorId) {
      toast.error('Editor id is missing.');
      return;
    }

    const nextPassword = newPasswords[editorId] ?? '';
    if (!nextPassword) {
      toast.error('Enter a new password first.');
      return;
    }

    setBusyEditorId(editorId);
    try {
      await changeEditorPassword(editorId, nextPassword);
      setNewPasswords((current) => ({ ...current, [editorId]: '' }));
      toast.success('Editor password updated successfully.');
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setBusyEditorId(null);
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
          <h1>User Management</h1>
          <p className="hint">Create new users and manage registered editors.</p>
        </div>
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

      <div className="posts-list">
        <h2>Registered Editors</h2>

        {loadingEditors ? <p className="hint">Loading editors...</p> : null}

        {!loadingEditors && editors.length === 0 ? (
          <p className="hint">No editor accounts found.</p>
        ) : (
          editors.map((editor) => {
            const editorId = getUserId(editor);
            const isBusy = busyEditorId === editorId;

            return (
              <article className="post-card" key={editorId || editor.email}>
                <div className="post-meta">
                  <div className="post-badges">
                    <span className="status-pill draft">editor</span>
                  </div>
                  <span>{editor.email ?? '-'}</span>
                </div>

                <h3>{editor.full_name || 'Unnamed editor'}</h3>

                <div className="field-row">
                  <label>
                    New Password
                    <input
                      type="password"
                      value={newPasswords[editorId] ?? ''}
                      onChange={(event) =>
                        setNewPasswords((current) => ({
                          ...current,
                          [editorId]: event.target.value
                        }))
                      }
                      placeholder="Enter new password"
                    />
                  </label>
                </div>

                <div className="post-actions">
                  <button
                    type="button"
                    onClick={() => void onChangePassword(editor)}
                    disabled={isBusy}
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setEditorToDelete(editor)}
                    disabled={isBusy}
                  >
                    Delete Editor
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <ConfirmModal
        open={Boolean(editorToDelete)}
        title="Delete Editor"
        message={`Are you sure you want to delete ${editorToDelete?.email ?? 'this editor'}? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        busy={Boolean(editorToDelete && busyEditorId === getUserId(editorToDelete))}
        onCancel={() => setEditorToDelete(null)}
        onConfirm={() => {
          if (!editorToDelete) {
            return;
          }

          void onDeleteEditor(editorToDelete);
          setEditorToDelete(null);
        }}
      />
    </div>
  );
}
