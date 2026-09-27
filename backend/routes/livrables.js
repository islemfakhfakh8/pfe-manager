import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db from '../src/db.js';
import { authRequired, requireRole } from '../src/auth.js';
import { notify } from '../src/helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});
const ALLOWED = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.png', '.jpg', '.jpeg', '.txt'];
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED.includes(ext)) cb(null, true);
    else cb(new Error('Type de fichier non autorisé'));
  },
});

const router = Router();
router.use(authRequired);

function projetOf(livrable) {
  return db.prepare('SELECT * FROM projets WHERE id=?').get(livrable.projet_id);
}
function canAccess(projet, user) {
  return user.role === 'admin' || projet.etudiant_id === user.id || projet.encadrant_id === user.id;
}

// Déposer un livrable (étudiant du projet)
router.post('/', requireRole('etudiant'), upload.single('fichier'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
  const { projet_id, type } = req.body || {};
  const projet = db.prepare('SELECT * FROM projets WHERE id=?').get(projet_id);
  if (!projet) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Projet introuvable' });
  }
  if (projet.etudiant_id !== req.user.id) {
    fs.unlinkSync(req.file.path);
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const types = ['rapport_avancement', 'memoire_final', 'presentation', 'autre'];
  const livType = types.includes(type) ? type : 'autre';
  const info = db
    .prepare('INSERT INTO livrables (projet_id, type, fichier_nom, fichier_url) VALUES (?,?,?,?)')
    .run(projet.id, livType, req.file.originalname, `/uploads/${req.file.filename}`);
  notify(projet.encadrant_id, 'livrable', 'Nouveau livrable déposé',
    `${req.user.prenom} ${req.user.nom} a déposé un livrable (${livType}).`, `/encadrant/projets/${projet.id}`);
  res.status(201).json(db.prepare('SELECT * FROM livrables WHERE id=?').get(info.lastInsertRowid));
});

router.get('/projet/:projetId', (req, res) => {
  const projet = db.prepare('SELECT * FROM projets WHERE id=?').get(req.params.projetId);
  if (!projet || !canAccess(projet, req.user)) return res.status(403).json({ error: 'Accès refusé' });
  res.json(db.prepare('SELECT * FROM livrables WHERE projet_id=? ORDER BY date_depot DESC').all(projet.id));
});

// Feedback de l'encadrant
router.patch('/:id/feedback', requireRole('encadrant', 'admin'), (req, res) => {
  const liv = db.prepare('SELECT * FROM livrables WHERE id=?').get(req.params.id);
  if (!liv) return res.status(404).json({ error: 'Livrable introuvable' });
  const projet = projetOf(liv);
  if (req.user.role === 'encadrant' && projet.encadrant_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { commentaire } = req.body || {};
  db.prepare("UPDATE livrables SET commentaire_encadrant=?, commentaire_date=datetime('now') WHERE id=?")
    .run(commentaire || '', liv.id);
  notify(projet.etudiant_id, 'feedback', 'Feedback reçu',
    `Votre encadrant a commenté votre livrable « ${liv.fichier_nom} ».`, '/etudiant/projet');
  res.json(db.prepare('SELECT * FROM livrables WHERE id=?').get(liv.id));
});

router.delete('/:id', requireRole('etudiant', 'admin'), (req, res) => {
  const liv = db.prepare('SELECT * FROM livrables WHERE id=?').get(req.params.id);
  if (!liv) return res.status(404).json({ error: 'Livrable introuvable' });
  const projet = projetOf(liv);
  if (req.user.role === 'etudiant' && projet.etudiant_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const filePath = path.join(uploadDir, path.basename(liv.fichier_url));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM livrables WHERE id=?').run(liv.id);
  res.json({ message: 'Livrable supprimé' });
});

export default router;
