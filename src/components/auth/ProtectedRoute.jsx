import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../pages/auth/services/authService';
import { canAccessPath, isKnownWebRole } from '../../utils/permissions';
import { logger } from '../../utils/logger';

/**
 * Composant qui protège les routes en vérifiant l'authentification et les autorisations.
 * Si l'utilisateur n'est pas connecté, redirige vers /login.
 * Si l'utilisateur tente d'accéder à une route non autorisée (ex: admin accédant à incidents),
 * le renvoie vers la dernière route autorisée visitée.
 */
export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirige vers login en sauvegardant la page demandée
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = authService.getCurrentUser();

  // Un rôle web non reconnu n'a rien à faire dans le dashboard.
  if (!isKnownWebRole(user)) {
    logger.warn(`[ProtectedRoute] Accès refusé : web_role "${user?.web_role}" non autorisé.`);
    authService.logout();
    return (
      <Navigate
        to="/login"
        state={{ error: "Vous n'avez pas l'autorisation d'accéder à cette application." }}
        replace
      />
    );
  }

  const currentPath = location.pathname;

  if (!canAccessPath(user, currentPath)) {
    const lastSafePath = sessionStorage.getItem('last_safe_path') || '/dashboard';
    logger.warn(`[ProtectedRoute] Accès refusé à ${currentPath}. Redirection vers ${lastSafePath}`);
    return <Navigate to={lastSafePath} replace />;
  }

  // Sauvegarder la dernière route autorisée visitée
  sessionStorage.setItem('last_safe_path', currentPath);

  return children;
};

export default ProtectedRoute;
