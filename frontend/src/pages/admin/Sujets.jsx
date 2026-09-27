import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Card, Button, Badge, Select, Input, EmptyState, Spinner, Modal, statutSujetBadge } from '../../components/UI.jsx';

export default function AdminSujets() {
  const [sujets, setSujets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState('');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sujets', { params: { statut: statut || undefined, q: q || undefined } });
      setSujets(data);
    } catch {}
    setLoading(false);
  }, [statut, q]);
  useEffect(() => { load(); }, [load]);

  const setStatutSujet = async (s, newStatut) => {
    try { await api.patch(`/sujets/${s.id}/statut`, { statut: newStatut }); load(); setDetail(null); }
    catch (e) { alert(errMsg(e)); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Validation des sujets</h2>
        <p className="text-sm text-slate-500">Valider ou rejeter les sujets proposés par les encadrants</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="Rechercher un sujet…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={statut} onChange={(e) => setStatut(e.target.value)} className="max-w-[220px]">
            <option value="">Tous les statuts</option>
            <option value="propose">Proposés (à valider)</option>
            <option value="valide">Validés</option>
            <option value="rejete">Rejetés</option>
            <option value="complet">Complets</option>
            <option value="archive">Archivés</option>
          </Select>
        </div>

        {loading ? <Spinner /> : sujets.length === 0 ? (
          <EmptyState icon="📝" title="Aucun sujet" />
        ) : (
          <div className="space-y-3">
            {sujets.map((s) => {
              const [color, label] = statutSujetBadge(s.statut);
              return (
                <div key={s.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800">{s.titre}</h3>
                      <p className="text-sm text-slate-500">
                        {s.encadrant_prenom} {s.encadrant_nom} · {s.annee_libelle || 'hors année'} · {s.nb_places} place(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={color}>{label}</Badge>
                      <Button variant="secondary" onClick={() => setDetail(s)}>Détails</Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{s.description}</p>
                  {s.statut === 'propose' && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="success" onClick={() => setStatutSujet(s, 'valide')}>✓ Valider</Button>
                      <Button variant="danger" onClick={() => setStatutSujet(s, 'rejete')}>✕ Rejeter</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.titre} wide>
        {detail && (
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-slate-400">Encadrant : </span>
              <span className="font-medium">{detail.encadrant_prenom} {detail.encadrant_nom}</span>
            </div>
            <div>
              <span className="text-slate-400">Compétences : </span>{detail.competences || '—'}
            </div>
            <div>
              <span className="text-slate-400">Mots-clés : </span>{detail.mots_cles || '—'}
            </div>
            <div>
              <p className="text-slate-400 mb-1">Description :</p>
              <p className="text-slate-700 whitespace-pre-wrap">{detail.description}</p>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              {detail.statut !== 'valide' && detail.statut !== 'complet' && (
                <Button variant="success" onClick={() => setStatutSujet(detail, 'valide')}>✓ Valider</Button>
              )}
              {detail.statut !== 'rejete' && (
                <Button variant="danger" onClick={() => setStatutSujet(detail, 'rejete')}>✕ Rejeter</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
