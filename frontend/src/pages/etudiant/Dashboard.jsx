import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api.js';
import { Card, StatCard, ProgressBar, Spinner, EmptyState, Badge, Button, statutCandBadge } from '../../components/UI.jsx';

export default function EtuDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [sujets, cands, projet, sout] = await Promise.all([
          api.get('/sujets'),
          api.get('/candidatures'),
          api.get('/projets/mon-projet'),
          api.get('/soutenances/ma-soutenance'),
        ]);
        setData({ sujets: sujets.data, cands: cands.data, projet: projet.data, sout: sout.data });
      } catch { setData({ sujets: [], cands: [], projet: null, sout: null }); }
    })();
  }, []);

  if (!data) return <Spinner />;

  const enAttente = data.cands.filter((c) => c.statut === 'en_attente').length;
  const hasProjet = !!data.projet;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Bonjour 👋</h2>
        <p className="text-sm text-slate-500">Voici l'état de votre parcours PFE</p>
      </div>

      {hasProjet ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="🚀" label="Mon projet" value="Actif" color="green" sub={data.projet.sujet_titre?.slice(0, 24)} />
            <StatCard icon="📊" label="Progression" value={`${data.projet.progression}%`} color="blue" />
            <StatCard icon="📎" label="Livrables" value={data.projet.nb_livrables} color="violet" />
            <StatCard icon="🎯" label="Jalons faits" value={`${data.projet.jalons_faits}/${data.projet.jalons_total}`} color="amber" />
          </div>

          <Card title="Mon avancement" actions={<Link to="/etudiant/projet" className="text-sm text-blue-600 hover:underline">Voir le projet</Link>}>
            <div className="flex items-center gap-3 mb-2">
              <ProgressBar value={data.projet.progression} className="flex-1" />
              <span className="font-semibold text-slate-700 w-12 text-right">{data.projet.progression}%</span>
            </div>
            <p className="text-sm text-slate-500">
              👨‍🏫 Encadrant : {data.projet.encadrant_prenom} {data.projet.encadrant_nom}
            </p>
            <div className="mt-3">
              <Link to="/etudiant/projet"><Button variant="secondary">Déposer un livrable</Button></Link>
            </div>
          </Card>

          {data.sout && (
            <Card title="Ma soutenance">
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-center">
                  <p className="text-xs text-blue-500 uppercase">{data.sout.date}</p>
                  <p className="text-lg font-bold text-blue-700">{data.sout.heure}</p>
                  <p className="text-xs text-blue-500">📍 {data.sout.salle}</p>
                </div>
                <Link to="/etudiant/soutenance" className="text-sm text-blue-600 hover:underline">Voir les détails →</Link>
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="🔎" label="Sujets disponibles" value={data.sujets.length} color="blue" />
            <StatCard icon="📨" label="Mes candidatures" value={data.cands.length} color="violet" />
            <StatCard icon="⏳" label="En attente" value={enAttente} color="amber" />
            <StatCard icon="✅" label="Acceptées" value={data.cands.filter((c) => c.statut === 'acceptee').length} color="green" />
          </div>

          <Card title="Trouver un sujet" >
            <EmptyState icon="🎓" title="Vous n'avez pas encore de projet"
              hint="Parcourez les sujets disponibles et postulez à ceux qui vous intéressent, par ordre de préférence." />
            <div className="flex justify-center"><Link to="/etudiant/sujets"><Button>🔎 Parcourir les sujets</Button></Link></div>
          </Card>

          {data.cands.length > 0 && (
            <Card title="Mes candidatures récentes" actions={<Link to="/etudiant/candidatures" className="text-sm text-blue-600 hover:underline">Tout voir</Link>}>
              <div className="divide-y divide-slate-100">
                {data.cands.slice(0, 5).map((c) => {
                  const [color, label] = statutCandBadge(c.statut);
                  return (
                    <div key={c.id} className="py-2.5 flex items-center gap-3 text-sm">
                      <span className="text-slate-700 flex-1 truncate">{c.sujet_titre}</span>
                      <span className="text-xs text-slate-400">préf. n°{c.ordre_pref}</span>
                      <Badge color={color}>{label}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
