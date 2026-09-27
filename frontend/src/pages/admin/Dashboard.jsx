import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api.js';
import { Card, StatCard, ProgressBar, Spinner, EmptyState, Badge } from '../../components/UI.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [soutenances, setSoutenances] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/soutenances').then((r) => setSoutenances(r.data.slice(0, 5))).catch(() => {});
  }, []);

  if (!stats) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Tableau de bord administrateur</h2>
        <p className="text-sm text-slate-500">
          Vue synthétique — {stats.annee_active ? `Année active : ${stats.annee_active.libelle}` : 'Aucune année active'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📁" label="Projets" value={stats.projets.total} color="blue" sub={`${stats.projets.en_cours} en cours`} />
        <StatCard icon="🎓" label="Étudiants" value={stats.utilisateurs.etudiants} color="violet" />
        <StatCard icon="👨‍🏫" label="Encadrants" value={stats.utilisateurs.encadrants} color="green" />
        <StatCard icon="📊" label="Progression moyenne" value={`${stats.projets.progression_moyenne}%`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Sujets" className="lg:col-span-1">
          <div className="space-y-3 text-sm">
            <Row label="Total" value={stats.sujets.total} />
            <Row label="Validés" value={stats.sujets.valides} color="text-emerald-600" />
            <Link to="/admin/sujets" className="flex items-center justify-between hover:bg-amber-50 rounded px-2 py-1 -mx-2">
              <span className="text-amber-600 font-medium">En attente de validation</span>
              <Badge color="amber">{stats.sujets.en_attente_validation}</Badge>
            </Link>
          </div>
        </Card>

        <Card title="Candidatures" className="lg:col-span-1">
          <div className="space-y-3 text-sm">
            <Row label="Total" value={stats.candidatures.total} />
            <Row label="Acceptées" value={stats.candidatures.acceptees} color="text-emerald-600" />
            <Row label="En attente" value={stats.candidatures.en_attente} color="text-amber-600" />
          </div>
        </Card>

        <Card title="Projets" className="lg:col-span-1">
          <div className="space-y-3 text-sm">
            <Row label="En cours" value={stats.projets.en_cours} color="text-blue-600" />
            <Row label="Terminés" value={stats.projets.termines} color="text-emerald-600" />
            <Link to="/admin/projets" className="flex items-center justify-between hover:bg-slate-50 rounded px-2 py-1 -mx-2">
              <span className="text-slate-500">Archivés</span>
              <span className="font-semibold">{stats.projets.archives}</span>
            </Link>
          </div>
        </Card>
      </div>

      <Card title="Charge par encadrant">
        {stats.par_encadrant.length === 0 ? (
          <EmptyState icon="👨‍🏫" title="Aucun encadrant" />
        ) : (
          <div className="space-y-3">
            {stats.par_encadrant.map((e, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{e.prenom} {e.nom}</span>
                  <span className="text-slate-500">{e.nb_projets} projet(s)</span>
                </div>
                <ProgressBar value={stats.projets.total ? (e.nb_projets / Math.max(1, stats.par_encadrant[0].nb_projets)) * 100 : 0} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Prochaines soutenances" actions={<Link to="/admin/soutenances" className="text-sm text-blue-600 hover:underline">Tout voir</Link>}>
        {soutenances.length === 0 ? (
          <EmptyState icon="🎤" title="Aucune soutenance planifiée" />
        ) : (
          <div className="divide-y divide-slate-100">
            {soutenances.map((s) => (
              <div key={s.id} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <Badge color="blue">{s.date} · {s.heure}</Badge>
                <span className="font-medium text-slate-700">{s.sujet_titre}</span>
                <span className="text-slate-500">{s.etudiant_prenom} {s.etudiant_nom}</span>
                <span className="ml-auto text-slate-400">📍 {s.salle}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value, color = 'text-slate-800' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
