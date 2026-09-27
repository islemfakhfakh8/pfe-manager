import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Card, Button, Badge, EmptyState, Spinner, Modal, statutCandBadge, Alert } from '../../components/UI.jsx';

export default function EncCandidatures() {
  const [cands, setCands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('en_attente');
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/candidatures', { params: filter ? { statut: filter } : {} });
      setCands(data);
    } catch {}
    setLoading(false);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const decide = async (c, decision) => {
    setError('');
    try {
      await api.patch(`/candidatures/${c.id}/decision`, { decision });
      setDetail(null); load();
    } catch (e) { setError(errMsg(e)); }
  };

  const grouped = cands.reduce((acc, c) => {
    (acc[c.sujet_titre] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Candidatures</h2>
          <p className="text-sm text-slate-500">Candidatures des étudiants sur vos sujets</p>
        </div>
        <div className="flex gap-2">
          {['en_attente', 'acceptee', 'refusee', ''].map((f) => (
            <Button key={f} variant={filter === f ? 'primary' : 'secondary'} onClick={() => setFilter(f)}>
              {f === '' ? 'Toutes' : f === 'en_attente' ? 'En attente' : f === 'acceptee' ? 'Acceptées' : 'Refusées'}
            </Button>
          ))}
        </div>
      </div>

      {error && <Alert onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Spinner /> : cands.length === 0 ? (
        <Card><EmptyState icon="📨" title="Aucune candidature" hint="Les candidatures des étudiants apparaîtront ici." /></Card>
      ) : (
        Object.entries(grouped).map(([sujet, list]) => (
          <Card key={sujet} title={sujet}>
            <div className="divide-y divide-slate-100">
              {list.map((c) => {
                const [color, label] = statutCandBadge(c.statut);
                return (
                  <div key={c.id} className="py-3 flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">{c.etudiant_prenom} {c.etudiant_nom}</p>
                      <p className="text-xs text-slate-400">{c.etudiant_email} · préférence n°{c.ordre_pref}</p>
                      {c.message && <p className="text-sm text-slate-500 mt-1 italic">« {c.message} »</p>}
                    </div>
                    <Badge color={color}>{label}</Badge>
                    {c.statut === 'en_attente' && (
                      <div className="flex gap-2">
                        <Button variant="success" onClick={() => decide(c, 'acceptee')}>Accepter</Button>
                        <Button variant="danger" onClick={() => setDetail(c)}>Refuser</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Refuser la candidature">
        {detail && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Refuser la candidature de <strong>{detail.etudiant_prenom} {detail.etudiant_nom}</strong> pour le sujet
              « {detail.sujet_titre} » ?
            </p>
            {error && <Alert onClose={() => setError('')}>{error}</Alert>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDetail(null)}>Annuler</Button>
              <Button variant="danger" onClick={() => decide(detail, 'refusee')}>Confirmer le refus</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
