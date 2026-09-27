import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Card, Button, Modal, Field, Input, Select, Badge, Alert, Spinner, EmptyState } from '../../components/UI.jsx';

const ROLES = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'encadrant', label: 'Encadrant' },
  { value: 'etudiant', label: 'Étudiant' },
];

const empty = { nom: '', prenom: '', email: '', password: '', role: 'etudiant', actif: true };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // null | empty | user
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { role: roleFilter || undefined, q: q || undefined } });
      setUsers(data);
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, [roleFilter, q]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(empty); setError(''); setModal('create'); };
  const openEdit = (u) => { setForm({ ...u, password: '', actif: !!u.actif }); setError(''); setModal('edit'); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (modal === 'create') await api.post('/users', form);
      else await api.put(`/users/${form.id}`, form);
      setModal(null);
      load();
    } catch (err) { setError(errMsg(err)); }
    setSaving(false);
  };

  const remove = async (u) => {
    if (!confirm(`Supprimer / désactiver ${u.prenom} ${u.nom} ?`)) return;
    try { await api.delete(`/users/${u.id}`); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  const toggleActif = async (u) => {
    try { await api.put(`/users/${u.id}`, { actif: !u.actif }); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Utilisateurs</h2>
          <p className="text-sm text-slate-500">Gérer les comptes encadrants, étudiants et administrateurs</p>
        </div>
        <Button onClick={openCreate}>+ Nouvel utilisateur</Button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="Rechercher (nom, email)…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="max-w-[200px]">
            <option value="">Tous les rôles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </div>

        {loading ? <Spinner /> : users.length === 0 ? (
          <EmptyState icon="👥" title="Aucun utilisateur" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">Nom</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Rôle</th>
                  <th className="py-2 pr-4 font-medium">Statut</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium text-slate-700">{u.prenom} {u.nom}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{u.email}</td>
                    <td className="py-2.5 pr-4">
                      <Badge color={u.role === 'admin' ? 'violet' : u.role === 'encadrant' ? 'blue' : 'green'}>
                        {ROLES.find((r) => r.value === u.role)?.label}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge color={u.actif ? 'green' : 'slate'}>{u.actif ? 'Actif' : 'Désactivé'}</Badge>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline text-xs mr-3">Modifier</button>
                      <button onClick={() => toggleActif(u)} className="text-amber-600 hover:underline text-xs mr-3">
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => remove(u)} className="text-red-600 hover:underline text-xs">Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}>
        {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom" required>
              <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
            </Field>
            <Field label="Nom" required>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            </Field>
          </div>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label={modal === 'create' ? 'Mot de passe' : 'Nouveau mot de passe (laisser vide pour ne pas changer)'} required={modal === 'create'}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={modal === 'create'} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rôle" required>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Field>
            <Field label="Statut">
              <Select value={form.actif ? '1' : '0'} onChange={(e) => setForm({ ...form, actif: e.target.value === '1' })}>
                <option value="1">Actif</option>
                <option value="0">Désactivé</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
