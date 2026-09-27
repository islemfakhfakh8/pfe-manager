import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Card, Button, Modal, Field, Input, Badge, Alert, EmptyState, Spinner } from '../../components/UI.jsx';

const empty = { libelle: '', date_debut: '', date_fin: '', active: false };

export default function AdminAnnees() {
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setAnnees((await api.get('/annees')).data); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4}-\d{4}$/.test(form.libelle.trim())) {
      return setError('Le libellé doit suivre le format AAAA-AAAA (ex : 2026-2027).');
    }
    if (form.date_debut && form.date_fin && form.date_fin < form.date_debut) {
      return setError('La date de fin doit être postérieure à la date de début.');
    }
    try {
      await api.post('/annees', form);
      if (form.active) await activateLast();
      setModal(false); setForm(empty); load();
    } catch (e2) { setError(errMsg(e2)); }
  };

  const activateLast = async () => {
    const { data } = await api.get('/annees');
    const found = data.find((a) => a.libelle === form.libelle.trim());
    if (found) await api.patch(`/annees/${found.id}/activer`);
  };

  const activer = async (a) => {
    try { await api.patch(`/annees/${a.id}/activer`); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  const remove = async (a) => {
    if (!confirm(`Supprimer l'année ${a.libelle} ?`)) return;
    try { await api.delete(`/annees/${a.id}`); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Années universitaires</h2>
          <p className="text-sm text-slate-500">Définir les périodes des campagnes de PFE</p>
        </div>
        <Button onClick={() => { setForm(empty); setError(''); setModal(true); }}>+ Nouvelle année</Button>
      </div>

      <Card>
        {loading ? <Spinner /> : annees.length === 0 ? <EmptyState icon="📅" title="Aucune année" /> : (
          <div className="divide-y divide-slate-100">
            {annees.map((a) => (
              <div key={a.id} className="py-3 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-slate-800">{a.libelle}</span>
                {a.active ? <Badge color="green">Active</Badge> : <Badge color="slate">Inactive</Badge>}
                <span className="text-sm text-slate-500">
                  {a.date_debut && a.date_fin ? `${a.date_debut} → ${a.date_fin}` : 'Période non définie'}
                </span>
                <div className="ml-auto flex gap-3 text-xs">
                  {!a.active && <button onClick={() => activer(a)} className="text-emerald-600 hover:underline">Activer</button>}
                  <button onClick={() => remove(a)} className="text-red-600 hover:underline">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Nouvelle année universitaire">
        {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
        <form onSubmit={save} className="space-y-4">
          <Field label="Libellé (AAAA-AAAA)" required>
            <Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="2026-2027" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date de début">
              <Input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} />
            </Field>
            <Field label="Date de fin">
              <Input type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
            Définir comme année active
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Annuler</Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
