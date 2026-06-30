import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sms } from 'iconsax-react';
import { authService } from './services/authService';
import logoMapAction from '../../assets/logo.svg';
import loginBg from '../../assets/login_bg.png';
import './login.css';
import './forgot-password.css';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.requestPasswordReset(email);
      console.log('[FORGOT_PASSWORD] Succès:', response);
      setSuccess(true);
      // Rediriger vers la page de réinitialisation avec l'email
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      console.error('[FORGOT_PASSWORD] Erreur:', err);
      setError(
        err?.detail || 
        err?.message || 
        'Une erreur est survenue. Veuillez vérifier votre adresse e-mail.'
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
                <p className="login-kicker">Récupération de compte</p>
                <h1 className="login-heading">Mot de passe oublié ?</h1>
                <p className="fp-description">
                  Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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

                <div className="field">
                  <label className="field-label">Adresse e-mail</label>
                  <div className="field-input">
                    <input
                      type="email"
                      placeholder="exemple@domaine.ml"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                    <Sms size={20} variant="Linear" color="#6C7278" />
                  </div>
                </div>

                <button type="submit" className="login-submit" disabled={isLoading}>
                  {isLoading ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
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
              <h2 className="fp-success-title">E-mail envoyé !</h2>
              <p className="fp-success-text">
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                Consultez votre boîte de réception et cliquez sur le lien pour définir un nouveau mot de passe.
              </p>
              <p className="fp-success-hint">
                Vous ne trouvez pas l'e-mail ? Vérifiez vos spams.
              </p>
              <button
                type="button"
                className="login-submit"
                onClick={() => navigate('/login')}
              >
                Retour à la connexion
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

export default ForgotPassword;
