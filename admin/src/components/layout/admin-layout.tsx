import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/use-auth';
import styles from './admin-layout.module.css';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navClassName = (path: string, exact = false) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    return `${styles.menuLink} ${isActive ? styles.menuLinkActive : ''}`.trim();
  };

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand">გამარჯობა, {user?.full_name ?? 'ადმინისტრატორო'}</Link>
        <nav className={styles.menu}>
          <Link to="/" className={navClassName('/', true)}>დაშბორდი</Link>
          <h2 className={styles.sectionTitle}>სტატიები</h2>
          <Link to="/posts" className={navClassName('/posts')}>სტატიის დამატება</Link>
          <Link to="/articles/mine" className={navClassName('/articles/mine')}>სტატიების სია</Link>
          <Link to="/articles/drafts" className={navClassName('/articles/drafts')}>სტატიის დრაფტები</Link>
          <Link to="/articles/deleted" className={navClassName('/articles/deleted')}>წაშლილები</Link>
          <h2 className={styles.sectionTitle}>ვაკანსიები</h2>
          <Link to="/job-postings/new" className={navClassName('/job-postings/new')}>ვაკანსიის დამატება</Link>
          <Link to="/job-postings/list" className={navClassName('/job-postings/list')}>ვაკანსიების სია</Link>
          <h2 className={styles.sectionTitle}>ექიმები</h2>
          <Link to="/doctors/new" className={navClassName('/doctors/new')}>ექიმის დამატება</Link>
          <Link to="/doctors/list" className={navClassName('/doctors/list')}>ექიმების სია</Link>
          <h2 className={styles.sectionTitle}>მომხმარებლები</h2>
          <Link to="/users/new" className={navClassName('/users/new')}>მომხმარებლის დამატება</Link>
          <Link to="/users/list" className={navClassName('/users/list')}>მომხმარებლების სია</Link>
          <Link to="/settings" className={navClassName('/settings')}>პარამეტრები</Link>
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
