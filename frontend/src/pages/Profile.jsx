import { useState } from 'react';
import api, { errMsg } from '../api.js';
import { Card, Button, Field, Input, Alert } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ ancien: '', nouveau: '', confirm: '' });
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.nouveau !== form.confirm) return setMsg({ type: 'error', text: 'La confirmation ne correspond pas.' });
    if (form.nouveau.length < 6) return setMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    try {
      await api.post('/auth/change-password', { ancien: form.ancien, nouveau: form.nouveau });
      setMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setForm({ ancien: '', nouveau: '', confirm: '' });
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Mon profil</h2>
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{user?.prenom} {user?.nom}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs text-blue-600 font-medium mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
      </Card>
      <Card title="Changer mon mot de passe">
        {msg && <div className="mb-4"><Alert type={msg.type}>{msg.text}</Alert></div>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Ancien mot de passe" required>
            <Input type="password" value={form.ancien} onChange={(e) => setForm({ ...form, ancien: e.target.value })} />
          </Field>
          <Field label="Nouveau mot de passe" required>
            <Input type="password" value={form.nouveau} onChange={(e) => setForm({ ...form, nouveau: e.target.value })} />
          </Field>
          <Field label="Confirmer le nouveau mot de passe" required>
            <Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </Field>
          <Button type="submit">Enregistrer</Button>
        </form>
      </Card>
    </div>
  );
}
