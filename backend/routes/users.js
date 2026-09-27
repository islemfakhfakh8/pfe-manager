import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../src/db.js';
import { authRequired, requireRole } from '../src/auth.js';

const router = Router();
router.use(authRequired);

const PUBLIC_COLS = 'id, nom, prenom, email, role, actif, created_at';

// Liste des encadrants (accessible à tout utilisateur connecté — utile aux filtres étudiants)
router.get('/encadrants', (req, res) => {
  const rows = db
    .prepare(`SELECT ${PUBLIC_COLS} FROM users WHERE role = 'encadrant' AND actif = 1 ORDER BY nom`)
    .all();
  res.json(rows);
});

// Admin uniquement
router.get('/', requireRole('admin'), (req, res) => {
  const { role, q } = req.query;
  let sql = `SELECT ${PUBLIC_COLS} FROM users WHERE 1=1`;
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (q) {
    sql += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY role, nom';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', requireRole('admin'), (req, res) => {
  const { nom, prenom, email, password, role } = req.body || {};
  if (!nom || !prenom || !email || !password || !role) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (!['admin', 'encadrant', 'etudiant'].includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (existing) return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });

  const info = db
    .prepare('INSERT INTO users (nom, prenom, email, password, role) VALUES (?,?,?,?,?)')
    .run(nom.trim(), prenom.trim(), String(email).toLowerCase().trim(), bcrypt.hashSync(password, 10), role);
  const user = db.prepare(`SELECT ${PUBLIC_COLS} FROM users WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json(user);
});

router.put('/:id', requireRole('admin'), (req, res) => {
  const user = db.prepare(`SELECT ${PUBLIC_COLS} FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const { nom, prenom, email, role, actif, password } = req.body || {};

  if (email && email.toLowerCase() !== user.email) {
    const dup = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), user.id);
    if (dup) return res.status(409).json({ error: 'Email déjà utilisé' });
  }
  db.prepare('UPDATE users SET nom=?, prenom=?, email=?, role=?, actif=? WHERE id=?').run(
    nom ?? user.nom,
    prenom ?? user.prenom,
    (email ?? user.email).toLowerCase(),
    role ?? user.role,
    actif !== undefined ? (actif ? 1 : 0) : user.actif,
    user.id
  );
  if (password) {
    if (String(password).length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6)' });
    db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(password, 10), user.id);
  }
  res.json(db.prepare(`SELECT ${PUBLIC_COLS} FROM users WHERE id = ?`).get(user.id));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
  const projets = db.prepare('SELECT COUNT(*) c FROM projets WHERE etudiant_id=? OR encadrant_id=?').get(user.id, user.id).c;
  if (projets > 0) {
    db.prepare('UPDATE users SET actif=0 WHERE id=?').run(user.id);
    return res.json({ message: 'Utilisateur désactivé (projets existants conservés)' });
  }
  db.prepare('DELETE FROM users WHERE id=?').run(user.id);
  res.json({ message: 'Utilisateur supprimé' });
});

export default router;
