import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../api.js';
import { Card, Button, Badge, Select, Textarea, ProgressBar, Spinner, EmptyState, Modal, Alert, Field, typeLivrableLabel } from '../../components/UI.jsx';

const JALON_COLORS = { a_faire: 'slate', en_cours: 'amber', termine: 'green' };
const JALON_LABELS = { a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé' };
const TYPES = [
  { value: 'rapport_avancement', label: "Rapport d'avancement" },
  { value: 'memoire_final', label: 'Mémoire final' },
  { value: 'presentation', label: 'Présentation' },
  { value: 'autre', label: 'Autre' },
];

export default function EtuProjet() {
  const [projet, setProjet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadModal, setUploadModal] = useState(false);
  const [upForm, setUpForm] = useState({ type: 'rapport_avancement', commentaire: '' });
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/projets/mon-projet');
      if (data) {
        const full = (await api.get(`/projets/${data.id}`)).data;
        setProjet(full);
      } else {
        setProjet(null);
      }
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError('Veuillez sélectionner un fichier.');
    setError('');
    setUploading(true);
    const fd = new FormData();
    fd.append('projet_id', projet.id);
    fd.append('type', upForm.type);
    fd.append('fichier', file);
    try {
      await api.post('/livrables', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadModal(false); setUpForm({ type: 'rapport_avancement', commentaire: '' }); if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) { setError(errMsg(err)); }
    setUploading(false);
  };

  const cycleJalon = async (j) => {
    const order = ['a_faire', 'en_cours', 'termine'];
    const next = order[(order.indexOf(j.statut) + 1) % order.length];
    try { await api.patch(`/projets/jalons/${j.id}`, { statut: next }); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  if (loading) return <Spinner />;

  if (!projet) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Mon projet</h2>
        <Card>
          <EmptyState icon="🚀" title="Vous n'avez pas encore de projet"
            hint="Postulez à un sujet et attendez l'acceptation d'un encadrant." />
          <div className="flex justify-center"><Link to="/etudiant/sujets"><Button>Parcourir les sujets</Button></Link></div>
        </Card>
      </div>
    );
  }

  const steps = [
    { label: 'Sujet validé', done: true },
    { label: 'Candidature acceptée', done: true },
    { label: 'Avancement', done: projet.progression >= 50, active: true },
    { label: 'Livrables', done: projet.nb_livrables > 0 },
    { label: 'Soutenance', done: !!projet.soutenance },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{projet.sujet_titre}</h2>
          <p className="text-sm text-slate-500">
            👨‍🏫 {projet.encadrant_prenom} {projet.encadrant_nom} · Début : {projet.date_debut}
          </p>
        </div>
        <Link to="/messages"><Button variant="secondary">💬 Contacter mon encadrant</Button></Link>
      </div>

      {error && !uploadModal && <Alert onClose={() => setError('')}>{error}</Alert>}

      <Card title="Timeline du PFE">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <div className={`flex items-center gap-2 ${i < steps.length - 1 ? 'sm:flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  s.done ? 'bg-emerald-500 text-white' : s.active ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {s.done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${s.done || s.active ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`hidden sm:block flex-1 h-0.5 ${s.done ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <ProgressBar value={projet.progression} className="flex-1" />
            <span className="font-semibold text-slate-700 w-12 text-right">{projet.progression}%</span>
          </div>
        </div>
      </Card>

      <Card title="Jalons du projet">
        {projet.jalons.length === 0 ? <EmptyState icon="🎯" title="Aucun jalon défini" hint="Votre encadrant ajoutera bientôt des étapes." /> : (
          <div className="space-y-2">
            {projet.jalons.map((j) => (
              <div key={j.id} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3">
                <Badge color={JALON_COLORS[j.statut]}>{JALON_LABELS[j.statut]}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{j.titre}</p>
                  {j.description && <p className="text-xs text-slate-500">{j.description}</p>}
                </div>
                {j.echeance && <span className="text-xs text-slate-400 whitespace-nowrap">📅 {j.echeance}</span>}
                {j.statut !== 'termine' && <button onClick={() => cycleJalon(j)} className="text-xs text-blue-600 hover:underline">Avancer</button>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Mes livrables" actions={<Button variant="secondary" onClick={() => { setError(''); setUploadModal(true); }}>+ Déposer</Button>}>
        {projet.livrables.length === 0 ? <EmptyState icon="📎" title="Aucun livrable déposé" hint="Déposez vos rapports d'avancement et votre mémoire." /> : (
          <div className="space-y-3">
            {projet.livrables.map((l) => (
              <div key={l.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <a href={l.fichier_url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline text-sm truncate block">{l.fichier_nom}</a>
                    <p className="text-xs text-slate-400">{typeLivrableLabel(l.type)} · déposé le {l.date_depot}</p>
                  </div>
                  {l.commentaire_encadrant ? <Badge color="green">Feedback</Badge> : <Badge color="amber">En attente</Badge>}
                </div>
                {l.commentaire_encadrant && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-sm text-slate-700">
                    <span className="font-medium text-emerald-700">Feedback de votre encadrant </span>
                    <span className="text-xs text-slate-400">({l.commentaire_date})</span>
                    <p className="mt-1">{l.commentaire_encadrant}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {projet.soutenance && (
        <Card title="Ma soutenance">
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-blue-500 uppercase">{projet.soutenance.date}</p>
              <p className="text-lg font-bold text-blue-700">{projet.soutenance.heure}</p>
              <p className="text-xs text-blue-500">📍 {projet.soutenance.salle}</p>
            </div>
            <Link to="/etudiant/soutenance" className="text-sm text-blue-600 hover:underline">Voir les détails →</Link>
          </div>
        </Card>
      )}

      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Déposer un livrable">
        {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
        <form onSubmit={upload} className="space-y-4">
          <Field label="Type de livrable" required>
            <Select value={upForm.type} onChange={(e) => setUpForm({ ...upForm, type: e.target.value })}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Fichier" required>
            <input ref={fileRef} type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.txt"
              className="w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100" />
            <p className="text-xs text-slate-400 mt-1">PDF, Word, PowerPoint, Excel, ZIP, images — max 20 Mo</p>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setUploadModal(false)}>Annuler</Button>
            <Button type="submit" disabled={uploading}>{uploading ? 'Envoi…' : 'Déposer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
