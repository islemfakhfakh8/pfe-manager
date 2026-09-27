import { Router } from 'express';
import db from '../src/db.js';
import { authRequired, requireRole } from '../src/auth.js';
import { notify, notifyMany } from '../src/helpers.js';

const router = Router();
router.use(authRequired);

const SELECT = `
  SELECT s.*, u.nom AS encadrant_nom, u.prenom AS encadrant_prenom, a.libelle AS annee_libelle,
    (SELECT COUNT(*) FROM candidatures c WHERE c.sujet_id = s.id AND c.statut='acceptee') AS places_prises
  FROM sujets s
  JOIN users u ON u.id = s.encadrant_id
  LEFT JOIN annees a ON a.id = s.annee_id`;

// Liste : les étudiants ne voient que les sujets validés de l'année active
router.get('/', (req, res) => {
  const { domaine, encadrant_id, q, statut, annee_id, mes_sujets } = req.query;
  let sql = `${SELECT} WHERE 1=1`;
  const params = [];

  if (req.user.role === 'etudiant') {
    sql += " AND s.statut IN ('valide','complet')";
    const active = db.prepare('SELECT id FROM annees WHERE active=1').get();
    if (active && !annee_id) { sql += ' AND s.annee_id = ?'; params.push(active.id); }
  }
  if (mes_sujets === '1' && req.user.role === 'encadrant') {
    sql += ' AND s.encadrant_id = ?'; params.push(req.user.id);
  }
  if (encadrant_id) { sql += ' AND s.encadrant_id = ?'; params.push(encadrant_id); }
  if (annee_id) { sql += ' AND s.annee_id = ?'; params.push(annee_id); }
  if (statut && req.user.role !== 'etudiant') { sql += ' AND s.statut = ?'; params.push(statut); }
  if (domaine) { sql += ' AND s.mots_cles LIKE ?'; params.push(`%${domaine}%`); }
  if (q) {
    sql += ' AND (s.titre LIKE ? OR s.description LIKE ? OR s.mots_cles LIKE ? OR s.competences LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  sql += ' ORDER BY s.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const sujet = db.prepare(`${SELECT} WHERE s.id = ?`).get(req.params.id);
  if (!sujet) return res.status(404).json({ error: 'Sujet introuvable' });
  if (req.user.role === 'etudiant' && !['valide', 'complet'].includes(sujet.statut)) {
    return res.status(403).json({ error: 'Sujet non disponible' });
  }
  const candidatures = db
    .prepare(`SELECT c.*, u.nom, u.prenom, u.email FROM candidatures c JOIN users u ON u.id=c.etudiant_id WHERE c.sujet_id=? ORDER BY c.ordre_pref, c.created_at`)
    .all(sujet.id);
  const visible = req.user.role === 'admin' || sujet.encadrant_id === req.user.id;
  res.json({
    ...sujet,
    candidatures: visible ? candidatures : undefined,
    ma_candidature: req.user.role === 'etudiant'
      ? candidatures.find((c) => c.etudiant_id === req.user.id) || null
      : undefined,
  });
});

router.post('/', requireRole('encadrant'), (req, res) => {
  const { titre, description, competences, mots_cles, nb_places, annee_id } = req.body || {};
  if (!titre || !description) {
    return res.status(400).json({ error: 'Titre et description requis' });
  }
  const places = Math.max(1, parseInt(nb_places) || 1);
  const annee = annee_id
    ? db.prepare('SELECT id FROM annees WHERE id=?').get(annee_id)
    : db.prepare('SELECT id FROM annees WHERE active=1').get();
  const info = db
    .prepare(`INSERT INTO sujets (titre, description, competences, mots_cles, encadrant_id, annee_id, nb_places)
              VALUES (?,?,?,?,?,?,?)`)
    .run(titre.trim(), description.trim(), competences || '', mots_cles || '', req.user.id, annee?.id || null, places);

  const admins = db.prepare("SELECT id FROM users WHERE role='admin' AND actif=1").all().map((a) => a.id);
  notifyMany(admins, 'sujet_propose', 'Nouveau sujet proposé',
    `${req.user.prenom} ${req.user.nom} a proposé le sujet « ${titre} » pour validation.`, '/admin/sujets');
  res.status(201).json(db.prepare(`${SELECT} WHERE s.id=?`).get(info.lastInsertRowid));
});

router.put('/:id', requireRole('encadrant', 'admin'), (req, res) => {
  const sujet = db.prepare('SELECT * FROM sujets WHERE id=?').get(req.params.id);
  if (!sujet) return res.status(404).json({ error: 'Sujet introuvable' });
  if (req.user.role === 'encadrant' && sujet.encadrant_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { titre, description, competences, mots_cles, nb_places, annee_id } = req.body || {};
  db.prepare(`UPDATE sujets SET titre=?, description=?, competences=?, mots_cles=?, nb_places=?, annee_id=? WHERE id=?`)
    .run(
      titre ?? sujet.titre,
      description ?? sujet.description,
      competences ?? sujet.competences,
      mots_cles ?? sujet.mots_cles,
      nb_places ?? sujet.nb_places,
      annee_id !== undefined ? annee_id : sujet.annee_id,
      sujet.id
    );
  res.json(db.prepare(`${SELECT} WHERE s.id=?`).get(sujet.id));
});

// Validation / rejet par l'admin
router.patch('/:id/statut', requireRole('admin'), (req, res) => {
  const sujet = db.prepare('SELECT * FROM sujets WHERE id=?').get(req.params.id);
  if (!sujet) return res.status(404).json({ error: 'Sujet introuvable' });
  const { statut } = req.body || {};
  if (!['valide', 'rejete', 'propose', 'archive'].includes(statut)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  db.prepare('UPDATE sujets SET statut=? WHERE id=?').run(statut, sujet.id);
  if (statut === 'valide') {
    notify(sujet.encadrant_id, 'sujet_valide', 'Sujet validé',
      `Votre sujet « ${sujet.titre} » a été validé et est visible par les étudiants.`, '/encadrant/sujets');
  } else if (statut === 'rejete') {
    notify(sujet.encadrant_id, 'sujet_rejete', 'Sujet rejeté',
      `Votre sujet « ${sujet.titre} » a été rejeté par l'administration.`, '/encadrant/sujets');
  }
  res.json(db.prepare(`${SELECT} WHERE s.id=?`).get(sujet.id));
});

router.delete('/:id', requireRole('encadrant', 'admin'), (req, res) => {
  const sujet = db.prepare('SELECT * FROM sujets WHERE id=?').get(req.params.id);
  if (!sujet) return res.status(404).json({ error: 'Sujet introuvable' });
  if (req.user.role === 'encadrant' && sujet.encadrant_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const projets = db.prepare('SELECT COUNT(*) c FROM projets WHERE sujet_id=?').get(sujet.id).c;
  if (projets > 0 && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Ce sujet a des projets associés, suppression impossible' });
  }
  db.prepare('DELETE FROM sujets WHERE id=?').run(sujet.id);
  res.json({ message: 'Sujet supprimé' });
});

export default router;
