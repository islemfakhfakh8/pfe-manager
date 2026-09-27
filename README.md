# 🎓 PFE Manager — Suivi et Gestion des Projets de Fin d'Études

Application web complète de gestion des PFE pour une université, avec trois rôles :
**Administrateur**, **Encadrant** (enseignant) et **Étudiant**.

## Stack technique

| Couche     | Technologie                                              |
|------------|----------------------------------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS v4 + React Router + Axios |
| Backend    | Node.js + Express (API RESTful, ES modules)              |
| Base       | SQLite via `better-sqlite3` (fichier `backend/data/pfe.db`) |
| Auth       | JWT (7 jours) + bcryptjs, gestion des rôles              |
| Uploads    | Multer (fichiers stockés dans `backend/uploads/`)        |
| Exports    | ExcelJS (exports `.xlsx`)                                |

> **Note base de données** : ni MongoDB ni PostgreSQL n'étant installés sur cette machine,
> l'application utilise **SQLite** (zéro configuration, même schéma relationnel).
> Le modèle de données (tables `users`, `sujets`, `candidatures`, `projets`, `jalons`,
> `livrables`, `soutenances`, `messages`, `notifications`, `annees`) correspond exactement
> aux entités demandées et peut être porté vers MongoDB/PostgreSQL sans changer l'API.

## Démarrage rapide

### 1. Backend (port 5000)

```bash
cd backend
npm install
npm run seed     # peuple la base avec des données de démonstration (1 seule fois)
npm start        # ou: npm run dev (rechargement auto)
```

### 2. Frontend (port 3000, proxy /api et /uploads vers le backend)

```bash
cd frontend
npm install
npm run dev
```

Ouvrir **http://localhost:3000**.

## Comptes de démonstration

| Rôle                        | Email                | Mot de passe   |
|-----------------------------|----------------------|----------------|
| Administrateur              | `admin@univ.dz`      | `admin123`     |
| Encadrant                   | `k.mansouri@univ.dz` | `encadrant123` |
| Encadrant                   | `c.dubois@univ.dz`   | `encadrant123` |
| Encadrant                   | `n.haddad@univ.dz`   | `encadrant123` |
| Étudiant (projet en cours)  | `a.boumedien@univ.dz`| `etudiant123`  |
| Étudiant (projet en cours)  | `l.saidi@univ.dz`    | `etudiant123`  |
| Étudiant (candidatures)     | `y.meziane@univ.dz`  | `etudiant123`  |
| Étudiant (candidatures)     | `i.ferhat@univ.dz`   | `etudiant123`  |
| Étudiant (sans candidature) | `r.toumi@univ.dz`    | `etudiant123`  |

La page de connexion propose des boutons pour pré-remplir ces comptes.

Pour réinitialiser les données : supprimer `backend/data/pfe.db` puis relancer `npm run seed`.

## Fonctionnalités par rôle

### Administrateur
- Créer / modifier / désactiver / supprimer les comptes (encadrants, étudiants, admins)
- Définir et activer les années universitaires (périodes de campagne PFE)
- Valider ou rejeter les sujets proposés par les encadrants
- Consulter tous les projets, ajuster progression/statut, archiver
- Planifier les soutenances (date, heure, salle, jury)
- Statistiques globales (projets, candidatures, charge par encadrant, progression moyenne)
- Exports Excel (projets, utilisateurs) + historique/archives des PFE passés

### Encadrant
- Proposer / modifier / supprimer des sujets (titre, description, compétences, mots-clés, places)
- Consulter les candidatures sur ses sujets, accepter ou refuser (crée le projet)
- Suivre l'avancement : progression, jalons (créer / faire avancer / supprimer)
- Consulter les livrables déposés et laisser un feedback
- Voir le planning des soutenances de ses étudiants
- Messagerie avec ses étudiants

### Étudiant
- Parcourir les sujets validés avec filtres (recherche, domaine/mots-clés, encadrant)
- Postuler à plusieurs sujets par ordre de préférence, annuler une candidature en attente
- Suivre le statut de chaque candidature (en attente / acceptée / refusée)
- Timeline du PFE (sujet validé → candidature → avancement → livrables → soutenance)
- Déposer des livrables (upload de fichiers) à chaque étape
- Consulter le feedback de l'encadrant sur chaque livrable
- Voir date / heure / salle / jury de sa soutenance
- Messagerie avec son encadrant

### Transverse
- Messagerie interne étudiant ↔ encadrant (contrainte : uniquement entre binômes)
- Notifications (nouvelle candidature, acceptation/refus, feedback, soutenance, message…)
- Tableau de bord adapté à chaque rôle
- Archives des PFE des années précédentes
- Interface responsive (mobile & desktop)

## Structure du projet

```
.
├── backend/
│   ├── server.js              # Point d'entrée Express + gestion d'erreurs
│   ├── src/
│   │   ├── db.js              # Schéma SQLite (toutes les entités)
│   │   ├── seed.js            # Données de démonstration
│   │   ├── auth.js            # JWT, middleware authRequired / requireRole
│   │   └── helpers.js         # Notifications, helpers
│   ├── routes/
│   │   ├── auth.js  users.js  annees.js  sujets.js  candidatures.js
│   │   ├── projets.js  livrables.js  soutenances.js  messages.js
│   │   ├── notifications.js  admin.js (stats + exports)
│   ├── uploads/               # Fichiers déposés
│   └── data/pfe.db            # Base SQLite (créée au 1er lancement)
└── frontend/
    ├── vite.config.js         # Proxy /api + /uploads vers :5000
    └── src/
        ├── api.js             # Client Axios + intercepteurs JWT
        ├── context/AuthContext.jsx
        ├── components/        # Layout (sidebar, notifications), UI réutilisable
        └── pages/
            ├── Login.jsx  Messages.jsx  Profile.jsx
            ├── admin/         # Dashboard, Users, Annees, Sujets, Projets, Soutenances, Rapports
            ├── encadrant/     # Dashboard, Sujets, Candidatures, Projets, ProjetDetail, Soutenances
            └── etudiant/      # Dashboard, Sujets, Candidatures, Projet, Soutenance
```

## API REST (extraits)

- `POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/change-password`
- `GET|POST /api/users` · `PUT|DELETE /api/users/:id` (admin)
- `GET|POST /api/annees` · `PATCH /api/annees/:id/activer` (admin)
- `GET|POST /api/sujets` · `PUT|DELETE /api/sujets/:id` · `PATCH /api/sujets/:id/statut` (validation admin)
- `GET|POST /api/candidatures` · `PATCH /api/candidatures/:id/decision` · `PATCH /:id/annuler`
- `GET /api/projets` · `GET /api/projets/mon-projet` · `PATCH /api/projets/:id`
- `GET|POST /api/projets/:id/jalons` · `PATCH|DELETE /api/projets/jalons/:jalonId`
- `POST /api/livrables` (multipart) · `GET /api/livrables/projet/:id` · `PATCH /api/livrables/:id/feedback`
- `GET|POST|DELETE /api/soutenances` · `GET /api/soutenances/ma-soutenance`
- `GET /api/messages/conversations` · `GET /api/messages/avec/:userId` · `POST /api/messages`
- `GET /api/notifications` · `PATCH /api/notifications/:id/lu` · `PATCH /api/notifications/tout-lire`
- `GET /api/admin/stats` · `GET /api/admin/export/projets.xlsx` · `GET /api/admin/export/utilisateurs.xlsx`

Toutes les routes (hors login) exigent un jeton `Authorization: Bearer <token>` ;
les routes sensibles vérifient le rôle (`requireRole`).
