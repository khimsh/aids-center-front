import { describe, expect, it } from 'vitest';
import { isAdminRole, isEditorRole } from '../permissions';

describe('permissions helpers', () => {
  it('recognizes admin and superadmin roles', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('superadmin')).toBe(true);
    expect(isAdminRole('ADMIN')).toBe(true);
    expect(isAdminRole('editor')).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  it('recognizes editor role only', () => {
    expect(isEditorRole('editor')).toBe(true);
    expect(isEditorRole('EDITOR')).toBe(true);
    expect(isEditorRole('admin')).toBe(false);
    expect(isEditorRole(undefined)).toBe(false);
  });
});
