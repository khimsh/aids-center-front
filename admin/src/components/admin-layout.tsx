import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand">AIDS Center Admin</Link>
        <nav className="menu">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/articles">Articles</NavLink>
          <NavLink to="/programs">Programs</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="caption">Signed in as</p>
            <strong>{user?.email ?? user?.full_name ?? 'Admin user'}</strong>
          </div>
          <button type="button" onClick={onLogout}>Log out</button>
        </header>

        <section className="panel">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
