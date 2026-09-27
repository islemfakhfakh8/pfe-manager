import { Router } from 'express';
import db from '../src/db.js';
import { authRequired } from '../src/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  const nonLues = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND lu=0').get(req.user.id).c;
  res.json({ notifications: rows, non_lues: nonLues });
});

router.get('/unread-count', (req, res) => {
  const c = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND lu=0').get(req.user.id).c;
  res.json({ non_lues: c });
});

router.patch('/:id/lu', (req, res) => {
  db.prepare('UPDATE notifications SET lu=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ message: 'ok' });
});

router.patch('/tout-lire', (req, res) => {
  db.prepare('UPDATE notifications SET lu=1 WHERE user_id=?').run(req.user.id);
  res.json({ message: 'ok' });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ message: 'ok' });
});

export default router;
