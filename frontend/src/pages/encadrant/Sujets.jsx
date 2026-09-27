import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Card, Button, Badge, Modal, Field, Input, Textarea, Select, EmptyState, Spinner, Alert, statutSujetBadge } from '../../components/UI.jsx';

const empty = { titre: '', description: '', competences: '', mots_cles: '', nb_places: 1, annee_id: '' };

export default function EncSujets() {
  const [sujets, setSujets] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([api.get('/sujets', { params: { mes_sujets: 1 } }), api.get('/annees')]);
      setSujets(s.data);
      setAnnees(a.data);
    } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const activeAnnee = annees.find((a) => a.active);

  const openCreate = () => {
    setForm({ ...empty, annee_id: activeAnnee ? String(activeAnnee.id) : '' });
    setError(''); setModal('create');
  };
  const openEdit = (s) => {
    setForm({ titre: s.titre, description: s.description, competences: s.competences || '', mots_cles: s.mots_cles || '', nb_places: s.nb_places, annee_id: s.annee_id ? String(s.annee_id) : '' });
    setForm((f) => ({ ...f, id: s.id }));
    setError(''); setModal('edit');
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.titre.trim() || !form.description.trim()) return setError('Titre et description sont obligatoires.');
    if (form.nb_places < 1) return setError('Le nombre de places doit être au moins 1.');
    setSaving(true);
    try {
      const payload = { ...form, nb_places: +form.nb_places, annee_id: form.annee_id ? +form.annee_id : null };
      if (modal === 'create') await api.post('/sujets', payload);
      else await api.put(`/sujets/${form.id}`, payload);
      setModal(null); load();
    } catch (err) { setError(errMsg(err)); }
    setSaving(false);
  };

  const remove = async (s) => {
    if (!confirm(`Supprimer le sujet « ${s.titre} » ?`)) return;
    try { await api.delete(`/sujets/${s.id}`); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mes sujets</h2>
          <p className="text-sm text-slate-500">Proposer et gérer vos sujets de PFE</p>
        </div>
        <Button onClick={openCreate}>+ Proposer un sujet</Button>
      </div>

      {loading ? <Spinner /> : sujets.length === 0 ? (
        <Card><EmptyState icon="📝" title="Aucun sujet" hint="Proposez votre premier sujet de PFE." /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sujets.map((s) => {
            const [color, label] = statutSujetBadge(s.statut);
            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800">{s.titre}</h3>
                  <Badge color={color}>{label}</Badge>
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3">{s.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {s.mots_cles?.split(',').filter(Boolean).map((k, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{k.trim()}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-sm">
                  <span className="text-slate-500">{s.places_prises}/{s.nb_places} place(s) prise(s)</span>
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline">Modifier</button>
                    <button onClick={() => remove(s)} className="text-red-600 hover:underline">Supprimer</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Proposer un sujet' : 'Modifier le sujet'} wide>
        {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
        <form onSubmit={save} className="space-y-4">
          <Field label="Titre" required>
            <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
          </Field>
          <Field label="Description" required>
            <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </Field>
          <Field label="Compétences requises">
            <Input value={form.competences} onChange={(e) => setForm({ ...form, competences: e.target.value })} placeholder="React, Node.js, UML…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mots-clés (séparés par virgules)">
              <Input value={form.mots_cles} onChange={(e) => setForm({ ...form, mots_cles: e.target.value })} placeholder="Web, IA, Mobile" />
            </Field>
            <Field label="Nombre de places" required>
              <Input type="number" min="1" value={form.nb_places} onChange={(e) => setForm({ ...form, nb_places: e.target.value })} required />
            </Field>
          </div>
          <Field label="Année universitaire">
            <Select value={form.annee_id} onChange={(e) => setForm({ ...form, annee_id: e.target.value })}>
              <option value="">— Aucune —</option>
              {annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}{a.active ? ' (active)' : ''}</option>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
