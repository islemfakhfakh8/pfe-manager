import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../api.js';
import { Card, Button, Badge, EmptyState, Spinner, statutCandBadge } from '../../components/UI.jsx';

export default function EtuCandidatures() {
  const [cands, setCands] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCands((await api.get('/candidatures')).data); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const annuler = async (c) => {
    if (!confirm('Annuler cette candidature ?')) return;
    try { await api.patch(`/candidatures/${c.id}/annuler`); load(); }
    catch (e) { alert(errMsg(e)); }
  };

  const sorted = [...cands].sort((a, b) => a.ordre_pref - b.ordre_pref);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mes candidatures</h2>
          <p className="text-sm text-slate-500">Suivez le statut de vos candidatures, classées par ordre de préférence</p>
        </div>
        <Link to="/etudiant/sujets"><Button variant="secondary">+ Postuler à un sujet</Button></Link>
      </div>

      {loading ? <Spinner /> : cands.length === 0 ? (
        <Card><EmptyState icon="📨" title="Aucune candidature" hint="Parcourez les sujets et postulez à ceux qui vous intéressent." /></Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => {
            const [color, label] = statutCandBadge(c.statut);
            return (
              <Card key={c.id}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    {c.ordre_pref}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">{c.sujet_titre}</h3>
                    <p className="text-sm text-slate-500">👨‍🏫 {c.encadrant_prenom} {c.encadrant_nom}</p>
                    {c.message && <p className="text-xs text-slate-400 mt-1 italic">« {c.message} »</p>}
                    <p className="text-xs text-slate-400 mt-0.5">Postulé le {c.created_at}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge color={color}>{label}</Badge>
                    {c.statut === 'en_attente' && (
                      <button onClick={() => annuler(c)} className="text-xs text-red-600 hover:underline">Annuler</button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
