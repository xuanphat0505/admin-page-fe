import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiFileText,
  FiSettings,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LuLayoutDashboard } from 'react-icons/lu';
import AuthContext from '../../context/AuthProvider';

import './Sidebar.scss';
function Sidebar() {
  const navigate = useNavigate();
  const { auth, logout } = useContext(AuthContext);
  const user = auth?.user || {};

  const displayName = useMemo(() => {
    const name = typeof user.name === 'string' ? user.name.trim() : '';
    if (name) return name;
    const username = typeof user.username === 'string' ? user.username.trim() : '';
    if (username) return username;
    const email = typeof user.email === 'string' ? user.email.trim() : '';
    if (email) return email;
    return 'Admin';
  }, [user]);

  const secondaryLabel = useMemo(() => {
    if (typeof user.email === 'string' && user.email.trim()) return user.email.trim();
    if (typeof user.username === 'string' && user.username.trim()) return '@' + user.username.trim();
    return 'Quan tri vien';
  }, [user]);

  const initials = useMemo(() => {
    const parts = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
    return parts || 'VN';
  }, [displayName]);

  const readStoredCollapsed = () => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(readStoredCollapsed);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const appElement = document.querySelector('.App');
    if (appElement) {
      appElement.classList.toggle('sidebar-collapsed', isCollapsed);
    }
    try {
      localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    } catch {
      // ignore persistence errors
    }
    return () => {
      if (appElement) {
        appElement.classList.remove('sidebar-collapsed');
      }
    };
  }, [isCollapsed]);

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    if (isCollapsed) {
      node.setAttribute('inert', '');
    } else {
      node.removeAttribute('inert');
    }
  }, [isCollapsed]);


  useEffect(() => {
    if (isCollapsed) {
      setIsAccountOpen(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const ensureResponsiveState = (matches) => {
      if (matches) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(readStoredCollapsed());
      }
    };

    ensureResponsiveState(mediaQuery.matches);

    const handler = (event) => ensureResponsiveState(event.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  useEffect(() => {
    if (!isAccountOpen) return undefined;

    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAccountOpen]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setIsAccountOpen(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-label={isCollapsed ? 'Mo rong sidebar' : 'Thu gon sidebar'}
        title={isCollapsed ? 'Mo rong sidebar' : 'Thu gon sidebar'}
      >
        {isCollapsed ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}
      </button>
      <div className="sidebar-body" ref={bodyRef} aria-hidden={isCollapsed}>
        <div className="brand">
          <div className="logo" aria-hidden="true">
            {initials}
          </div>
          <div className="brand-info">
            <h2 className="sidebar-title">{displayName}</h2>
            <span className="sidebar-subtitle">{secondaryLabel}</span>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Main">
          <ul className="sidebar-menu">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? 'active' : '')}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <li>
                <LuLayoutDashboard className="icon" size={18} />
                <span>Dashboard</span>
              </li>
            </NavLink>
            <NavLink
              to="/news"
              className={({ isActive }) => (isActive ? 'active' : '')}
              title={isCollapsed ? 'Tin tuc' : undefined}
            >
              <li>
                <FiFileText className="icon" size={18} />
                <span>Tin tuc</span>
              </li>
            </NavLink>
            <Link to="#" title={isCollapsed ? 'Cai dat' : undefined}>
              <li>
                <FiSettings className="icon" size={18} />
                <span>Cai dat</span>
              </li>
            </Link>
          </ul>
        </nav>
        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
          aria-label="Dang xuat"
          title="Dang xuat"
        >
          <FiLogOut size={18} />
          <span>Dang xuat</span>
        </button>
        <div
          className={`sidebar-account ${isAccountOpen ? 'is-open' : ''}`}
          ref={accountRef}
        >
          <button
            type="button"
            className="account-toggle"
            onClick={() => setIsAccountOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={isAccountOpen}
            aria-label="Thong tin tai khoan"
            title="Thong tin tai khoan"
          >
            <div className="avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="account-text">
              <span className="account-name">{displayName}</span>
              <span className="account-meta">{secondaryLabel}</span>
            </div>
            <FiChevronDown className="account-arrow" size={18} />
          </button>
          {isAccountOpen && (
            <div className="account-dropdown" role="menu" aria-label="Thong tin tai khoan">
              <span className="account-heading">Thong tin tai khoan</span>
              <div className="account-summary">
                <FiUser size={18} className="summary-icon" />
                <div className="summary-text">
                  <span className="summary-name">{displayName}</span>
                  {user.username && (
                    <span className="summary-username">@{user.username}</span>
                  )}
                  {user.email && <span className="summary-email">{user.email}</span>}
                </div>
              </div>
              <button
                type="button"
                className="account-action account-action--logout"
                onClick={handleLogout}
              >
                <FiLogOut size={16} />
                <span>Dang xuat</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;



















