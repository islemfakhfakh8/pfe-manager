import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import './src/db.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import anneeRoutes from './routes/annees.js';
import sujetRoutes from './routes/sujets.js';
import candidatureRoutes from './routes/candidatures.js';
import projetRoutes from './routes/projets.js';
import livrableRoutes from './routes/livrables.js';
import soutenanceRoutes from './routes/soutenances.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'PFE API' }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'PFE API' }));

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/annees', anneeRoutes);
app.use('/api/sujets', sujetRoutes);
app.use('/api/candidatures', candidatureRoutes);
app.use('/api/projets', projetRoutes);
app.use('/api/livrables', livrableRoutes);
app.use('/api/soutenances', soutenanceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Route introuvable' }));
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

// Gestion centrale des erreurs
app.use((err, req, res, next) => {
  if (err?.name === 'MulterError' || /fichier|Type de fichier/i.test(err?.message || '')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`✅ API PFE démarrée sur http://localhost:${PORT}`);
});
