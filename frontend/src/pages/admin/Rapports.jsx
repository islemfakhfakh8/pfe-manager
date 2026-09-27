import { useState, useEffect } from 'react';
import api, { errMsg } from '../../api.js';
import { Card, Button, StatCard, Alert, ProgressBar } from '../../components/UI.jsx';

async function downloadExcel(url, filename) {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AdminRapports() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const doExport = async (kind) => {
    setBusy(kind); setError('');
    try {
      await downloadExcel(`/admin/export/${kind}.xlsx`, `${kind}-pfe.xlsx`);
    } catch (e) { setError(errMsg(e)); }
    setBusy('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Rapports & exports</h2>
        <p className="text-sm text-slate-500">Statistiques globales et exports Excel</p>
      </div>

      {error && <Alert onClose={() => setError('')}>{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Export des projets">
          <p className="text-sm text-slate-500 mb-4">
            Génère un fichier Excel contenant tous les projets : sujet, étudiant, encadrant, statut, progression et soutenance.
          </p>
          <Button onClick={() => doExport('projets')} disabled={busy === 'projets'}>
            {busy === 'projets' ? 'Génération…' : '⬇️ Télécharger projets.xlsx'}
          </Button>
        </Card>
        <Card title="Export des utilisateurs">
          <p className="text-sm text-slate-500 mb-4">
            Génère un fichier Excel de tous les comptes (étudiants, encadrants, administrateurs).
          </p>
          <Button onClick={() => doExport('utilisateurs')} disabled={busy === 'utilisateurs'}>
            {busy === 'utilisateurs' ? 'Génération…' : '⬇️ Télécharger utilisateurs.xlsx'}
          </Button>
        </Card>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Utilisateurs" value={stats.utilisateurs.total} color="blue" />
            <StatCard icon="📝" label="Sujets" value={stats.sujets.total} color="violet" />
            <StatCard icon="📨" label="Candidatures" value={stats.candidatures.total} color="amber" />
            <StatCard icon="🎤" label="Soutenances" value={stats.soutenances.total} color="green" />
          </div>

          <Card title="Répartition des projets par statut">
            <div className="space-y-3 text-sm">
              <Bar label="En cours" value={stats.projets.en_cours} total={stats.projets.total} color="bg-blue-500" />
              <Bar label="Terminés" value={stats.projets.termines} total={stats.projets.total} color="bg-emerald-500" />
              <Bar label="Archivés" value={stats.projets.archives} total={stats.projets.total} color="bg-slate-400" />
            </div>
          </Card>

          <Card title="Charge par encadrant">
            <div className="space-y-3">
              {stats.par_encadrant.map((e, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{e.prenom} {e.nom}</span>
                    <span className="text-slate-500">{e.nb_projets}</span>
                  </div>
                  <ProgressBar value={stats.par_encadrant[0].nb_projets ? (e.nb_projets / stats.par_encadrant[0].nb_projets) * 100 : 0} />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Bar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-500">{value} ({pct}%)</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
