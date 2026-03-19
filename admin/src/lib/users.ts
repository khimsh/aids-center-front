import { api } from './api';

export type UserRecord = {
  id?: string | number;
  user_id?: string | number;
  email?: string;
  full_name?: string;
  role?: string;
};

type UserListResponse = {
  items?: UserRecord[];
  users?: UserRecord[];
};

function normalizeRole(role?: string) {
  return (role ?? '').toLowerCase();
}

export function isEditorRole(role?: string) {
  return normalizeRole(role) === 'editor';
}

export function getUserId(user: UserRecord): string {
  const candidate = user.id ?? user.user_id;
  return candidate == null ? '' : String(candidate);
}

export async function fetchUsers(): Promise<UserRecord[]> {
  const response = await api.get('/api/users');
  const data = response.data as UserListResponse | UserRecord[];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.users)) {
    return data.users;
  }

  return [];
}

export async function createEditorUser(payload: {
  email: string;
  full_name: string;
  password: string;
  role: 'editor' | 'admin';
}) {
  await api.post('/api/users', payload);
}

export async function deleteEditorUser(userId: string | number) {
  await api.delete(`/api/users/${userId}`);
}

export async function changeEditorPassword(userId: string | number, newPassword: string) {
  const payloadVariants: Array<Record<string, unknown>> = [
    { password: newPassword },
    { new_password: newPassword },
    { password: newPassword, confirm_password: newPassword }
  ];

  let lastError: unknown;

  for (const payload of payloadVariants) {
    try {
      await api.patch(`/api/users/${userId}/password`, payload);
      return;
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 400 || status === 422) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error('Could not change password.');
}
