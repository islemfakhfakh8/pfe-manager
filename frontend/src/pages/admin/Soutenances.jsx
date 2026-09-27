import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Card, Button, Badge, Modal, Field, Input, Select, Textarea, EmptyState, Spinner, Alert } from '../../components/UI.jsx';

const empty = { projet_id: '', date: '', heure: '', salle: '', membres_jury: '' };

export default function AdminSoutenances() {
  const [soutenances, setSoutenances] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([api.get('/soutenances'), api.get('/projets')]);
      setSoutenances(s.data);
      setProjets(p.data);
    } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(empty); setError(''); setModal(true); };
  const openEdit = (s) => {
    setForm({ projet_id: s.projet_id, date: s.date, heure: s.heure, salle: s.salle, membres_jury: s.membres_jury || '' });
    setError(''); setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.projet_id || !form.date || !form.heure || !form.salle.trim()) {
      return setError('Projet, date, heure et salle sont obligatoires.');
    }
    try {
      await api.post('/soutenances', { ...form, projet_id: +form.projet_id });
      setModal(false); load();
    } catch (err) { setError(errMsg(err)); }
  };

  const remove = async (s) => {
    if (!confirm('Supprimer cette soutenance ?')) return;
    try { await api.delete(`/soutenances/${s.id}`); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  const plannedProjectIds = new Set(soutenances.map((s) => s.projet_id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Calendrier des soutenances</h2>
          <p className="text-sm text-slate-500">Planifier date, heure, salle et jury</p>
        </div>
        <Button onClick={openCreate}>+ Planifier</Button>
      </div>

      <Card>
        {loading ? <Spinner /> : soutenances.length === 0 ? (
          <EmptyState icon="🎤" title="Aucune soutenance planifiée" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">Date & heure</th>
                  <th className="py-2 pr-4 font-medium">Sujet</th>
                  <th className="py-2 pr-4 font-medium">Étudiant</th>
                  <th className="py-2 pr-4 font-medium">Salle</th>
                  <th className="py-2 pr-4 font-medium">Jury</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {soutenances.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 align-top">
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <Badge color="blue">{s.date}</Badge>
                      <span className="ml-2 text-slate-600">{s.heure}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700 max-w-xs">{s.sujet_titre}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{s.etudiant_prenom} {s.etudiant_nom}</td>
                    <td className="py-2.5 pr-4 text-slate-500">📍 {s.salle}</td>
                    <td className="py-2.5 pr-4 text-slate-500 max-w-xs">{s.membres_jury || '—'}</td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-xs mr-3">Modifier</button>
                      <button onClick={() => remove(s)} className="text-red-600 hover:underline text-xs">Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Planifier une soutenance">
        {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
        <form onSubmit={save} className="space-y-4">
          <Field label="Projet" required>
            <Select value={form.projet_id} onChange={(e) => setForm({ ...form, projet_id: e.target.value })} required>
              <option value="">— Sélectionner un projet —</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id} disabled={plannedProjectIds.has(p.id) && +form.projet_id !== p.id}>
                  {p.sujet_titre} — {p.etudiant_prenom} {p.etudiant_nom}
                  {plannedProjectIds.has(p.id) ? ' (déjà planifiée)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </Field>
            <Field label="Heure" required>
              <Input type="time" value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value })} required />
            </Field>
          </div>
          <Field label="Salle" required>
            <Input value={form.salle} onChange={(e) => setForm({ ...form, salle: e.target.value })} placeholder="Amphi A" required />
          </Field>
          <Field label="Membres du jury (séparés par des virgules)">
            <Textarea rows={2} value={form.membres_jury} onChange={(e) => setForm({ ...form, membres_jury: e.target.value })}
              placeholder="Pr. X (président), Dr. Y (examinateur), M. Z (encadrant)" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
