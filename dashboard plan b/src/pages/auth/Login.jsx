import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sms, Eye, EyeSlash } from 'iconsax-react';
import logoMapAction from '../../assets/logo.webp';
import loginBg from '../../assets/login_bg_1.webp';
import { authService } from './services/authService';
import './login.css';

export const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(location.state?.error || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('[LOGIN] Credentials envoyés:', { email, password: password });

    try {
      const result = await authService.login({ email, password });

      if (result.success) {
        // Appelle le callback onLogin si fourni
        onLogin && onLogin(result.user);

        // Redirige vers la page demandée ou le dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(
        typeof err === 'string'
          ? err
          : err?.detail || 'Erreur de connexion. Vérifiez vos identifiants.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split">
      {/* Colonne gauche - Formulaire */}
      <div className="login-side">


        <div className="login-content">
          <img src={logoMapAction} alt="Map Action" className="login-brand-logo" />

          <div className="login-intro">
            <p className="login-kicker">Bienvenue</p>
            <h1 className="login-heading">Connectez-vous à Map Action</h1>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error" style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            <div className="field">
              <label className="field-label">E-mail</label>
              <div className="field-input">
                <input
                  type="email"
                  placeholder="exemple@domaine.ml"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Sms size={20} variant="Linear" color="#6C7278" />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Mot de passe</label>
              <div className="field-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="field-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeSlash size={20} variant="Linear" color="#6C7278" />
                  ) : (
                    <Eye size={20} variant="Linear" color="#6C7278" />
                  )}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">Mot de passe oublié ?</Link>
            </div>

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>

      {/* Colonne droite - Image */}
      <div
        className="login-hero"
        style={{ backgroundImage: `url(${loginBg})` }}
        aria-hidden="true"
      />
    </div>
  );
};

export default Login;
