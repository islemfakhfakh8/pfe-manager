import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = {
  admin: [
    { to: '/admin', label: 'Tableau de bord', icon: '📊', end: true },
    { to: '/admin/users', label: 'Utilisateurs', icon: '👥' },
    { to: '/admin/annees', label: 'Années universitaires', icon: '📅' },
    { to: '/admin/sujets', label: 'Validation des sujets', icon: '📝' },
    { to: '/admin/projets', label: 'Projets & archives', icon: '📁' },
    { to: '/admin/soutenances', label: 'Soutenances', icon: '🎤' },
    { to: '/admin/rapports', label: 'Rapports & exports', icon: '📈' },
    { to: '/messages', label: 'Messagerie', icon: '💬' },
  ],
  encadrant: [
    { to: '/encadrant', label: 'Tableau de bord', icon: '📊', end: true },
    { to: '/encadrant/sujets', label: 'Mes sujets', icon: '📝' },
    { to: '/encadrant/candidatures', label: 'Candidatures', icon: '📨' },
    { to: '/encadrant/projets', label: 'Mes encadrements', icon: '📁' },
    { to: '/encadrant/soutenances', label: 'Soutenances', icon: '🎤' },
    { to: '/messages', label: 'Messagerie', icon: '💬' },
  ],
  etudiant: [
    { to: '/etudiant', label: 'Tableau de bord', icon: '📊', end: true },
    { to: '/etudiant/sujets', label: 'Sujets disponibles', icon: '🔎' },
    { to: '/etudiant/candidatures', label: 'Mes candidatures', icon: '📨' },
    { to: '/etudiant/projet', label: 'Mon projet', icon: '🚀' },
    { to: '/etudiant/soutenance', label: 'Ma soutenance', icon: '🎤' },
    { to: '/messages', label: 'Messagerie', icon: '💬' },
  ],
};

const ROLE_LABEL = { admin: 'Administrateur', encadrant: 'Encadrant', etudiant: 'Étudiant' };

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setItems(data.notifications);
      setUnread(data.non_lues);
    } catch { /* silencieux */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markRead = async (n) => {
    await api.patch(`/notifications/${n.id}/lu`).catch(() => {});
    load();
    if (n.lien) { setOpen(false); navigate(n.lien); }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-lg"
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={async () => { await api.patch('/notifications/tout-lire').catch(() => {}); load(); }}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="p-4 text-sm text-slate-400 text-center">Aucune notification</p>}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${n.lu ? '' : 'bg-blue-50/60'}`}
              >
                <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                  {!n.lu && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                  {n.titre}
                </p>
                {n.message && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>}
                <p className="text-[11px] text-slate-400 mt-1">{n.created_at}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = NAV[user?.role] || [];

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎓</span>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">PFE Manager</h1>
              <p className="text-xs text-slate-400">Université — Gestion des PFE</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkCls} onClick={() => setSidebarOpen(false)}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-slate-400">{ROLE_LABEL[user?.role]}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full text-sm text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg py-1.5 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-20">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="lg:hidden font-semibold text-slate-700">🎓 PFE Manager</div>
          <div className="flex items-center gap-2 ml-auto">
            <NotificationsBell />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
