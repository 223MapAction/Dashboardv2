import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../pages/auth/services/authService';

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
  const webRole = user?.web_role;

  // 1. Si l'utilisateur est super_admin (web_role === 'super_admin'), il a accès à toutes les pages
  const isSuperAdmin = webRole === 'super_admin';

  // 2. Si le rôle web n'est pas autorisé, on refuse l'accès
  if (!isSuperAdmin && webRole !== 'org_admin' && webRole !== 'bureau_agent') {
    console.warn(`[ProtectedRoute] Accès refusé : web_role ${webRole} n'est pas autorisé.`);
    authService.logout();
    return <Navigate to="/login" state={{ error: "Vous n'avez pas l'autorisation d'accéder à cette application." }} replace />;
  }

  // Définir les chemins autorisés pour l'admin
  const allowedPathsForAdmin = [
    '/dashboard',
    '/collaboration',
    '/collaboration-detail',
    '/incidents',
    '/mes-interventions',
    '/agents',
    '/profile',
    '/impact'
  ];

  const currentPath = location.pathname;

  const isUnauthorized =
    !isSuperAdmin &&
    (webRole === 'org_admin' || webRole === 'bureau_agent') &&
    !allowedPathsForAdmin.some(allowed => currentPath.startsWith(allowed));

  if (isUnauthorized) {
    const lastSafePath = sessionStorage.getItem('last_safe_path') || '/dashboard';
    console.warn(`[ProtectedRoute] Accès refusé à ${currentPath} pour l'admin. Redirection vers ${lastSafePath}`);
    return <Navigate to={lastSafePath} replace />;
  }

  // Sauvegarder la dernière route autorisée visitée
  sessionStorage.setItem('last_safe_path', currentPath);

  return children;
};

export default ProtectedRoute;
