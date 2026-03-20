import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/use-auth';
import { ConfirmModal } from '../components/confirm-modal';
import { isAdminRole } from '../lib/articles';
import {
  changeEditorPassword,
  deleteEditorUser,
  fetchUsers,
  getUserId,
  isEditorRole,
  type UserRecord
} from '../lib/users';
import './posts-page.css';

type ApiValidationIssue = {
  loc?: Array<string | number>;
  msg?: string;
};

type ApiErrorBody = {
  detail?: string | ApiValidationIssue[];
  message?: string;
};

function extractApiErrorMessage(error: unknown): string {
  const fallback = 'Could not load users. Check API endpoint/validation rules.';

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

export function UsersListPage() {
  const { user } = useAuth();
  const adminView = isAdminRole(user?.role);

  const [loadingEditors, setLoadingEditors] = useState(true);
  const [busyEditorId, setBusyEditorId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [editorToDelete, setEditorToDelete] = useState<UserRecord | null>(null);
  const [editorToChangePassword, setEditorToChangePassword] = useState<UserRecord | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const editors = useMemo(() => users.filter((entry) => isEditorRole(entry.role)), [users]);

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

  useEffect(() => {
    if (!editorToChangePassword) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !updatingPassword) {
        setEditorToChangePassword(null);
        setPasswordInput('');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [editorToChangePassword, updatingPassword]);

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

  const onChangePassword = async () => {
    if (!editorToChangePassword) {
      return;
    }

    const editorId = getUserId(editorToChangePassword);
    if (!editorId) {
      toast.error('Editor id is missing.');
      return;
    }

    const nextPassword = passwordInput.trim();
    if (!nextPassword) {
      toast.error('Enter a new password first.');
      return;
    }

    setUpdatingPassword(true);
    setBusyEditorId(editorId);

    try {
      await changeEditorPassword(editorId, nextPassword);
      toast.success('Editor password updated successfully.');
      setEditorToChangePassword(null);
      setPasswordInput('');
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setUpdatingPassword(false);
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
          <h1>Users List</h1>
          <p className="hint">Manage registered editors and their credentials.</p>
        </div>
        <Link to="/users/new" className="button-secondary">Register User</Link>
      </div>

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

                <div className="post-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditorToChangePassword(editor);
                      setPasswordInput('');
                    }}
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

      {editorToChangePassword ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => {
            if (!updatingPassword) {
              setEditorToChangePassword(null);
              setPasswordInput('');
            }
          }}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Change Editor Password"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Change Password</h3>
            <p className="hint">Set a new password for {editorToChangePassword.email ?? 'this editor'}.</p>
            <label>
              New Password
              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                placeholder="Enter new password"
                disabled={updatingPassword}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setEditorToChangePassword(null);
                  setPasswordInput('');
                }}
                disabled={updatingPassword}
              >
                Cancel
              </button>
              <button type="button" onClick={() => void onChangePassword()} disabled={updatingPassword}>
                {updatingPassword ? 'Working...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
