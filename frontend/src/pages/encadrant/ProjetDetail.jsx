import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { errMsg } from '../../api.js';
import { Card, Button, Badge, Field, Input, Textarea, Select, ProgressBar, Spinner, EmptyState, Modal, Alert, statutProjetBadge, typeLivrableLabel } from '../../components/UI.jsx';

const JALON_COLORS = { a_faire: 'slate', en_cours: 'amber', termine: 'green' };
const JALON_LABELS = { a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé' };

export default function EncProjetDetail() {
  const { id } = useParams();
  const [projet, setProjet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prog, setProg] = useState(0);
  const [statut, setStatut] = useState('en_cours');
  const [jalonModal, setJalonModal] = useState(false);
  const [jalonForm, setJalonForm] = useState({ titre: '', description: '', echeance: '' });
  const [feedback, setFeedback] = useState({ id: null, commentaire: '' });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/projets/${id}`);
      setProjet(data);
      setProg(data.progression);
      setStatut(data.statut);
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const saveProgression = async () => {
    try { await api.patch(`/projets/${id}`, { progression: prog, statut }); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  const addJalon = async (e) => {
    e.preventDefault();
    if (!jalonForm.titre.trim()) return;
    try {
      await api.post(`/projets/${id}/jalons`, jalonForm);
      setJalonModal(false); setJalonForm({ titre: '', description: '', echeance: '' }); load();
    } catch (e2) { alert(errMsg(e2)); }
  };

  const cycleJalon = async (j) => {
    const order = ['a_faire', 'en_cours', 'termine'];
    const next = order[(order.indexOf(j.statut) + 1) % order.length];
    try { await api.patch(`/projets/jalons/${j.id}`, { statut: next }); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  const removeJalon = async (j) => {
    if (!confirm(`Supprimer le jalon « ${j.titre} » ?`)) return;
    try { await api.delete(`/projets/jalons/${j.id}`); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try { await api.patch(`/livrables/${feedback.id}/feedback`, { commentaire: feedback.commentaire }); setFeedback({ id: null, commentaire: '' }); load(); }
    catch (e2) { alert(errMsg(e2)); }
  };

  if (loading) return <Spinner />;
  if (!projet) return <Alert>{error || 'Projet introuvable'}</Alert>;

  const [pColor, pLabel] = statutProjetBadge(projet.statut);

  return (
    <div className="space-y-4">
      <Link to="/encadrant/projets" className="text-sm text-blue-600 hover:underline">← Retour aux encadrements</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{projet.sujet_titre}</h2>
          <p className="text-sm text-slate-500">
            🎓 {projet.etudiant_prenom} {projet.etudiant_nom} ({projet.etudiant_email}) · Début : {projet.date_debut}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={pColor}>{pLabel}</Badge>
          <Link to={`/messages`}><Button variant="secondary">💬 Message</Button></Link>
        </div>
      </div>

      {error && <Alert onClose={() => setError('')}>{error}</Alert>}

      <Card title="Avancement global">
        <div className="flex items-center gap-3 mb-3">
          <ProgressBar value={prog} className="flex-1" />
          <span className="font-semibold text-slate-700 w-12 text-right">{prog}%</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-slate-500 mb-1">Ajuster la progression</label>
            <input type="range" min="0" max="100" step="5" value={prog} onChange={(e) => setProg(+e.target.value)} className="w-full accent-blue-600" />
          </div>
          <Field label="Statut">
            <Select value={statut} onChange={(e) => setStatut(e.target.value)} className="w-40">
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="archive">Archivé</option>
            </Select>
          </Field>
          <Button onClick={saveProgression}>Enregistrer</Button>
        </div>
      </Card>

      <Card title="Jalons" actions={<Button variant="secondary" onClick={() => setJalonModal(true)}>+ Jalon</Button>}>
        {projet.jalons.length === 0 ? <EmptyState icon="🎯" title="Aucun jalon" hint="Découpez le projet en étapes." /> : (
          <div className="space-y-2">
            {projet.jalons.map((j) => (
              <div key={j.id} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3">
                <Badge color={JALON_COLORS[j.statut]}>{JALON_LABELS[j.statut]}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{j.titre}</p>
                  {j.description && <p className="text-xs text-slate-500">{j.description}</p>}
                </div>
                {j.echeance && <span className="text-xs text-slate-400 whitespace-nowrap">📅 {j.echeance}</span>}
                <button onClick={() => cycleJalon(j)} className="text-xs text-blue-600 hover:underline">Changer</button>
                <button onClick={() => removeJalon(j)} className="text-xs text-red-600 hover:underline">Suppr.</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Livrables déposés">
        {projet.livrables.length === 0 ? <EmptyState icon="📎" title="Aucun livrable" /> : (
          <div className="space-y-3">
            {projet.livrables.map((l) => (
              <div key={l.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <a href={l.fichier_url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline text-sm truncate block">
                      {l.fichier_nom}
                    </a>
                    <p className="text-xs text-slate-400">{typeLivrableLabel(l.type)} · déposé le {l.date_depot}</p>
                  </div>
                  <Button variant="secondary" onClick={() => setFeedback({ id: l.id, commentaire: l.commentaire_encadrant || '' })}>
                    {l.commentaire_encadrant ? 'Modifier le feedback' : 'Laisser un feedback'}
                  </Button>
                </div>
                {l.commentaire_encadrant && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-sm text-slate-700">
                    <span className="font-medium text-blue-700">Votre feedback </span>
                    <span className="text-xs text-slate-400">({l.commentaire_date})</span>
                    <p className="mt-1">{l.commentaire_encadrant}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={jalonModal} onClose={() => setJalonModal(false)} title="Ajouter un jalon">
        <form onSubmit={addJalon} className="space-y-4">
          <Field label="Titre" required>
            <Input value={jalonForm.titre} onChange={(e) => setJalonForm({ ...jalonForm, titre: e.target.value })} required />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={jalonForm.description} onChange={(e) => setJalonForm({ ...jalonForm, description: e.target.value })} />
          </Field>
          <Field label="Échéance">
            <Input type="date" value={jalonForm.echeance} onChange={(e) => setJalonForm({ ...jalonForm, echeance: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setJalonModal(false)}>Annuler</Button>
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!feedback.id} onClose={() => setFeedback({ id: null, commentaire: '' })} title="Feedback sur le livrable">
        <form onSubmit={submitFeedback} className="space-y-4">
          <Field label="Votre commentaire">
            <Textarea rows={4} value={feedback.commentaire} onChange={(e) => setFeedback({ ...feedback, commentaire: e.target.value })}
              placeholder="Commentez le livrable de l'étudiant…" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setFeedback({ id: null, commentaire: '' })}>Annuler</Button>
            <Button type="submit">Envoyer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
