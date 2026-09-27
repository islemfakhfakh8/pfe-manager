import { Router } from 'express';
import db from '../src/db.js';
import { authRequired, requireRole } from '../src/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM annees ORDER BY date_debut DESC').all());
});

router.post('/', requireRole('admin'), (req, res) => {
  const { libelle, date_debut, date_fin, active } = req.body || {};
  if (!libelle) return res.status(400).json({ error: 'Libellé requis' });
  const dup = db.prepare('SELECT id FROM annees WHERE libelle=?').get(libelle.trim());
  if (dup) return res.status(409).json({ error: 'Cette année existe déjà' });
  const tx = db.transaction(() => {
    if (active) db.prepare('UPDATE annees SET active=0').run();
    const info = db.prepare('INSERT INTO annees (libelle, date_debut, date_fin, active) VALUES (?,?,?,?)')
      .run(libelle.trim(), date_debut || null, date_fin || null, active ? 1 : 0);
    return info.lastInsertRowid;
  });
  const id = tx();
  res.status(201).json(db.prepare('SELECT * FROM annees WHERE id=?').get(id));
});

router.patch('/:id/activer', requireRole('admin'), (req, res) => {
  const a = db.prepare('SELECT * FROM annees WHERE id=?').get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Année introuvable' });
  const tx = db.transaction(() => {
    db.prepare('UPDATE annees SET active=0').run();
    db.prepare('UPDATE annees SET active=1 WHERE id=?').run(a.id);
  });
  tx();
  res.json(db.prepare('SELECT * FROM annees WHERE id=?').get(a.id));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const a = db.prepare('SELECT * FROM annees WHERE id=?').get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Année introuvable' });
  const liens = db.prepare('SELECT COUNT(*) c FROM sujets WHERE annee_id=?').get(a.id).c;
  if (liens > 0) return res.status(400).json({ error: 'Année liée à des sujets, suppression impossible' });
  db.prepare('DELETE FROM annees WHERE id=?').run(a.id);
  res.json({ message: 'Année supprimée' });
});

export default router;
