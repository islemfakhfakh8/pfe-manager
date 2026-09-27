import { Router } from 'express';
import ExcelJS from 'exceljs';
import db from '../src/db.js';
import { authRequired, requireRole } from '../src/auth.js';

const router = Router();
router.use(authRequired, requireRole('admin'));

// Statistiques globales
router.get('/stats', (req, res) => {
  const q = (sql, ...p) => db.prepare(sql).get(...p);
  const nb = (sql, ...p) => q(sql, ...p).c;
  const actifs = q("SELECT id FROM annees WHERE active=1");
  const anneeId = actifs?.id;

  const stats = {
    utilisateurs: {
      total: nb('SELECT COUNT(*) c FROM users'),
      etudiants: nb("SELECT COUNT(*) c FROM users WHERE role='etudiant'"),
      encadrants: nb("SELECT COUNT(*) c FROM users WHERE role='encadrant'"),
      admins: nb("SELECT COUNT(*) c FROM users WHERE role='admin'"),
    },
    sujets: {
      total: nb('SELECT COUNT(*) c FROM sujets'),
      proposes: nb("SELECT COUNT(*) c FROM sujets WHERE statut='propose'"),
      valides: nb("SELECT COUNT(*) c FROM sujets WHERE statut IN ('valide','complet')"),
      en_attente_validation: nb("SELECT COUNT(*) c FROM sujets WHERE statut='propose'"),
    },
    candidatures: {
      total: nb('SELECT COUNT(*) c FROM candidatures'),
      en_attente: nb("SELECT COUNT(*) c FROM candidatures WHERE statut='en_attente'"),
      acceptees: nb("SELECT COUNT(*) c FROM candidatures WHERE statut='acceptee'"),
    },
    projets: {
      total: nb('SELECT COUNT(*) c FROM projets'),
      en_cours: nb("SELECT COUNT(*) c FROM projets WHERE statut='en_cours'"),
      termines: nb("SELECT COUNT(*) c FROM projets WHERE statut='termine'"),
      archives: nb("SELECT COUNT(*) c FROM projets WHERE statut='archive'"),
      progression_moyenne: Math.round(q('SELECT AVG(progression) m FROM projets').m || 0),
    },
    soutenances: {
      total: nb('SELECT COUNT(*) c FROM soutenances'),
      planifiees: nb('SELECT COUNT(*) c FROM soutenances'),
    },
    annee_active: actifs ? db.prepare('SELECT * FROM annees WHERE id=?').get(anneeId) : null,
  };

  // Répartition projets par encadrant
  stats.par_encadrant = db.prepare(`
    SELECT u.nom, u.prenom, COUNT(p.id) AS nb_projets
    FROM users u LEFT JOIN projets p ON p.encadrant_id=u.id
    WHERE u.role='encadrant'
    GROUP BY u.id ORDER BY nb_projets DESC
  `).all();

  res.json(stats);
});

async function buildProjetsWorkbook() {
  const rows = db.prepare(`
    SELECT p.id, s.titre, ue.nom||' '||ue.prenom AS etudiant, ue.email AS etudiant_email,
      us.nom||' '||us.prenom AS encadrant, a.libelle AS annee, p.statut, p.progression, p.date_debut,
      so.date AS sout_date, so.heure AS sout_heure, so.salle AS sout_salle
    FROM projets p
    JOIN sujets s ON s.id=p.sujet_id
    JOIN users ue ON ue.id=p.etudiant_id
    JOIN users us ON us.id=p.encadrant_id
    LEFT JOIN annees a ON a.id=p.annee_id
    LEFT JOIN soutenances so ON so.projet_id=p.id
    ORDER BY p.id
  `).all();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'PFE Manager';
  const ws = wb.addWorksheet('Projets');
  ws.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Sujet', key: 'titre', width: 40 },
    { header: 'Étudiant', key: 'etudiant', width: 24 },
    { header: 'Email étudiant', key: 'etudiant_email', width: 28 },
    { header: 'Encadrant', key: 'encadrant', width: 24 },
    { header: 'Année', key: 'annee', width: 14 },
    { header: 'Statut', key: 'statut', width: 14 },
    { header: 'Progression (%)', key: 'progression', width: 16 },
    { header: 'Date début', key: 'date_debut', width: 14 },
    { header: 'Soutenance', key: 'sout', width: 22 },
    { header: 'Salle', key: 'sout_salle', width: 14 },
  ];
  rows.forEach((r) => ws.addRow({ ...r, sout: r.sout_date ? `${r.sout_date} ${r.sout_heure || ''}` : '' }));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  return wb;
}

router.get('/export/projets.xlsx', async (req, res) => {
  const wb = await buildProjetsWorkbook();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="projets-pfe.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

router.get('/export/utilisateurs.xlsx', async (req, res) => {
  const rows = db.prepare('SELECT id, nom, prenom, email, role, actif, created_at FROM users ORDER BY role, nom').all();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Utilisateurs');
  ws.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Nom', key: 'nom', width: 20 },
    { header: 'Prénom', key: 'prenom', width: 20 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Rôle', key: 'role', width: 14 },
    { header: 'Actif', key: 'actif', width: 8 },
    { header: 'Créé le', key: 'created_at', width: 20 },
  ];
  rows.forEach((r) => ws.addRow({ ...r, actif: r.actif ? 'Oui' : 'Non' }));
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="utilisateurs-pfe.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

export default router;
