import db from './db.js';

export function notify(userId, type, titre, message, lien = null) {
  if (!userId) return;
  db.prepare(
    'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?,?,?,?,?)'
  ).run(userId, type, titre, message, lien);
}

export function notifyMany(userIds, type, titre, message, lien = null) {
  const stmt = db.prepare(
    'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?,?,?,?,?)'
  );
  const tx = db.transaction((ids) => {
    for (const id of ids) if (id) stmt.run(id, type, titre, message, lien);
  });
  tx([...new Set(userIds)].filter(Boolean));
}

export const publicUser = (u) =>
  u ? { id: u.id, nom: u.nom, prenom: u.prenom, email: u.email, role: u.role } : null;

export function fullName(u) {
  return u ? `${u.prenom} ${u.nom}` : '';
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
