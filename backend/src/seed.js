import bcrypt from 'bcryptjs';
import db from './db.js';

const hash = (p) => bcrypt.hashSync(p, 10);

const count = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (count > 0) {
  console.log('Base déjà peuplée. Supprimez backend/data/pfe.db pour réinitialiser.');
  process.exit(0);
}

console.log('Seed de la base de données...');

// ---- Année universitaire ----
const annee = db.prepare(
  "INSERT INTO annees (libelle, date_debut, date_fin, active) VALUES ('2026-2027','2026-09-01','2027-07-15',1)"
).run().lastInsertRowid;
const anneePrec = db.prepare(
  "INSERT INTO annees (libelle, date_debut, date_fin, active) VALUES ('2025-2026','2025-09-01','2026-07-15',0)"
).run().lastInsertRowid;

// ---- Utilisateurs ----
const insUser = db.prepare('INSERT INTO users (nom, prenom, email, password, role) VALUES (?,?,?,?,?)');
const adminId = insUser.run('Ben Ali', 'Sonia', 'admin@univ.dz', hash('admin123'), 'admin').lastInsertRowid;
const enc1 = insUser.run('Mansouri', 'Karim', 'k.mansouri@univ.dz', hash('encadrant123'), 'encadrant').lastInsertRowid;
const enc2 = insUser.run('Dubois', 'Claire', 'c.dubois@univ.dz', hash('encadrant123'), 'encadrant').lastInsertRowid;
const enc3 = insUser.run('Haddad', 'Nadia', 'n.haddad@univ.dz', hash('encadrant123'), 'encadrant').lastInsertRowid;
const et1 = insUser.run('Boumedien', 'Amine', 'a.boumedien@univ.dz', hash('etudiant123'), 'etudiant').lastInsertRowid;
const et2 = insUser.run('Saidi', 'Lina', 'l.saidi@univ.dz', hash('etudiant123'), 'etudiant').lastInsertRowid;
const et3 = insUser.run('Meziane', 'Yacine', 'y.meziane@univ.dz', hash('etudiant123'), 'etudiant').lastInsertRowid;
const et4 = insUser.run('Ferhat', 'Imene', 'i.ferhat@univ.dz', hash('etudiant123'), 'etudiant').lastInsertRowid;
const et5 = insUser.run('Toumi', 'Riad', 'r.toumi@univ.dz', hash('etudiant123'), 'etudiant').lastInsertRowid;
const etOld = insUser.run('Kaci', 'Omar', 'o.kaci@univ.dz', hash('etudiant123'), 'etudiant').lastInsertRowid;

// ---- Sujets ----
const insSujet = db.prepare(`INSERT INTO sujets
  (titre, description, competences, mots_cles, encadrant_id, annee_id, nb_places, statut)
  VALUES (?,?,?,?,?,?,?,?)`);

const s1 = insSujet.run(
  'Plateforme de gestion des stages en entreprise',
  "Conception et développement d'une application web permettant de gérer les conventions de stage, le suivi des étudiants en entreprise et l'évaluation des tuteurs. Le projet couvrira l'analyse des besoins, la modélisation UML, le développement full-stack et le déploiement.",
  'React, Node.js, MongoDB, UML',
  'Web, Full-stack, Gestion',
  enc1, annee, 2, 'valide'
).lastInsertRowid;

const s2 = insSujet.run(
  'Système de détection d\'anomalies réseau par apprentissage automatique',
  "Mise en place d'un pipeline de détection d'intrusions et d'anomalies dans les journaux réseau d'un campus à l'aide de modèles d'apprentissage automatique. Étude comparative de plusieurs approches (isolation forest, autoencodeurs, réseaux de neurones) et déploiement d'un tableau de bord temps réel.",
  'Python, Machine Learning, Cybersécurité, Réseaux',
  'IA, Sécurité, Data Science',
  enc2, annee, 1, 'valide'
).lastInsertRowid;

const s3 = insSujet.run(
  'Application mobile de covoiturage universitaire',
  "Développement d'une application mobile (React Native ou Flutter) facilitant le covoiturage entre étudiants et enseignants : géolocalisation, mise en relation, système de notation et optimisation des trajets.",
  'React Native, Firebase, API REST, Géolocalisation',
  'Mobile, Transport, Géolocalisation',
  enc2, annee, 2, 'valide'
).lastInsertRowid;

const s4 = insSujet.run(
  'Optimisation énergétique des bâtiments universitaires par IoT',
  "Déploiement de capteurs IoT (température, luminosité, occupation) dans un bâtiment pilote, collecte des données via MQTT et développement d'un jumeau numérique simplifié pour simuler des scénarios d'économie d'énergie.",
  'IoT, Python, MQTT, Data Visualisation',
  'IoT, Énergie, Capteurs',
  enc3, annee, 1, 'valide'
).lastInsertRowid;

const s5 = insSujet.run(
  'Chatbot pédagogique à base de LLM pour l\'aide aux révisions',
  "Création d'un assistant conversationnel entraîné sur les supports de cours de l'université, capable de répondre aux questions des étudiants, de générer des QCM et d'orienter vers les ressources pertinentes. Intégration RAG et évaluation de la qualité des réponses.",
  'NLP, LLM, RAG, API, Python',
  'IA, Éducation, NLP',
  enc3, annee, 2, 'propose'
).lastInsertRowid;

const s6 = insSujet.run(
  'Modernisation du système de bibliotthèque universitaire',
  "Refonte du catalogue de la bibliothèque : recherche plein texte, réservation d'ouvrages, gestion des emprunts et statistiques de fréquentation.",
  'SQL, API REST, Angular',
  'Web, Gestion, Bibliothèque',
  enc1, annee, 1, 'propose'
).lastInsertRowid;

// Sujet archivé (année précédente)
const sOld = insSujet.run(
  'Portail e-learning de l\'université',
  "Plateforme de cours en ligne avec dépôt de ressources, quiz et suivi de progression (projet de l'année précédente).",
  'PHP, Laravel, MySQL',
  'Web, E-learning',
  enc1, anneePrec, 1, 'archive'
).lastInsertRowid;

// ---- Candidatures ----
const insCand = db.prepare('INSERT INTO candidatures (etudiant_id, sujet_id, ordre_pref, statut, message) VALUES (?,?,?,?,?)');
insCand.run(et1, s1, 1, 'acceptee', 'Très motivé par le développement web full-stack.');
insCand.run(et1, s3, 2, 'refusee', '');
insCand.run(et2, s2, 1, 'acceptee', "Passionnée d'IA et de cybersécurité.");
insCand.run(et3, s1, 1, 'en_attente', "J'ai suivi vos cours de développement web, ce sujet m'intéresse beaucoup.");
insCand.run(et3, s4, 2, 'en_attente', 'Curieux des systèmes embarqués et IoT.');
insCand.run(et4, s3, 1, 'en_attente', 'Expérience en développement mobile avec Flutter.');
insCand.run(et5, s2, 1, 'refusee', '');
insCand.run(et5, s4, 1, 'en_attente', '');

// ---- Projets (découlant des candidatures acceptées) ----
const insProjet = db.prepare('INSERT INTO projets (sujet_id, etudiant_id, encadrant_id, annee_id, statut, progression, date_debut) VALUES (?,?,?,?,?,?,?)');
const p1 = insProjet.run(s1, et1, enc1, annee, 'en_cours', 55, '2026-10-01').lastInsertRowid;
const p2 = insProjet.run(s2, et2, enc2, annee, 'en_cours', 30, '2026-10-05').lastInsertRowid;
const pOld = insProjet.run(sOld, etOld, enc1, anneePrec, 'archive', 100, '2025-10-01').lastInsertRowid;

// ---- Jalons ----
const insJalon = db.prepare('INSERT INTO jalons (projet_id, titre, description, echeance, statut) VALUES (?,?,?,?,?)');
insJalon.run(p1, 'Cahier des charges', 'Analyse des besoins et spécifications fonctionnelles', '2026-10-20', 'termine');
insJalon.run(p1, 'Modélisation UML', 'Diagrammes de cas d\'utilisation, classes et séquence', '2026-11-15', 'termine');
insJalon.run(p1, 'Prototype V1', 'Interface de gestion des conventions fonctionnelle', '2026-12-20', 'en_cours');
insJalon.run(p1, 'Version finale', 'Application complète testée et déployée', '2027-04-30', 'a_faire');
insJalon.run(p2, 'État de l\'art', 'Étude bibliographique sur la détection d\'anomalies', '2026-11-30', 'termine');
insJalon.run(p2, 'Préparation des données', 'Collecte et nettoyage des journaux réseau', '2027-01-15', 'en_cours');
insJalon.run(p2, 'Modélisation', 'Entraînement et évaluation des modèles', '2027-03-30', 'a_faire');

// ---- Livrables (sans fichiers réels dans le seed — urls fictives) ----
const insLiv = db.prepare(`INSERT INTO livrables (projet_id, type, fichier_nom, fichier_url, commentaire_encadrant, commentaire_date)
  VALUES (?,?,?,?,?,?)`);
insLiv.run(p1, 'rapport_avancement', 'cahier-des-charges.pdf', '/uploads/demo-cahier-des-charges.pdf',
  "Très bon document, la modélisation est claire. Pensez à détailler les contraintes de sécurité.", '2026-10-25 10:30:00');
insLiv.run(p1, 'rapport_avancement', 'modelisation-uml.pdf', '/uploads/demo-modelisation-uml.pdf',
  null, null);
insLiv.run(p2, 'rapport_avancement', 'etat-de-l-art.pdf', '/uploads/demo-etat-de-l-art.pdf',
  "État de l'art complet. Ajoutez une comparaison chiffrée des méthodes étudiées.", '2026-12-02 14:12:00');
insLiv.run(pOld, 'memoire_final', 'memoire-portail-elearning.pdf', '/uploads/demo-memoire.pdf',
  'Mémoire bien structuré, félicitations.', '2026-06-10 09:00:00');

// ---- Soutenances ----
db.prepare('INSERT INTO soutenances (projet_id, date, heure, salle, membres_jury) VALUES (?,?,?,?,?)')
  .run(pOld, '2026-06-25', '10:00', 'Amphi A', 'Pr. Belkacem (président), Dr. Amrani (examinateur), M. Mansouri (encadrant)');

// ---- Messages de démonstration ----
const insMsg = db.prepare('INSERT INTO messages (expediteur_id, destinataire_id, projet_id, contenu, lu) VALUES (?,?,?,?,?)');
insMsg.run(enc1, et1, p1, "Bonjour Amine, où en êtes-vous sur le prototype V1 ? Pensez à la gestion des rôles.", 1);
insMsg.run(et1, enc1, p1, "Bonjour Monsieur, l'interface de dépôt des conventions est terminée. Je commence l'espace tuteur cette semaine.", 1);
insMsg.run(enc1, et1, p1, "Parfait. N'oubliez pas le jalon du 20 décembre.", 0);

// ---- Notifications ----
const insNotif = db.prepare('INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?,?,?,?,?)');
insNotif.run(adminId, 'sujet_propose', 'Nouveau sujet proposé', 'Nadia Haddad a proposé « Chatbot pédagogique à base de LLM » pour validation.', '/admin/sujets');
insNotif.run(enc1, 'candidature', 'Nouvelle candidature', 'Yacine Meziane a postulé à votre sujet « Plateforme de gestion des stages ».', '/encadrant/candidatures');
insNotif.run(et1, 'feedback', 'Feedback reçu', 'Votre encadrant a commenté votre livrable « cahier-des-charges.pdf ».', '/etudiant/projet');
insNotif.run(et1, 'jalon', 'Échéance proche', 'Jalon « Prototype V1 » à rendre pour le 20/12/2026.', '/etudiant/projet');

console.log(`✅ Seed terminé :
   - Admin     : admin@univ.dz / admin123
   - Encadrants: k.mansouri@univ.dz, c.dubois@univ.dz, n.haddad@univ.dz / encadrant123
   - Étudiants : a.boumedien@univ.dz (projet en cours), l.saidi@univ.dz (projet en cours),
                 y.meziane@univ.dz, i.ferhat@univ.dz, r.toumi@univ.dz / etudiant123`);
