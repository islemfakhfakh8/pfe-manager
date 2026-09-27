import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api.js';
import { Card, Badge, EmptyState, Spinner, ProgressBar, Button, statutProjetBadge } from '../../components/UI.jsx';

export default function EncProjets() {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projets').then((r) => setProjets(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Mes encadrements</h2>
        <p className="text-sm text-slate-500">Suivre l'avancement des projets de vos étudiants</p>
      </div>

      {projets.length === 0 ? (
        <Card><EmptyState icon="📁" title="Aucun projet encadré" hint="Acceptez des candidatures pour démarrer un projet." /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projets.map((p) => {
            const [color, label] = statutProjetBadge(p.statut);
            return (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800">{p.sujet_titre}</h3>
                  <Badge color={color}>{label}</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">🎓 {p.etudiant_prenom} {p.etudiant_nom}</p>
                <p className="text-xs text-slate-400">Début : {p.date_debut} · {p.annee_libelle || '—'}</p>
                <div className="flex items-center gap-3 mt-3">
                  <ProgressBar value={p.progression} className="flex-1" />
                  <span className="text-sm font-medium text-slate-600 w-12 text-right">{p.progression}%</span>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span>{p.jalons_faits}/{p.jalons_total} jalons · {p.nb_livrables} livrable(s)</span>
                  <Link to={`/encadrant/projets/${p.id}`}><Button variant="secondary">Suivre →</Button></Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
