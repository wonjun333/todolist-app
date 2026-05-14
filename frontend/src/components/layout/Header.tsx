import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { useT } from '../../hooks/useT';

export function Header() {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useT();

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate('/auth/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <NavLink
        to="/todos"
        className={({ isActive }) => `sidebar__logo${isActive ? ' sidebar__logo--active' : ''}`}
        aria-label="TodoListApp 홈"
      >
        <svg className="sidebar__logo-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path className="sidebar__logo-stand" d="M14 22h40v31a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7V26a4 4 0 0 1 4-4Z" />
          <path className="sidebar__logo-back" d="M46 18h4a7 7 0 0 1 7 7v25a7 7 0 0 1-7 7h-4V18Z" />
          <path className="sidebar__logo-top" d="M11 15a7 7 0 0 1 7-7h28a7 7 0 0 1 7 7v13H11V15Z" />
          <path className="sidebar__logo-page" d="M11 28h42v23a7 7 0 0 1-7 7H18a7 7 0 0 1-7-7V28Z" />
          <path className="sidebar__logo-ring" d="M22 5v16M42 5v16" />
          <circle className="sidebar__logo-hole" cx="22" cy="22" r="4" />
          <circle className="sidebar__logo-hole" cx="42" cy="22" r="4" />
          <path className="sidebar__logo-day sidebar__logo-day--accent" d="M20 38h6" />
          <path className="sidebar__logo-day" d="M32 38h6" />
          <path className="sidebar__logo-day" d="M44 38h6" />
          <path className="sidebar__logo-day" d="M20 48h6" />
          <path className="sidebar__logo-day sidebar__logo-day--accent" d="M32 48h6" />
          <path className="sidebar__logo-day" d="M44 48h6" />
        </svg>
        <span className="sr-only">TodoListApp</span>
      </NavLink>

      <nav className="sidebar__nav" role="navigation">
        <NavLink
          to="/todos"
          end
          className={({ isActive }) => `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`}
        >
          {t('nav.home')}
        </NavLink>
        <NavLink
          to="/categories"
          className={({ isActive }) => `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`}
        >
          {t('nav.categories')}
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`}
        >
          {t('nav.profile')}
        </NavLink>
      </nav>

      <div className="sidebar__footer">
        {currentUser && (
          <span className="sidebar__username">{currentUser.name}</span>
        )}
        <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
