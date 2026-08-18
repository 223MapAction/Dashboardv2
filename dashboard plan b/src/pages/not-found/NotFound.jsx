import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft2, Home3, Warning2 } from 'iconsax-react';
import './not-found.css';

export const NotFound = ({ message, showBackToHome = true }) => {
  const navigate = useNavigate();
  const isAuthenticated = !!sessionStorage.getItem('user_id');

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="not-found-container">
      {/* Dynamic blurred background shapes */}
      <div className="not-found-blob not-found-blob-1"></div>
      <div className="not-found-blob not-found-blob-2"></div>

      <div className="not-found-card">
        <div className="not-found-illustration">
          <h1 className="not-found-code">404</h1>

        </div>

        <h2 className="not-found-title">Page Introuvable</h2>
        <p className="not-found-description">
          {message || "Désolé, la page que vous recherchez n'existe pas ou les données associées ne sont plus disponibles."}
        </p>

        <div className="not-found-actions">
          <button
            type="button"
            className="btn btn-secondary not-found-btn not-found-btn-secondary"
            onClick={handleGoBack}
          >
            <ArrowLeft2 size={16} variant="Linear" color='var(--color-text-secondary)' />
            Retour
          </button>

          {showBackToHome && (
            <button
              type="button"
              className="btn btn-primary not-found-btn not-found-btn-primary"
              onClick={handleGoHome}
            >
              <Home3 size={16} variant="Bold" color='var(--color-surface)' />
              {isAuthenticated ? "Accueil" : "Connexion"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
