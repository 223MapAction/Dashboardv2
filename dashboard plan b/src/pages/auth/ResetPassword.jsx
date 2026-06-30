import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeSlash, Lock } from 'iconsax-react';
import logoMapAction from '../../assets/logo.svg';
import loginBg from '../../assets/login_bg.png';
import { authService } from './services/authService';
import './login.css';
import './forgot-password.css';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Calcul de la force du mot de passe
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'Faible' };
    if (score === 2) return { level: 2, label: 'Moyen' };
    if (score === 3) return { level: 3, label: 'Bon' };
    return { level: 4, label: 'Fort' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Adresse e-mail requise.');
      return;
    }

    if (!code) {
      setError('Code de vérification requis.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.confirmPasswordReset({ 
        email, 
        code, 
        new_password: password 
      });
      console.log('[RESET_PASSWORD] Succès:', response);
      setSuccess(true);
    } catch (err) {
      console.error('[RESET_PASSWORD] Erreur:', err);
      setError(
        err?.detail || 
        err?.message || 
        'Une erreur est survenue. Le code est peut-être invalide ou expiré.'
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

          {!success ? (
            <>
              <div className="login-intro">
                <p className="login-kicker">Dernière étape</p>
                <h1 className="login-heading">Créer un nouveau mot de passe</h1>
                <p className="fp-description">
                  Entrez le code reçu par e-mail et choisissez un mot de passe sécurisé d'au moins 8 caractères.
                </p>
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

                {/* Champ email */}
                <div className="field">
                  <label className="field-label">Adresse e-mail</label>
                  <div className="field-input">
                    <input
                      type="email"
                      placeholder="exemple@domaine.ml"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      readOnly={!!emailFromUrl}
                      style={emailFromUrl ? { backgroundColor: 'var(--color-background)' } : {}}
                    />
                    <Lock size={20} variant="Linear" color="#6C7278" />
                  </div>
                </div>

                {/* Champ code de vérification */}
                <div className="field">
                  <label className="field-label">Code de vérification</label>
                  <div className="field-input">
                    <input
                      type="text"
                      placeholder="Entrez le code reçu par e-mail"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      autoFocus={!!emailFromUrl}
                      maxLength={6}
                      style={{ letterSpacing: '0.1em' }}
                    />
                    <Lock size={20} variant="Linear" color="#6C7278" />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    Vérifiez votre boîte de réception et vos spams
                  </p>
                </div>

                {/* Champ nouveau mot de passe */}
                <div className="field">
                  <label className="field-label">Nouveau mot de passe</label>
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

                  {/* Barre de force */}
                  {password && (
                    <div className="rp-strength">
                      <div className="rp-strength-bars">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`rp-strength-bar ${bar <= strength.level ? `rp-strength-bar--${strength.level}` : ''}`}
                          />
                        ))}
                      </div>
                      <span className={`rp-strength-label rp-strength-label--${strength.level}`}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Champ confirmation */}
                <div className="field">
                  <label className="field-label">Confirmer le mot de passe</label>
                  <div className={`field-input ${confirmPassword && confirmPassword !== password ? 'field-input--error' : ''}`}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="field-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showConfirmPassword ? (
                        <EyeSlash size={20} variant="Linear" color="#6C7278" />
                      ) : (
                        <Eye size={20} variant="Linear" color="#6C7278" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="rp-match-error">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="login-submit"
                  disabled={isLoading || (confirmPassword && confirmPassword !== password)}
                >
                  {isLoading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
                </button>

                <button
                  type="button"
                  className="fp-back-link"
                  onClick={() => navigate('/login')}
                >
                  ← Retour à la connexion
                </button>
              </form>
            </>
          ) : (
            <div className="fp-success">
              <div className="fp-success-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="rgba(58,162,221,0.12)" />
                  <path
                    d="M14 24l7 7 13-13"
                    stroke="var(--color-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="fp-success-title">Mot de passe mis à jour !</h2>
              <p className="fp-success-text">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <button
                type="button"
                className="login-submit"
                onClick={() => navigate('/login')}
              >
                Se connecter
              </button>
            </div>
          )}
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

export default ResetPassword;
