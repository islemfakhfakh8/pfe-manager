import { useState, useEffect } from 'react';
import api from '../../api.js';
import { Card, Badge, EmptyState, Spinner } from '../../components/UI.jsx';

export default function EtuSoutenance() {
  const [sout, setSout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/soutenances/ma-soutenance').then((r) => setSout(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (!sout) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Ma soutenance</h2>
        <Card>
          <EmptyState icon="🎤" title="Aucune soutenance planifiée"
            hint="Votre soutenance apparaîtra ici dès que l'administration l'aura planifiée." />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Ma soutenance</h2>
        <p className="text-sm text-slate-500">Date, heure, lieu et jury de votre soutenance</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl px-6 py-5 text-center min-w-[160px]">
            <p className="text-sm text-blue-100 uppercase tracking-wide">{sout.date}</p>
            <p className="text-3xl font-bold my-1">{sout.heure}</p>
            <p className="text-sm text-blue-100">📍 {sout.salle}</p>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 text-lg">{sout.sujet_titre}</h3>
            <p className="text-sm text-slate-500 mt-1">Encadrant : {sout.encadrant_prenom} {sout.encadrant_nom}</p>
            <div className="mt-4">
              <span className="text-sm text-slate-400">Membres du jury :</span>
              <p className="text-sm text-slate-700 mt-1">{sout.membres_jury || 'Non communiqué'}</p>
            </div>
            <div className="mt-4"><Badge color="blue">Soutenance planifiée</Badge></div>
          </div>
        </div>
      </Card>
    </div>
  );
}
