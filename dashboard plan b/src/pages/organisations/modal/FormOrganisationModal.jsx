import React, { useEffect, useRef } from 'react';
import { CloseCircle, TickCircle } from 'iconsax-react';
import { useOrganisationsContext } from '../context/OrganisationsContext';
import { SECTORS, TYPES, COUNTRIES } from '../data/organisations';
import { BlurryImage } from '../../../components/atoms/BlurryImage';

const FormOrganisationModal = () => {
  const {
    formModal,
    formAnimating,
    closeFormModal,
    modalAlert,
    form,
    formErrors,
    setField,
    handlePhotoChange,
    removePhoto,
    isSubmitting,
    handleSubmit,
  } = useOrganisationsContext();

  const bodyRef = useRef(null);

  useEffect(() => {
    if (modalAlert.message && bodyRef.current) {
      bodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [modalAlert.message]);

  if (!formModal.open) return null;

  const isClosing = formAnimating === 'closing';
  const panelClass = [
    'am-offcanvas-panel',
    isClosing ? 'am-offcanvas-panel--closing' : '',
    formAnimating === 'opening' ? 'am-offcanvas-panel--opening' : '',
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    isClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={closeFormModal} />
      <form
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={formModal.mode === 'create' ? 'Nouvelle organisation' : "Modifier l'organisation"}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="am-offcanvas-header">
          <h5 className="am-offcanvas-title">
            {formModal.mode === 'create' ? 'Nouvelle organisation' : 'Modifier l\'organisation'}
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={closeFormModal}
            disabled={isSubmitting || modalAlert.type === 'success'}
            aria-label="Fermer"
          />
        </div>

        <div className="am-offcanvas-body" ref={bodyRef}>
          {modalAlert.message && (
            <div className={`am-alert am-alert--${modalAlert.type === 'success' ? 'success' : 'danger'}`}>
              {modalAlert.type === 'success' ? (
                <TickCircle size={18} variant="Bold" color="var(--color-success)" />
              ) : (
                <CloseCircle size={18} variant="Bold" color="var(--color-danger)" />
              )}
              <span className="am-alert__message">{modalAlert.message}</span>
            </div>
          )}

              {/* Photo / Avatar */}
              <div className="orgs-photo-section">
                {/* Zone de prévisualisation cliquable */}
                <label htmlFor="org-photo-input" className="orgs-photo-picker">
                  {form.logo_url ? (
                    <BlurryImage src={form.logo_url} alt="Logo organisation" className="orgs-photo-preview" />
                  ) : (
                    <div className="orgs-avatar orgs-avatar-lg" style={{ backgroundColor: form.color }}>
                      {(form.acronym || '?').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="orgs-photo-overlay">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>{form.logo_url ? 'Changer' : 'Ajouter une photo'}</span>
                  </div>
                  <input
                    id="org-photo-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoChange}
                  />
                </label>

                {/* Infos & actions à droite */}
                <div className="orgs-photo-info">
                  <p className="orgs-photo-hint">Logo de l'organisation</p>
                  <p className="orgs-photo-sub">JPG, PNG ou SVG · max 2 Mo</p>
                  <div className="orgs-photo-actions">
                    <label htmlFor="org-photo-input" className="orgs-photo-btn orgs-photo-btn-upload">
                      Choisir une photo
                    </label>
                    {form.logo_url && (
                      <button type="button" className="orgs-photo-btn orgs-photo-btn-remove" onClick={removePhoto}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="orgs-form-grid">
                {/* Nom */}
                <div className="orgs-field">
                  <label>Nom complet *</label>
                  <input
                    type="text"
                    placeholder="Ex. Croix-Rouge Sénégalaise"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    style={formErrors.name ? { borderColor: 'var(--color-danger)' } : {}}
                  />
                  {formErrors.name && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.name}</span>
                  )}
                </div>

                {/* Acronyme */}
                <div className="orgs-field">
                  <label>Acronyme </label>
                  <input
                    type="text"
                    placeholder="Ex. CRS"
                    value={form.acronym}
                    onChange={(e) => setField('acronym', e.target.value.toUpperCase())}
                    maxLength={6}
                    style={formErrors.acronym ? { borderColor: 'var(--color-danger)' } : {}}
                  />
                  {formErrors.acronym && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.acronym}</span>
                  )}
                </div>

                {/* Secteur */}
                <div className="orgs-field">
                  <label>Secteur d'activité *</label>
                  <select value={form.sector} onChange={(e) => setField('sector', e.target.value)} style={formErrors.sector ? { borderColor: 'var(--color-danger)' } : {}}>
                    <option value="">Sélectionner…</option>
                    {SECTORS.map((s) => <option key={s.en} value={s.en}>{s.fr}</option>)}
                  </select>
                  {formErrors.sector && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.sector}</span>
                  )}
                </div>

                {/* Type */}
                <div className="orgs-field">
                  <label>Type *</label>
                  <select value={form.type} onChange={(e) => setField('type', e.target.value)} style={formErrors.type ? { borderColor: 'var(--color-danger)' } : {}}>
                    <option value="">Sélectionner…</option>
                    {TYPES.map((t) => <option key={t.en} value={t.en}>{t.fr}</option>)}
                  </select>
                  {formErrors.type && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.type}</span>
                  )}
                </div>

                {/* Pays */}
                <div className="orgs-field">
                  <label>Pays *</label>
                  <select value={form.country} onChange={(e) => setField('country', e.target.value)} style={formErrors.country ? { borderColor: 'var(--color-danger)' } : {}}>
                    <option value="">Sélectionner…</option>
                    {COUNTRIES.map((c) => <option key={c.en} value={c.en}>{c.fr}</option>)}
                  </select>
                  {formErrors.country && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.country}</span>
                  )}
                </div>

                {/* Email */}
                <div className="orgs-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="contact@org.ml"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    style={formErrors.email ? { borderColor: 'var(--color-danger)' } : {}}
                  />
                  {formErrors.email && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.email}</span>
                  )}
                </div>

                {/* Téléphone */}
                <div className="orgs-field">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    placeholder="+223 00 00 00 00"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    style={formErrors.phone ? { borderColor: 'var(--color-danger)' } : {}}
                  />
                  {formErrors.phone && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.phone}</span>
                  )}
                </div>

                {/* Site web */}
                <div className="orgs-field">
                  <label>Site web</label>
                  <input
                    type="text"
                    placeholder="https://www.organisation.org"
                    value={form.website}
                    onChange={(e) => setField('website', e.target.value)}
                    style={formErrors.website ? { borderColor: 'var(--color-danger)' } : {}}
                  />
                  {formErrors.website && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.website}</span>
                  )}
                </div>

                {/* Statut */}
                <div className="orgs-field">
                  <label>Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setField('status', e.target.value)}
                    style={formErrors.status ? { borderColor: 'var(--color-danger)' } : {}}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {formErrors.status && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.status}</span>
                  )}
                </div>

                {/* Description */}
                <div className="orgs-field full-width">
                  <label>Description</label>
                  <textarea
                    placeholder="Décrivez le mandat et les activités de cette organisation…"
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                    style={formErrors.description ? { borderColor: 'var(--color-danger)' } : {}}
                  />
                  {formErrors.description && (
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-danger)' }}>{formErrors.description}</span>
                  )}
                </div>
              </div>
        </div>

        <div className="am-offcanvas-footer">
          <button
            type="button"
            className="am-btn am-btn--secondary"
            onClick={closeFormModal}
            disabled={isSubmitting || modalAlert.type === 'success'}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="am-btn am-btn--primary"
            disabled={isSubmitting || modalAlert.type === 'success'}
          >
            {isSubmitting && <span className="am-spinner" aria-hidden="true" />}
            {isSubmitting
              ? (formModal.mode === 'create' ? 'Création...' : 'Enregistrement...')
              : (modalAlert.type === 'success' ? 'Succès !' : (formModal.mode === 'create' ? 'Créer l\'organisation' : 'Enregistrer les modifications'))
            }
          </button>
        </div>
      </form>
    </>
  );
};

export default FormOrganisationModal;
