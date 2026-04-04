import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGetMock, apiPostMock, apiDeleteMock, apiPatchMock, getErrorStatusMock } = vi.hoisted(
  () => ({
    apiGetMock: vi.fn(),
    apiPostMock: vi.fn(),
    apiDeleteMock: vi.fn(),
    apiPatchMock: vi.fn(),
    getErrorStatusMock: vi.fn(),
  }),
);

vi.mock('../api', () => ({
  api: {
    get: apiGetMock,
    post: apiPostMock,
    delete: apiDeleteMock,
    patch: apiPatchMock,
  },
  getErrorStatus: getErrorStatusMock,
}));

import {
  changeEditorPassword,
  createEditorUser,
  deleteEditorUser,
  fetchUsers,
  getUserId,
} from '../users';

describe('users service', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
    apiDeleteMock.mockReset();
    apiPatchMock.mockReset();
    getErrorStatusMock.mockReset();
  });

  it('extracts user id from id and user_id', () => {
    expect(getUserId({ id: 10 })).toBe('10');
    expect(getUserId({ user_id: 'abc' })).toBe('abc');
    expect(getUserId({})).toBe('');
  });

  it('parses fetchUsers from users wrapper', async () => {
    apiGetMock.mockResolvedValue({ data: { users: [{ id: 1 }] } });
    await expect(fetchUsers()).resolves.toEqual([{ id: 1 }]);
  });

  it('creates and deletes users through API', async () => {
    await createEditorUser({
      email: 'a@b.com',
      full_name: 'Name',
      password: '123',
      role: 'editor',
    });
    await deleteEditorUser('55');

    expect(apiPostMock).toHaveBeenCalledWith('/api/users', {
      email: 'a@b.com',
      full_name: 'Name',
      password: '123',
      role: 'editor',
    });
    expect(apiDeleteMock).toHaveBeenCalledWith('/api/users/55');
  });

  it('retries password update with payload variants on 400/422', async () => {
    apiPatchMock
      .mockRejectedValueOnce(new Error('bad 1'))
      .mockRejectedValueOnce(new Error('bad 2'))
      .mockResolvedValueOnce({});

    getErrorStatusMock.mockReturnValueOnce(400).mockReturnValueOnce(422);

    await expect(changeEditorPassword(5, 'pw')).resolves.toBeUndefined();
    expect(apiPatchMock).toHaveBeenCalledTimes(3);
  });

  it('throws non-validation error immediately', async () => {
    const err = new Error('forbidden');
    apiPatchMock.mockRejectedValueOnce(err);
    getErrorStatusMock.mockReturnValueOnce(403);

    await expect(changeEditorPassword(5, 'pw')).rejects.toBe(err);
    expect(apiPatchMock).toHaveBeenCalledTimes(1);
  });
});
