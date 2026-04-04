import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../../auth/use-auth';
import { Button, ButtonLink } from '../../components/ui/button';
import { ConfirmModal } from '../../components/ui/confirm-modal';
import { Input } from '../../components/ui/input';
import { extractApiErrorMessage } from '../../lib/api-errors';
import { isAdminRole, isEditorRole } from '../../lib/permissions';
import { queryKeys } from '../../lib/query-keys';
import {
  changeEditorPassword,
  deleteEditorUser,
  fetchUsers,
  getUserId,
  type UserRecord
} from '../../lib/users';
import '../shared/content-page.scss';

export function UsersListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminView = isAdminRole(user?.role);

  const [busyEditorId, setBusyEditorId] = useState<string | null>(null);
  const [editorToDelete, setEditorToDelete] = useState<UserRecord | null>(null);
  const [editorToChangePassword, setEditorToChangePassword] = useState<UserRecord | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const usersQuery = useQuery({
    queryKey: queryKeys.users,
    queryFn: fetchUsers,
    enabled: adminView
  });

  const users = usersQuery.data ?? [];
  const editors = useMemo(() => users.filter((entry) => isEditorRole(entry.role)), [users]);

  useEffect(() => {
    if (usersQuery.isError) {
      toast.error(extractApiErrorMessage(usersQuery.error, 'Could not load users. Check API endpoint/validation rules.'));
    }
  }, [usersQuery.isError, usersQuery.error]);

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

  const deleteEditorMutation = useMutation({
    mutationFn: deleteEditorUser,
    onSuccess: async () => {
      toast.success('Editor deleted successfully.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, 'Could not delete user. Check API endpoint/validation rules.'));
    },
    onSettled: () => {
      setBusyEditorId(null);
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ editorId, nextPassword }: { editorId: string; nextPassword: string }) =>
      changeEditorPassword(editorId, nextPassword),
    onSuccess: async () => {
      toast.success('Editor password updated successfully.');
      setEditorToChangePassword(null);
      setPasswordInput('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, 'Could not update password. Check API endpoint/validation rules.'));
    },
    onSettled: () => {
      setUpdatingPassword(false);
      setBusyEditorId(null);
    }
  });

  const onDeleteEditor = (editor: UserRecord) => {
    const editorId = getUserId(editor);
    if (!editorId) {
      toast.error('Editor id is missing.');
      return;
    }

    setBusyEditorId(editorId);
    deleteEditorMutation.mutate(editorId);
  };

  const onChangePassword = () => {
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
    changePasswordMutation.mutate({ editorId, nextPassword });
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
        <ButtonLink to="/users/new" variant="secondary">Register User</ButtonLink>
      </div>

      <div className="posts-list">
        <h2>Registered Editors</h2>

        {usersQuery.isLoading ? <p className="hint">Loading editors...</p> : null}

        {!usersQuery.isLoading && editors.length === 0 ? (
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
                  <Button
                    type="button"
                    onClick={() => {
                      setEditorToChangePassword(editor);
                      setPasswordInput('');
                    }}
                    disabled={isBusy}
                  >
                    Change Password
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditorToDelete(editor)}
                    disabled={isBusy}
                  >
                    Delete Editor
                  </Button>
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
              <Input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                placeholder="Enter new password"
                disabled={updatingPassword}
              />
            </label>
            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditorToChangePassword(null);
                  setPasswordInput('');
                }}
                disabled={updatingPassword}
              >
                Cancel
              </Button>
              <Button type="button" onClick={onChangePassword} disabled={updatingPassword}>
                {updatingPassword ? 'Working...' : 'Update Password'}
              </Button>
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
