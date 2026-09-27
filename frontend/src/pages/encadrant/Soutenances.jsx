import { useState, useEffect } from 'react';
import api from '../../api.js';
import { Card, Badge, EmptyState, Spinner } from '../../components/UI.jsx';

export default function EncSoutenances() {
  const [sout, setSout] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/soutenances').then((r) => setSout(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Soutenances de mes étudiants</h2>
        <p className="text-sm text-slate-500">Planning des soutenances planifiées par l'administration</p>
      </div>

      {sout.length === 0 ? (
        <Card><EmptyState icon="🎤" title="Aucune soutenance planifiée" hint="L'administration planifiera bientôt les soutenances." /></Card>
      ) : (
        <div className="space-y-3">
          {sout.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-start gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-center min-w-[110px]">
                  <p className="text-xs text-blue-500 uppercase">{s.date}</p>
                  <p className="text-lg font-bold text-blue-700">{s.heure}</p>
                  <p className="text-xs text-blue-500">📍 {s.salle}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800">{s.sujet_titre}</h3>
                  <p className="text-sm text-slate-500">🎓 {s.etudiant_prenom} {s.etudiant_nom}</p>
                  {s.membres_jury && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-400">Jury : </span>
                      <span className="text-sm text-slate-600">{s.membres_jury}</span>
                    </div>
                  )}
                </div>
                <Badge color="blue">Planifiée</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
