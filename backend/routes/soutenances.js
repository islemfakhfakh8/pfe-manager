import { Router } from 'express';
import db from '../src/db.js';
import { authRequired, requireRole } from '../src/auth.js';
import { notify } from '../src/helpers.js';

const router = Router();
router.use(authRequired);

const SELECT = `
  SELECT so.*, s.titre AS sujet_titre,
    ue.nom AS etudiant_nom, ue.prenom AS etudiant_prenom, ue.id AS etudiant_id,
    us.nom AS encadrant_nom, us.prenom AS encadrant_prenom, us.id AS encadrant_id
  FROM soutenances so
  JOIN projets p ON p.id=so.projet_id
  JOIN sujets s ON s.id=p.sujet_id
  JOIN users ue ON ue.id=p.etudiant_id
  JOIN users us ON us.id=p.encadrant_id`;

// Admin voit tout ; encadrant/étudiant : uniquement les siennes
router.get('/', (req, res) => {
  let sql = `${SELECT} WHERE 1=1`;
  const params = [];
  if (req.user.role === 'encadrant') { sql += ' AND us.id = ?'; params.push(req.user.id); }
  else if (req.user.role === 'etudiant') { sql += ' AND ue.id = ?'; params.push(req.user.id); }
  sql += ' ORDER BY so.date, so.heure';
  res.json(db.prepare(sql).all(...params));
});

router.get('/ma-soutenance', requireRole('etudiant'), (req, res) => {
  const s = db.prepare(`${SELECT} WHERE ue.id=? ORDER BY so.date LIMIT 1`).get(req.user.id);
  res.json(s || null);
});

router.post('/', requireRole('admin'), (req, res) => {
  const { projet_id, date, heure, salle, membres_jury } = req.body || {};
  if (!projet_id || !date || !heure || !salle) {
    return res.status(400).json({ error: 'Projet, date, heure et salle sont requis' });
  }
  const projet = db.prepare('SELECT * FROM projets WHERE id=?').get(projet_id);
  if (!projet) return res.status(404).json({ error: 'Projet introuvable' });
  const jury = Array.isArray(membres_jury) ? membres_jury.join(', ') : (membres_jury || '');

  const exist = db.prepare('SELECT id FROM soutenances WHERE projet_id=?').get(projet_id);
  if (exist) {
    db.prepare('UPDATE soutenances SET date=?, heure=?, salle=?, membres_jury=? WHERE id=?')
      .run(date, heure, salle, jury, exist.id);
  } else {
    db.prepare('INSERT INTO soutenances (projet_id, date, heure, salle, membres_jury) VALUES (?,?,?,?,?)')
      .run(projet_id, date, heure, salle, jury);
  }
  notify(projet.etudiant_id, 'soutenance', 'Soutenance planifiée',
    `Votre soutenance aura lieu le ${date} à ${heure}, salle ${salle}.`, '/etudiant/soutenance');
  notify(projet.encadrant_id, 'soutenance', 'Soutenance planifiée',
    `Soutenance de votre étudiant planifiée le ${date} à ${heure}, salle ${salle}.`, '/encadrant/soutenances');
  res.status(201).json(db.prepare(`${SELECT} WHERE so.projet_id=?`).get(projet_id));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const s = db.prepare('SELECT * FROM soutenances WHERE id=?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Soutenance introuvable' });
  db.prepare('DELETE FROM soutenances WHERE id=?').run(s.id);
  res.json({ message: 'Soutenance supprimée' });
});

export default router;
