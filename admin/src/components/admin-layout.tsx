import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { isAdminRole } from '../lib/articles';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const adminView = isAdminRole(user?.role);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand">გამარჯობა, {user?.full_name ?? 'ადმინისტრატორო'}</Link>
        <nav className="menu">
          <NavLink to="/" end>დაშბორდი</NavLink>
          <NavLink to="/posts">სტატიის დამატება</NavLink>
          <NavLink to="/articles/mine">სტატიების სია</NavLink>
          <NavLink to="/articles/drafts">სტატიის დრაფტები</NavLink>
          <NavLink to="/articles/deleted">წაშლილები</NavLink>
          <NavLink to="/job-postings/new">ვაკანსიის დამატება</NavLink>
          <NavLink to="/job-postings/list">ვაკანსიების სია</NavLink>
          {adminView ? <NavLink to="/users">მომხმარებლები</NavLink> : null}
          <NavLink to="/settings">პარამეტრები</NavLink>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="caption">თქვენ შესული ხართ როგორც</p>
            <strong>{user?.email ?? user?.full_name}</strong>
          </div>
          <button type="button" onClick={onLogout}>გამოსვლა</button>
        </header>

        <section className="panel">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
