import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login, ForgotPassword, ResetPassword } from './pages/auth';
import { Dashboard } from './pages/dashboard';
import { Collaboration } from './pages/collaboration';
import { CollaborationDetail } from './pages/collaboration-detail';
import { Incident, IncidentDetailPage } from './pages/incident';
import { Impact } from './pages/impact';
import { Profile } from './pages/profile';
import { TrashPage } from './pages/trash';
import { Organisations } from './pages/organisations';
import { Agents } from './pages/agents';
import { MesInterventions } from './pages/mes-interventions';
import { ProtectedRoute } from './components/auth';
import { authService } from './pages/auth/services/authService';
import { NotFound } from './pages/not-found';


function App() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Vérifie l'authentification au chargement de l'app
  useEffect(() => {
    authService.isAuthenticated();
    setIsAuthChecked(true);
  }, []);

  if (!isAuthChecked) {
    return null; // ou un loader
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Route publique - Login */}
        <Route path="/login" element={<Login onLogin={() => {}} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Routes protégées */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collaboration"
          element={
            <ProtectedRoute>
              <Collaboration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collaboration/:id"
          element={
            <ProtectedRoute>
              <CollaborationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collaboration-detail/:id"
          element={
            <ProtectedRoute>
              <CollaborationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <Incident />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/:id"
          element={
            <ProtectedRoute>
              <IncidentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mes-interventions"
          element={
            <ProtectedRoute>
              <MesInterventions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/impact"
          element={
            <ProtectedRoute>
              <Impact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trash"
          element={
            <ProtectedRoute>
              <TrashPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organisations"
          element={
            <ProtectedRoute>
              <Organisations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agents"
          element={
            <ProtectedRoute>
              <Agents />
            </ProtectedRoute>
          }
        />

        {/* Redirections & 404 */}
        <Route path="/404" element={<NotFound />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
