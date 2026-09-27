import { useEffect } from 'react';

export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          {title && <h3 className="font-semibold text-slate-800">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

const badgeColors = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-100 text-violet-700',
};

export function Badge({ color = 'slate', children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColors[color] || badgeColors.slate}`}>
      {children}
    </span>
  );
}

export const statutSujetBadge = (s) =>
  ({ propose: ['amber', 'Proposé'], valide: ['green', 'Validé'], rejete: ['red', 'Rejeté'], complet: ['blue', 'Complet'], archive: ['slate', 'Archivé'] }[s] || ['slate', s]);

export const statutCandBadge = (s) =>
  ({ en_attente: ['amber', 'En attente'], acceptee: ['green', 'Acceptée'], refusee: ['red', 'Refusée'], annulee: ['slate', 'Annulée'] }[s] || ['slate', s]);

export const statutProjetBadge = (s) =>
  ({ en_cours: ['blue', 'En cours'], termine: ['green', 'Terminé'], archive: ['slate', 'Archivé'] }[s] || ['slate', s]);

export const typeLivrableLabel = (t) =>
  ({ rapport_avancement: "Rapport d'avancement", memoire_final: 'Mémoire final', presentation: 'Présentation', autre: 'Autre' }[t] || t);

export function Button({ variant = 'primary', className = '', children, ...props }) {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, error, children, required }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

export function Input(props) { return <input {...props} className={`${inputCls} ${props.className || ''}`} />; }
export function Textarea(props) { return <textarea {...props} className={`${inputCls} ${props.className || ''}`} />; }
export function Select(props) { return <select {...props} className={`${inputCls} ${props.className || ''}`} />; }

export function ProgressBar({ value = 0, className = '' }) {
  return (
    <div className={`w-full bg-slate-200 rounded-full h-2.5 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${value >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex justify-center p-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

export function EmptyState({ icon = '📭', title, hint }) {
  return (
    <div className="text-center py-12 text-slate-500">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="font-medium text-slate-600">{title}</p>
      {hint && <p className="text-sm mt-1">{hint}</p>}
    </div>
  );
}

export function StatCard({ icon, label, value, color = 'blue', sub }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    violet: 'bg-violet-100 text-violet-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export function Alert({ type = 'error', children, onClose }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`flex items-start justify-between gap-3 border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      <span>{children}</span>
      {onClose && <button onClick={onClose} className="opacity-60 hover:opacity-100">×</button>}
    </div>
  );
}
