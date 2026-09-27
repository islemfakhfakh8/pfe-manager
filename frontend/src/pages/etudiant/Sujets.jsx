import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Card, Button, Badge, Input, Select, Field, Textarea, EmptyState, Spinner, Modal, Alert } from '../../components/UI.jsx';

export default function EtuSujets() {
  const [sujets, setSujets] = useState([]);
  const [encadrants, setEncadrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', domaine: '', encadrant_id: '' });
  const [detail, setDetail] = useState(null);
  const [postuler, setPostuler] = useState(null);
  const [candForm, setCandForm] = useState({ ordre_pref: 1, message: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sujets', {
        params: {
          q: filters.q || undefined,
          domaine: filters.domaine || undefined,
          encadrant_id: filters.encadrant_id || undefined,
        },
      });
      setSujets(data);
    } catch {}
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    api.get('/users/encadrants').then((r) => setEncadrants(r.data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const openDetail = async (s) => {
    try { const { data } = await api.get(`/sujets/${s.id}`); setDetail(data); }
    catch (e) { alert(errMsg(e)); }
  };

  const openPostuler = (s) => {
    setCandForm({ ordre_pref: 1, message: '' });
    setError('');
    setPostuler(s);
  };

  const submitCand = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/candidatures', { sujet_id: postuler.id, ordre_pref: +candForm.ordre_pref, message: candForm.message });
      setPostuler(null); setDetail(null); load();
      alert('Candidature envoyée ! Suivez son statut dans « Mes candidatures ».');
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Sujets disponibles</h2>
        <p className="text-sm text-slate-500">Parcourez les sujets validés et postulez par ordre de préférence</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="🔎 Titre, description, mot-clé…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          <Input placeholder="Domaine (ex : IA, Web)" value={filters.domaine} onChange={(e) => setFilters({ ...filters, domaine: e.target.value })} />
          <Select value={filters.encadrant_id} onChange={(e) => setFilters({ ...filters, encadrant_id: e.target.value })}>
            <option value="">Tous les encadrants</option>
            {encadrants.map((e) => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
          </Select>
        </div>
      </Card>

      {loading ? <Spinner /> : sujets.length === 0 ? (
        <Card><EmptyState icon="🔎" title="Aucun sujet trouvé" hint="Essayez de modifier vos filtres." /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sujets.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-800">{s.titre}</h3>
                {s.statut === 'complet' ? <Badge color="blue">Complet</Badge> : <Badge color="green">Disponible</Badge>}
              </div>
              <p className="text-sm text-slate-500 mt-1">👨‍🏫 {s.encadrant_prenom} {s.encadrant_nom}</p>
              <p className="text-sm text-slate-600 mt-2 line-clamp-3">{s.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {s.mots_cles?.split(',').filter(Boolean).map((k, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{k.trim()}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">{s.places_prises}/{s.nb_places} place(s) prise(s)</span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => openDetail(s)}>Détails</Button>
                  <Button onClick={() => openPostuler(s)} disabled={s.statut === 'complet' || s.places_prises >= s.nb_places}>
                    Postuler
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.titre} wide>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-4">
              <div><span className="text-slate-400">Encadrant : </span><span className="font-medium">{detail.encadrant_prenom} {detail.encadrant_nom}</span></div>
              <div><span className="text-slate-400">Places : </span><span className="font-medium">{detail.nb_places - detail.places_prises} restante(s)</span></div>
            </div>
            <div><span className="text-slate-400">Compétences : </span>{detail.competences || '—'}</div>
            <div>
              <p className="text-slate-400 mb-1">Description :</p>
              <p className="text-slate-700 whitespace-pre-wrap">{detail.description}</p>
            </div>
            {detail.ma_candidature && (
              <Alert type="info">Vous avez déjà postulé à ce sujet (statut : {detail.ma_candidature.statut}).</Alert>
            )}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              {!detail.ma_candidature && (
                <Button onClick={() => { const s = detail; setDetail(null); openPostuler(s); }}
                  disabled={detail.statut === 'complet'}>Postuler à ce sujet</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!postuler} onClose={() => setPostuler(null)} title="Postuler au sujet">
        {postuler && (
          <form onSubmit={submitCand} className="space-y-4">
            <p className="text-sm text-slate-600">« {postuler.titre} » — {postuler.encadrant_prenom} {postuler.encadrant_nom}</p>
            {error && <Alert onClose={() => setError('')}>{error}</Alert>}
            <Field label="Ordre de préférence" required>
              <Select value={candForm.ordre_pref} onChange={(e) => setCandForm({ ...candForm, ordre_pref: e.target.value })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Choix n°{n}</option>)}
              </Select>
            </Field>
            <Field label="Message de motivation (optionnel)">
              <Textarea rows={3} value={candForm.message} onChange={(e) => setCandForm({ ...candForm, message: e.target.value })}
                placeholder="Expliquez brièvement votre motivation…" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPostuler(null)}>Annuler</Button>
              <Button type="submit">Envoyer ma candidature</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
