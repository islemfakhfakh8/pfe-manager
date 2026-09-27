import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'pfe.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','encadrant','etudiant')),
  actif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS annees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  libelle TEXT NOT NULL UNIQUE,
  date_debut TEXT,
  date_fin TEXT,
  active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sujets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  competences TEXT,
  mots_cles TEXT,
  encadrant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  annee_id INTEGER REFERENCES annees(id) ON DELETE SET NULL,
  nb_places INTEGER NOT NULL DEFAULT 1,
  statut TEXT NOT NULL DEFAULT 'propose' CHECK(statut IN ('propose','valide','rejete','complet','archive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS candidatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  etudiant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sujet_id INTEGER NOT NULL REFERENCES sujets(id) ON DELETE CASCADE,
  ordre_pref INTEGER NOT NULL DEFAULT 1,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK(statut IN ('en_attente','acceptee','refusee','annulee')),
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(etudiant_id, sujet_id)
);

CREATE TABLE IF NOT EXISTS projets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sujet_id INTEGER NOT NULL REFERENCES sujets(id) ON DELETE CASCADE,
  etudiant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encadrant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  annee_id INTEGER REFERENCES annees(id) ON DELETE SET NULL,
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK(statut IN ('en_cours','termine','archive')),
  progression INTEGER NOT NULL DEFAULT 0,
  date_debut TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jalons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  echeance TEXT,
  statut TEXT NOT NULL DEFAULT 'a_faire' CHECK(statut IN ('a_faire','en_cours','termine')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS livrables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('rapport_avancement','memoire_final','presentation','autre')),
  fichier_nom TEXT NOT NULL,
  fichier_url TEXT NOT NULL,
  commentaire TEXT,
  date_depot TEXT NOT NULL DEFAULT (datetime('now')),
  commentaire_encadrant TEXT,
  commentaire_date TEXT
);

CREATE TABLE IF NOT EXISTS soutenances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projet_id INTEGER NOT NULL UNIQUE REFERENCES projets(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  heure TEXT NOT NULL,
  salle TEXT NOT NULL,
  membres_jury TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expediteur_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destinataire_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  projet_id INTEGER REFERENCES projets(id) ON DELETE SET NULL,
  contenu TEXT NOT NULL,
  lu INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT,
  lien TEXT,
  lu INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export default db;
