import { Router } from 'express';
import db from '../src/db.js';
import { authRequired, requireRole } from '../src/auth.js';
import { notify } from '../src/helpers.js';

const router = Router();
router.use(authRequired);

const SELECT = `
  SELECT p.*, s.titre AS sujet_titre, s.description AS sujet_description, s.competences, s.mots_cles,
    ue.nom AS etudiant_nom, ue.prenom AS etudiant_prenom, ue.email AS etudiant_email,
    us.nom AS encadrant_nom, us.prenom AS encadrant_prenom, us.email AS encadrant_email,
    a.libelle AS annee_libelle,
    (SELECT COUNT(*) FROM livrables l WHERE l.projet_id=p.id) AS nb_livrables,
    (SELECT COUNT(*) FROM jalons j WHERE j.projet_id=p.id AND j.statut='termine') AS jalons_faits,
    (SELECT COUNT(*) FROM jalons j WHERE j.projet_id=p.id) AS jalons_total
  FROM projets p
  JOIN sujets s ON s.id=p.sujet_id
  JOIN users ue ON ue.id=p.etudiant_id
  JOIN users us ON us.id=p.encadrant_id
  LEFT JOIN annees a ON a.id=p.annee_id`;

function canAccess(projet, user) {
  return user.role === 'admin' || projet.etudiant_id === user.id || projet.encadrant_id === user.id;
}

// Liste filtrée par rôle (+ archive)
router.get('/', (req, res) => {
  let sql = `${SELECT} WHERE 1=1`;
  const params = [];
  if (req.query.archive === '1') {
    sql += " AND p.statut='archive'";
  } else if (req.user.role === 'etudiant') {
    sql += ' AND p.etudiant_id = ?'; params.push(req.user.id);
  } else if (req.user.role === 'encadrant') {
    sql += ' AND p.encadrant_id = ?'; params.push(req.user.id);
  }
  if (req.query.statut) { sql += ' AND p.statut = ?'; params.push(req.query.statut); }
  if (req.query.annee_id) { sql += ' AND p.annee_id = ?'; params.push(req.query.annee_id); }
  sql += ' ORDER BY p.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// Mon projet en cours (raccourci étudiant)
router.get('/mon-projet', requireRole('etudiant'), (req, res) => {
  const projet = db.prepare(`${SELECT} WHERE p.etudiant_id=? AND p.statut='en_cours' ORDER BY p.id DESC`).get(req.user.id);
  res.json(projet || null);
});

router.get('/:id', (req, res) => {
  const projet = db.prepare(`${SELECT} WHERE p.id=?`).get(req.params.id);
  if (!projet) return res.status(404).json({ error: 'Projet introuvable' });
  if (!canAccess(projet, req.user)) return res.status(403).json({ error: 'Accès refusé' });
  const jalons = db.prepare('SELECT * FROM jalons WHERE projet_id=? ORDER BY echeance, id').all(projet.id);
  const livrables = db.prepare('SELECT * FROM livrables WHERE projet_id=? ORDER BY date_depot DESC').all(projet.id);
  const soutenance = db.prepare('SELECT * FROM soutenances WHERE projet_id=?').get(projet.id) || null;
  res.json({ ...projet, jalons, livrables, soutenance });
});

// Mettre à jour progression / statut
router.patch('/:id', requireRole('encadrant', 'admin'), (req, res) => {
  const projet = db.prepare('SELECT * FROM projets WHERE id=?').get(req.params.id);
  if (!projet) return res.status(404).json({ error: 'Projet introuvable' });
  if (req.user.role === 'encadrant' && projet.encadrant_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { progression, statut } = req.body || {};
  const newProg = progression !== undefined
    ? Math.max(0, Math.min(100, parseInt(progression) || 0))
    : projet.progression;
  const newStatut = statut && ['en_cours', 'termine', 'archive'].includes(statut) ? statut : projet.statut;
  db.prepare('UPDATE projets SET progression=?, statut=? WHERE id=?').run(newProg, newStatut, projet.id);
  if (newProg !== projet.progression) {
    notify(projet.etudiant_id, 'progression', 'Avancement mis à jour',
      `Votre encadrant a mis à jour la progression de votre PFE à ${newProg}%.`, '/etudiant/projet');
  }
  res.json(db.prepare(`${SELECT} WHERE p.id=?`).get(projet.id));
});

// ---- Jalons ----
router.get('/:id/jalons', (req, res) => {
  const projet = db.prepare('SELECT * FROM projets WHERE id=?').get(req.params.id);
  if (!projet || !canAccess(projet, req.user)) return res.status(403).json({ error: 'Accès refusé' });
  res.json(db.prepare('SELECT * FROM jalons WHERE projet_id=? ORDER BY echeance, id').all(projet.id));
});

router.post('/:id/jalons', requireRole('encadrant', 'admin'), (req, res) => {
  const projet = db.prepare('SELECT * FROM projets WHERE id=?').get(req.params.id);
  if (!projet) return res.status(404).json({ error: 'Projet introuvable' });
  if (req.user.role === 'encadrant' && projet.encadrant_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { titre, description, echeance } = req.body || {};
  if (!titre) return res.status(400).json({ error: 'Titre du jalon requis' });
  const info = db.prepare('INSERT INTO jalons (projet_id, titre, description, echeance) VALUES (?,?,?,?)')
    .run(projet.id, titre.trim(), description || '', echeance || null);
  notify(projet.etudiant_id, 'jalon', 'Nouveau jalon',
    `Un nouveau jalon « ${titre} » a été ajouté à votre PFE.`, '/etudiant/projet');
  res.status(201).json(db.prepare('SELECT * FROM jalons WHERE id=?').get(info.lastInsertRowid));
});

router.patch('/jalons/:jalonId', (req, res) => {
  const jalon = db.prepare('SELECT * FROM jalons WHERE id=?').get(req.params.jalonId);
  if (!jalon) return res.status(404).json({ error: 'Jalon introuvable' });
  const projet = db.prepare('SELECT * FROM projets WHERE id=?').get(jalon.projet_id);
  if (!canAccess(projet, req.user)) return res.status(403).json({ error: 'Accès refusé' });
  // L'étudiant peut changer 'a_faire'->'en_cours'->'termine' sur ses jalons ; encadrant/admin tout
  const { statut, titre, description, echeance } = req.body || {};
  if (req.user.role === 'etudiant' && statut === 'termine' && jalon.statut === 'a_faire') {
    // autorisé : passage direct à terminé
  }
  db.prepare('UPDATE jalons SET statut=?, titre=?, description=?, echeance=? WHERE id=?').run(
    statut ?? jalon.statut,
    titre ?? jalon.titre,
    description ?? jalon.description,
    echeance !== undefined ? echeance : jalon.echeance,
    jalon.id
  );
  res.json(db.prepare('SELECT * FROM jalons WHERE id=?').get(jalon.id));
});

router.delete('/jalons/:jalonId', requireRole('encadrant', 'admin'), (req, res) => {
  const jalon = db.prepare('SELECT * FROM jalons WHERE id=?').get(req.params.jalonId);
  if (!jalon) return res.status(404).json({ error: 'Jalon introuvable' });
  db.prepare('DELETE FROM jalons WHERE id=?').run(jalon.id);
  res.json({ message: 'Jalon supprimé' });
});

export default router;
