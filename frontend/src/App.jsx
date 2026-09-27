import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Messages from './pages/Messages.jsx';
import Profile from './pages/Profile.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminAnnees from './pages/admin/Annees.jsx';
import AdminSujets from './pages/admin/Sujets.jsx';
import AdminProjets from './pages/admin/Projets.jsx';
import AdminSoutenances from './pages/admin/Soutenances.jsx';
import AdminRapports from './pages/admin/Rapports.jsx';

import EncDashboard from './pages/encadrant/Dashboard.jsx';
import EncSujets from './pages/encadrant/Sujets.jsx';
import EncCandidatures from './pages/encadrant/Candidatures.jsx';
import EncProjets from './pages/encadrant/Projets.jsx';
import EncProjetDetail from './pages/encadrant/ProjetDetail.jsx';
import EncSoutenances from './pages/encadrant/Soutenances.jsx';

import EtuDashboard from './pages/etudiant/Dashboard.jsx';
import EtuSujets from './pages/etudiant/Sujets.jsx';
import EtuCandidatures from './pages/etudiant/Candidatures.jsx';
import EtuProjet from './pages/etudiant/Projet.jsx';
import EtuSoutenance from './pages/etudiant/Soutenance.jsx';

function RoleRoute({ role, children }) {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<HomeRedirect />} />
        <Route path="profile" element={<Profile />} />
        <Route path="messages" element={<Messages />} />

        <Route path="admin" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
        <Route path="admin/users" element={<RoleRoute role="admin"><AdminUsers /></RoleRoute>} />
        <Route path="admin/annees" element={<RoleRoute role="admin"><AdminAnnees /></RoleRoute>} />
        <Route path="admin/sujets" element={<RoleRoute role="admin"><AdminSujets /></RoleRoute>} />
        <Route path="admin/projets" element={<RoleRoute role="admin"><AdminProjets /></RoleRoute>} />
        <Route path="admin/soutenances" element={<RoleRoute role="admin"><AdminSoutenances /></RoleRoute>} />
        <Route path="admin/rapports" element={<RoleRoute role="admin"><AdminRapports /></RoleRoute>} />

        <Route path="encadrant" element={<RoleRoute role="encadrant"><EncDashboard /></RoleRoute>} />
        <Route path="encadrant/sujets" element={<RoleRoute role="encadrant"><EncSujets /></RoleRoute>} />
        <Route path="encadrant/candidatures" element={<RoleRoute role="encadrant"><EncCandidatures /></RoleRoute>} />
        <Route path="encadrant/projets" element={<RoleRoute role="encadrant"><EncProjets /></RoleRoute>} />
        <Route path="encadrant/projets/:id" element={<RoleRoute role="encadrant"><EncProjetDetail /></RoleRoute>} />
        <Route path="encadrant/soutenances" element={<RoleRoute role="encadrant"><EncSoutenances /></RoleRoute>} />

        <Route path="etudiant" element={<RoleRoute role="etudiant"><EtuDashboard /></RoleRoute>} />
        <Route path="etudiant/sujets" element={<RoleRoute role="etudiant"><EtuSujets /></RoleRoute>} />
        <Route path="etudiant/candidatures" element={<RoleRoute role="etudiant"><EtuCandidatures /></RoleRoute>} />
        <Route path="etudiant/projet" element={<RoleRoute role="etudiant"><EtuProjet /></RoleRoute>} />
        <Route path="etudiant/soutenance" element={<RoleRoute role="etudiant"><EtuSoutenance /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
