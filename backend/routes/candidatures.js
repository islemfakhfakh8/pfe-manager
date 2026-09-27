import { Router } from 'express';
import db from '../src/db.js';
import { authRequired, requireRole } from '../src/auth.js';
import { notify, fullName } from '../src/helpers.js';

const router = Router();
router.use(authRequired);

const SELECT = `
  SELECT c.*, s.titre AS sujet_titre, s.encadrant_id,
    ue.nom AS etudiant_nom, ue.prenom AS etudiant_prenom, ue.email AS etudiant_email,
    us.nom AS encadrant_nom, us.prenom AS encadrant_prenom
  FROM candidatures c
  JOIN sujets s ON s.id = c.sujet_id
  JOIN users ue ON ue.id = c.etudiant_id
  JOIN users us ON us.id = s.encadrant_id`;

// Étudiant : mes candidatures | Encadrant : candidatures sur mes sujets | Admin : tout
router.get('/', (req, res) => {
  let sql = `${SELECT} WHERE 1=1`;
  const params = [];
  if (req.user.role === 'etudiant') {
    sql += ' AND c.etudiant_id = ?'; params.push(req.user.id);
  } else if (req.user.role === 'encadrant') {
    sql += ' AND s.encadrant_id = ?'; params.push(req.user.id);
  }
  if (req.query.statut) { sql += ' AND c.statut = ?'; params.push(req.query.statut); }
  if (req.query.sujet_id) { sql += ' AND c.sujet_id = ?'; params.push(req.query.sujet_id); }
  sql += ' ORDER BY c.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// Étudiant : postuler (par ordre de préférence)
router.post('/', requireRole('etudiant'), (req, res) => {
  const { sujet_id, ordre_pref, message } = req.body || {};
  const sujet = db.prepare('SELECT * FROM sujets WHERE id=?').get(sujet_id);
  if (!sujet || !['valide', 'complet'].includes(sujet.statut)) {
    return res.status(404).json({ error: 'Sujet indisponible' });
  }
  const dejaProjet = db.prepare("SELECT id FROM projets WHERE etudiant_id=? AND statut='en_cours'").get(req.user.id);
  if (dejaProjet) return res.status(400).json({ error: 'Vous avez déjà un projet en cours' });
  const deja = db.prepare('SELECT id, statut FROM candidatures WHERE etudiant_id=? AND sujet_id=?').get(req.user.id, sujet.id);
  if (deja) {
    return deja.statut === 'acceptee'
      ? res.status(400).json({ error: 'Candidature déjà acceptée pour ce sujet' })
      : res.status(409).json({ error: 'Vous avez déjà postulé à ce sujet' });
  }
  const prises = db.prepare("SELECT COUNT(*) c FROM candidatures WHERE sujet_id=? AND statut='acceptee'").get(sujet.id).c;
  if (prises >= sujet.nb_places) return res.status(400).json({ error: 'Toutes les places de ce sujet sont prises' });

  const ordre = parseInt(ordre_pref) || 1;
  const info = db
    .prepare('INSERT INTO candidatures (etudiant_id, sujet_id, ordre_pref, message) VALUES (?,?,?,?)')
    .run(req.user.id, sujet.id, ordre, message || '');
  notify(sujet.encadrant_id, 'candidature', 'Nouvelle candidature',
    `${fullName(req.user)} a postulé à votre sujet « ${sujet.titre} » (préférence n°${ordre}).`, '/encadrant/candidatures');
  res.status(201).json(db.prepare(`${SELECT} WHERE c.id=?`).get(info.lastInsertRowid));
});

// Étudiant : annuler sa candidature en attente
router.patch('/:id/annuler', requireRole('etudiant'), (req, res) => {
  const c = db.prepare('SELECT * FROM candidatures WHERE id=?').get(req.params.id);
  if (!c || c.etudiant_id !== req.user.id) return res.status(404).json({ error: 'Candidature introuvable' });
  if (c.statut !== 'en_attente') return res.status(400).json({ error: 'Seule une candidature en attente peut être annulée' });
  db.prepare("UPDATE candidatures SET statut='annulee' WHERE id=?").run(c.id);
  res.json({ message: 'Candidature annulée' });
});

// Encadrant (ou admin) : accepter / refuser
router.patch('/:id/decision', requireRole('encadrant', 'admin'), (req, res) => {
  const c = db.prepare(`${SELECT} WHERE c.id=?`).get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Candidature introuvable' });
  if (req.user.role === 'encadrant' && c.encadrant_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { decision } = req.body || {};
  if (!['acceptee', 'refusee'].includes(decision)) return res.status(400).json({ error: 'Décision invalide' });
  if (c.statut === 'acceptee') return res.status(400).json({ error: 'Candidature déjà acceptée' });

  const sujet = db.prepare('SELECT * FROM sujets WHERE id=?').get(c.sujet_id);

  if (decision === 'acceptee') {
    const projetExistant = db.prepare("SELECT id FROM projets WHERE etudiant_id=? AND statut='en_cours'").get(c.etudiant_id);
    if (projetExistant) return res.status(400).json({ error: 'Cet étudiant a déjà un projet en cours' });
    const prises = db.prepare("SELECT COUNT(*) c FROM candidatures WHERE sujet_id=? AND statut='acceptee'").get(sujet.id).c;
    if (prises >= sujet.nb_places) return res.status(400).json({ error: 'Toutes les places de ce sujet sont prises' });

    const tx = db.transaction(() => {
      db.prepare("UPDATE candidatures SET statut='acceptee' WHERE id=?").run(c.id);
      // Refuser les autres candidatures en attente de cet étudiant
      db.prepare("UPDATE candidatures SET statut='refusee' WHERE etudiant_id=? AND statut='en_attente' AND id != ?")
        .run(c.etudiant_id, c.id);
      db.prepare(`INSERT INTO projets (sujet_id, etudiant_id, encadrant_id, annee_id)
                  VALUES (?,?,?,?)`)
        .run(sujet.id, c.etudiant_id, sujet.encadrant_id, sujet.annee_id);
      const restantes = db.prepare("SELECT COUNT(*) c FROM candidatures WHERE sujet_id=? AND statut='acceptee'").get(sujet.id).c;
      if (restantes >= sujet.nb_places) db.prepare("UPDATE sujets SET statut='complet' WHERE id=?").run(sujet.id);
    });
    tx();
    notify(c.etudiant_id, 'candidature_acceptee', 'Candidature acceptée 🎉',
      `Votre candidature au sujet « ${sujet.titre} » a été acceptée. Votre PFE démarre !`, '/etudiant/projet');
  } else {
    db.prepare("UPDATE candidatures SET statut='refusee' WHERE id=?").run(c.id);
    notify(c.etudiant_id, 'candidature_refusee', 'Candidature refusée',
      `Votre candidature au sujet « ${sujet.titre} » n'a pas été retenue.`, '/etudiant/candidatures');
  }
  res.json(db.prepare(`${SELECT} WHERE c.id=?`).get(c.id));
});

export default router;
