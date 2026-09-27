import { Router } from 'express';
import db from '../src/db.js';
import { authRequired } from '../src/auth.js';
import { notify } from '../src/helpers.js';

const router = Router();
router.use(authRequired);

// Conversations de l'utilisateur : liste des interlocuteurs + dernier message
router.get('/conversations', (req, res) => {
  const rows = db.prepare(`
    SELECT
      CASE WHEN expediteur_id = @me THEN destinataire_id ELSE expediteur_id END AS interlocuteur_id,
      MAX(created_at) AS dernier_envoi,
      COUNT(*) AS nb
    FROM messages
    WHERE expediteur_id = @me OR destinataire_id = @me
    GROUP BY interlocuteur_id
    ORDER BY dernier_envoi DESC
  `).all({ me: req.user.id });

  const convs = rows.map((r) => {
    const inter = db.prepare('SELECT id, nom, prenom, email, role FROM users WHERE id=?').get(r.interlocuteur_id);
    const dernier = db.prepare(`
      SELECT * FROM messages
      WHERE (expediteur_id=@me AND destinataire_id=@autre) OR (expediteur_id=@autre AND destinataire_id=@me)
      ORDER BY created_at DESC LIMIT 1
    `).get({ me: req.user.id, autre: r.interlocuteur_id });
    const nonLus = db.prepare(`
      SELECT COUNT(*) c FROM messages WHERE expediteur_id=@autre AND destinataire_id=@me AND lu=0
    `).get({ me: req.user.id, autre: r.interlocuteur_id }).c;
    return { interlocuteur: inter, dernier, non_lus: nonLus };
  });
  res.json(convs);
});

// Fil avec un interlocuteur précis (marque comme lus les messages reçus)
router.get('/avec/:userId', (req, res) => {
  const autreId = parseInt(req.params.userId);
  const msgs = db.prepare(`
    SELECT * FROM messages
    WHERE (expediteur_id=@me AND destinataire_id=@autre) OR (expediteur_id=@autre AND destinataire_id=@me)
    ORDER BY created_at ASC
  `).all({ me: req.user.id, autre: autreId });
  db.prepare('UPDATE messages SET lu=1 WHERE expediteur_id=? AND destinataire_id=? AND lu=0').run(autreId, req.user.id);
  const interlocuteur = db.prepare('SELECT id, nom, prenom, email, role FROM users WHERE id=?').get(autreId) || null;
  res.json({ interlocuteur, messages: msgs });
});

router.post('/', (req, res) => {
  const { destinataire_id, contenu, projet_id } = req.body || {};
  if (!destinataire_id || !contenu || !contenu.trim()) {
    return res.status(400).json({ error: 'Destinataire et contenu requis' });
  }
  const dest = db.prepare('SELECT * FROM users WHERE id=?').get(destinataire_id);
  if (!dest) return res.status(404).json({ error: 'Destinataire introuvable' });
  // Étudiants et encadrants : uniquement vers leur contrepartie de projet ; admin : libre
  if (req.user.role !== 'admin') {
    const lien = db.prepare(`
      SELECT id FROM projets
      WHERE (etudiant_id=@a AND encadrant_id=@b) OR (etudiant_id=@b AND encadrant_id=@a)
    `).get({ a: req.user.id, b: dest.id });
    if (!lien) return res.status(403).json({ error: 'Vous ne pouvez écrire qu\'à votre encadrant ou étudiant' });
  }
  const info = db
    .prepare('INSERT INTO messages (expediteur_id, destinataire_id, projet_id, contenu) VALUES (?,?,?,?)')
    .run(req.user.id, dest.id, projet_id || null, contenu.trim());
  notify(dest.id, 'message', 'Nouveau message',
    `${req.user.prenom} ${req.user.nom} : ${contenu.trim().slice(0, 80)}${contenu.length > 80 ? '…' : ''}`, '/messages');
  res.status(201).json(db.prepare('SELECT * FROM messages WHERE id=?').get(info.lastInsertRowid));
});

export default router;
