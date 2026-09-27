import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Field, Input, Alert } from '../components/UI.jsx';

const DEMO = [
  { role: 'Administrateur', email: 'admin@univ.dz', mdp: 'admin123' },
  { role: 'Encadrant', email: 'k.mansouri@univ.dz', mdp: 'encadrant123' },
  { role: 'Étudiant (avec projet)', email: 'a.boumedien@univ.dz', mdp: 'etudiant123' },
  { role: 'Étudiant (sans projet)', email: 'y.meziane@univ.dz', mdp: 'etudiant123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Veuillez saisir votre email et mot de passe.');
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 text-white">
          <div className="text-5xl mb-2">🎓</div>
          <h1 className="text-2xl font-bold">PFE Manager</h1>
          <p className="text-blue-100 text-sm mt-1">Suivi et gestion des Projets de Fin d'Études</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Connexion</h2>
          {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
          <form onSubmit={submit} className="space-y-4">
            <Field label="Adresse email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vous@univ.dz"
                autoComplete="username"
              />
            </Field>
            <Field label="Mot de passe" required>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full py-2.5">
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <button
            className="mt-4 text-xs text-slate-400 hover:text-blue-600 w-full text-center"
            onClick={() => setShowDemo(!showDemo)}
          >
            {showDemo ? 'Masquer' : 'Afficher'} les comptes de démonstration
          </button>
          {showDemo && (
            <div className="mt-2 space-y-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => setForm({ email: d.email, password: d.mdp })}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs transition-colors"
                >
                  <span className="font-medium text-slate-700">{d.role}</span>
                  <span className="text-slate-400 ml-2">{d.email} · {d.mdp}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
