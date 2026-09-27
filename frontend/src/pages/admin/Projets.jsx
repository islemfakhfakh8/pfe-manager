import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Card, Button, Badge, Select, Input, EmptyState, Spinner, ProgressBar, statutProjetBadge, Modal, Alert } from '../../components/UI.jsx';

export default function AdminProjets() {
  const [mode, setMode] = useState('actifs'); // actifs | archives
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ progression: 0, statut: 'en_cours' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/projets', { params: mode === 'archives' ? { archive: 1 } : {} });
      setProjets(data);
    } catch {}
    setLoading(false);
  }, [mode]);
  useEffect(() => { load(); }, [load]);

  const openEdit = (p) => { setEdit(p); setForm({ progression: p.progression, statut: p.statut }); setError(''); };

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/projets/${edit.id}`, form);
      setEdit(null); load();
    } catch (err) { setError(errMsg(err)); }
  };

  const filtered = projets.filter((p) =>
    !q || `${p.sujet_titre} ${p.etudiant_prenom} ${p.etudiant_nom} ${p.encadrant_prenom} ${p.encadrant_nom}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Projets & archives</h2>
          <p className="text-sm text-slate-500">Suivi des binômes étudiant/encadrant et historique des PFE</p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === 'actifs' ? 'primary' : 'secondary'} onClick={() => setMode('actifs')}>Actifs</Button>
          <Button variant={mode === 'archives' ? 'primary' : 'secondary'} onClick={() => setMode('archives')}>Archives</Button>
        </div>
      </div>

      <Card>
        <Input placeholder="Rechercher (sujet, étudiant, encadrant)…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm mb-4" />
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="📁" title={mode === 'archives' ? 'Aucun projet archivé' : 'Aucun projet'} />
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const [color, label] = statutProjetBadge(p.statut);
              return (
                <div key={p.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800">{p.sujet_titre}</h3>
                      <p className="text-sm text-slate-500">
                        🎓 {p.etudiant_prenom} {p.etudiant_nom} · 👨‍🏫 {p.encadrant_prenom} {p.encadrant_nom} · {p.annee_libelle || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={color}>{label}</Badge>
                      {mode === 'actifs' && <Button variant="secondary" onClick={() => openEdit(p)}>Gérer</Button>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <ProgressBar value={p.progression} className="flex-1" />
                    <span className="text-sm font-medium text-slate-600 w-12 text-right">{p.progression}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Gérer le projet">
        {edit && (
          <form onSubmit={save} className="space-y-4">
            {error && <Alert onClose={() => setError('')}>{error}</Alert>}
            <p className="text-sm text-slate-600">{edit.sujet_titre} — {edit.etudiant_prenom} {edit.etudiant_nom}</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Progression : {form.progression}%</label>
              <input
                type="range" min="0" max="100" step="5" value={form.progression}
                onChange={(e) => setForm({ ...form, progression: +e.target.value })}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
              <Select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="archive">Archivé</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEdit(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
