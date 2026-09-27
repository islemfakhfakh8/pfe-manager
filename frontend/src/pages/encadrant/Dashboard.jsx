import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api.js';
import { Card, StatCard, ProgressBar, Spinner, EmptyState, Badge, Button, statutProjetBadge } from '../../components/UI.jsx';

export default function EncDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [sujets, cands, projets, sout] = await Promise.all([
          api.get('/sujets', { params: { mes_sujets: 1 } }),
          api.get('/candidatures', { params: { statut: 'en_attente' } }),
          api.get('/projets'),
          api.get('/soutenances'),
        ]);
        setData({ sujets: sujets.data, cands: cands.data, projets: projets.data, sout: sout.data });
      } catch { setData({ sujets: [], cands: [], projets: [], sout: [] }); }
    })();
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Tableau de bord encadrant</h2>
        <p className="text-sm text-slate-500">Vos sujets, candidatures et projets en cours</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📝" label="Mes sujets" value={data.sujets.length} color="violet" />
        <StatCard icon="📨" label="Candidatures en attente" value={data.cands.length} color="amber" />
        <StatCard icon="📁" label="Projets encadrés" value={data.projets.length} color="blue" />
        <StatCard icon="🎤" label="Soutenances" value={data.sout.length} color="green" />
      </div>

      {data.cands.length > 0 && (
        <Card title="Candidatures à traiter" actions={<Link to="/encadrant/candidatures" className="text-sm text-blue-600 hover:underline">Tout voir</Link>}>
          <div className="divide-y divide-slate-100">
            {data.cands.slice(0, 5).map((c) => (
              <div key={c.id} className="py-2.5 flex items-center gap-3 text-sm">
                <span className="font-medium text-slate-700">{c.etudiant_prenom} {c.etudiant_nom}</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-600 truncate">{c.sujet_titre}</span>
                <Badge color="amber">préf. n°{c.ordre_pref}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Mes encadrements" actions={<Link to="/encadrant/projets" className="text-sm text-blue-600 hover:underline">Tout voir</Link>}>
        {data.projets.length === 0 ? <EmptyState icon="📁" title="Aucun projet" hint="Vos projets apparaîtront après acceptation des candidatures." /> : (
          <div className="space-y-3">
            {data.projets.slice(0, 5).map((p) => {
              const [color, label] = statutProjetBadge(p.statut);
              return (
                <Link key={p.id} to={`/encadrant/projets/${p.id}`} className="block border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-medium text-slate-800 text-sm truncate">{p.sujet_titre}</span>
                    <Badge color={color}>{label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">🎓 {p.etudiant_prenom} {p.etudiant_nom}</p>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={p.progression} className="flex-1" />
                    <span className="text-xs text-slate-500 w-10 text-right">{p.progression}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Link to="/encadrant/sujets"><Button variant="secondary">+ Proposer un sujet</Button></Link>
      </div>
    </div>
  );
}
