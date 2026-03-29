export function isAdminRole(role?: string): boolean {
  const normalized = (role ?? '').toLowerCase();
  return normalized === 'admin' || normalized === 'superadmin';
}

export function isEditorRole(role?: string): boolean {
  return (role ?? '').toLowerCase() === 'editor';
}
