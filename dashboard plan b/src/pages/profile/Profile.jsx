import React, { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import {
  User,
  Sms,
  Call,
  Location,
  Calendar,
  Edit2,
  Camera,
  Lock1,
  Eye,
  EyeSlash,
  Buildings2,
  Briefcase,
  Global,
  TickCircle,
  CloseCircle,
  Setting2,
  ArrowRight2
} from 'iconsax-react';
import { Header, Sidebar } from '../../components/layout';
import { authService } from '../auth/services/authService';
import { getUserProfileService, updateUserProfileService } from './service/profile_service';
import { BlurryImage } from '../../components/atoms/BlurryImage';
import './profile.css';

const TABS = [
  { id: 'personal', label: 'Informations personnelles', icon: User },
  { id: 'organisation', label: 'Organisation', icon: Buildings2 },
  { id: 'security', label: 'Sécurité', icon: Lock1 }
];

const getInitialProfile = () => {
  try {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du profil dans sessionStorage:', error);
  }

  // Fallback par défaut si aucune donnée utilisateur n'est trouvée
  return {
    id: null,
    organisation_name: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    date_joined: "",
    avatar: null,
    address: "",
    user_type: "",
    org_role: ""
  };
};

export const Profile = () => {
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();

  const userId = sessionStorage.getItem('user_id');

  const { data: userProfile, mutate } = useSWR(
    userId ? `/MapApi/user/${userId}/` : null,
    () => getUserProfileService(userId),
    {
      revalidateOnFocus: false,
    }
  );

  const [profile, setProfile] = useState(getInitialProfile);
  const [draft, setDraft] = useState(getInitialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [savedFlash, setSavedFlash] = useState(false);
  const fileInputRef = useRef(null);

  // Synchroniser l'état local avec les données chargées par SWR
  useEffect(() => {
    if (userProfile) {
      const normalizedProfile = {
        ...userProfile,
        address: userProfile.address || userProfile.adress || '',
      };
      setProfile(normalizedProfile);
      if (!isEditing) {
        setDraft(normalizedProfile);
      }
    }
  }, [userProfile, isEditing]);

  // Password
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({
    current: false,
    next: false,
    confirm: false
  });
  const [pwdMessage, setPwdMessage] = useState(null);

  const handleField = (key, value) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setDraft((d) => ({ ...d, avatar: ev.target?.result }));
    reader.readAsDataURL(file);
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!userId) return;
    setIsSaving(true);
    try {
      const payload = {
        first_name: draft.first_name,
        last_name: draft.last_name,
        email: draft.email,
        adress: draft.address,
        address: draft.address,
      };

      if (draft.avatar && draft.avatar !== profile.avatar) {
        payload.avatar = draft.avatar;
      }

      const updatedProfile = await updateUserProfileService(userId, payload);
      const currentUser = authService.getCurrentUser() || {};
      const normalizedUpdated = {
        ...currentUser,
        ...updatedProfile,
        address: updatedProfile.address || updatedProfile.adress || '',
      };

      // Mettre à jour sessionStorage
      sessionStorage.setItem('user', JSON.stringify(normalizedUpdated));
      if (normalizedUpdated.first_name) {
        sessionStorage.setItem('first_name', normalizedUpdated.first_name);
      }
      if (normalizedUpdated.address) {
        sessionStorage.setItem('zone', normalizedUpdated.address);
      }

      // Mettre à jour le cache SWR local
      await mutate(normalizedUpdated, { revalidate: false });

      setProfile(normalizedUpdated);
      setIsEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2400);
    } catch (err) {
      console.error('Erreur lors de la modification du profil:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwd.next.length < 8) {
      setPwdMessage({
        type: 'error',
        text: 'Le mot de passe doit contenir au moins 8 caractères.'
      });
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdMessage({
        type: 'error',
        text: 'Les mots de passe ne correspondent pas.'
      });
      return;
    }

    setIsChangingPwd(true);
    setPwdMessage(null);

    try {
      await authService.changePassword({
        old_password: pwd.current,
        new_password: pwd.next
      });

      setPwdMessage({
        type: 'success',
        text: 'Mot de passe mis à jour avec succès.'
      });
      setPwd({ current: '', next: '', confirm: '' });
    } catch (error) {
      setPwdMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erreur lors de la modification du mot de passe.'
      });
    } finally {
      setIsChangingPwd(false);
      setTimeout(() => setPwdMessage(null), 3000);
    }
  };

  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''
    }`.toUpperCase();

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="profile-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div
        className={`profile-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''
          }`}
      >
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="profile-content">
          <div className="profile-page">
            {/* Page header */}
            <div className="profile-page-header">
              <div>
                <h1 className="profile-title">Mon profil</h1>
                <p className="profile-subtitle">
                  Gérez vos informations personnelles, votre organisation et la
                  sécurité de votre compte.
                </p>
              </div>
              {savedFlash && (
                <div className="profile-flash">
                  <TickCircle size={18} variant="Bold" color="var(--color-success-text)" />
                  Modifications enregistrées
                </div>
              )}
            </div>

            {/* Banner card */}
            <section className="profile-banner">
              <div className="profile-banner-cover" />
              <div className="profile-banner-content">
                <div className="profile-avatar-wrap">
                  <div className="profile-avatar-large">
                    {draft.avatar || draft.logo || draft.logo_url ? (
                      <BlurryImage src={draft.avatar || draft.logo || draft.logo_url} alt="Avatar/Logo" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="profile-avatar-edit"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Changer la photo de profil"
                  >
                    <Camera size={16} variant="Bold" color="var(--color-surface)" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className="profile-banner-info">
                  <h2 className="profile-banner-name">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className="profile-banner-role">
                    {profile.org_role} · {profile.organisation_name}
                  </p>
                  <div className="profile-banner-meta">
                    <span>
                      <Sms size={14} variant="Bold" color="var(--color-text-secondary)" />
                      {profile.email}
                    </span>
                    <span>
                      <Location size={14} variant="Bold" color="var(--color-text-secondary)" />
                      {profile.address || '—'}
                    </span>
                    <span>
                      <Calendar size={14} variant="Bold" color="var(--color-text-secondary)" />
                      Membre depuis {formatDate(profile.date_joined)}
                    </span>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    className="profile-btn profile-btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 size={16} variant="Bold" color="var(--color-surface)" />
                    Modifier
                  </button>
                ) : (
                  <div className="profile-banner-actions">
                    <button
                      type="button"
                      className="profile-btn profile-btn-ghost"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="profile-btn profile-btn-primary"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <TickCircle
                        size={16}
                        variant="Bold"
                        color="var(--color-surface)"
                      />
                      {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Tabs + content */}
            <div className="profile-tabs-layout">
              <aside className="profile-tabs">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`profile-tab ${activeTab === t.id ? 'is-active' : ''
                        }`}
                      onClick={() => setActiveTab(t.id)}
                    >
                      <Icon size={18} variant="Bold" color="currentColor" />
                      <span>{t.label}</span>
                      <ArrowRight2
                        size={14}
                        variant="Linear"
                        color="currentColor"
                      />
                    </button>
                  );
                })}
              </aside>

              <section className="profile-tab-content">
                {/* PERSONAL */}
                {activeTab === 'personal' && (
                  <form
                    className="profile-form"
                    onSubmit={handleSave}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      e.target.tagName !== 'TEXTAREA' &&
                      e.preventDefault()
                    }
                  >
                    <h3 className="profile-section-title">
                      Informations personnelles
                    </h3>

                    <div className="profile-grid">
                      <div className="profile-field">
                        <label htmlFor="firstName">Prénom</label>
                        <input
                          id="firstName"
                          type="text"
                          value={draft.first_name || ''}
                          disabled={!isEditing}
                          onChange={(e) =>
                            handleField('first_name', e.target.value)
                          }
                        />
                      </div>
                      <div className="profile-field">
                        <label htmlFor="lastName">Nom</label>
                        <input
                          id="lastName"
                          type="text"
                          value={draft.last_name || ''}
                          disabled={!isEditing}
                          onChange={(e) =>
                            handleField('last_name', e.target.value)
                          }
                        />
                      </div>
                      <div className="profile-field">
                        <label htmlFor="email">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={draft.email || ''}
                          disabled={!isEditing}
                          onChange={(e) =>
                            handleField('email', e.target.value)
                          }
                        />
                      </div>

                      <div className="profile-field profile-field-full">
                        <label htmlFor="address">
                          Adresse
                        </label>
                        <input
                          id="address"
                          type="text"
                          value={draft.address || ''}
                          disabled={!isEditing}
                          onChange={(e) =>
                            handleField('address', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </form>
                )}

                {/* ORGANISATION */}
                {activeTab === 'organisation' && (
                  <form className="profile-form" onSubmit={handleSave}>
                    <h3 className="profile-section-title">Organisation</h3>
                    <div className="profile-grid">
                      <div className="profile-field profile-field-full">
                        <label htmlFor="organisation">

                          Organisation
                        </label>
                        <input
                          id="organisation"
                          type="text"
                          value={draft.organisation_name || ''}
                          disabled={!isEditing}
                          onChange={(e) =>
                            handleField('organisation_name', e.target.value)
                          }
                        />
                      </div>

                      <div className="profile-field">
                        <label htmlFor="joinedAt">Date d'arrivée</label>
                        <input
                          id="joinedAt"
                          type="text"
                          value={formatDate(draft.date_joined) || ''}
                          disabled
                        />
                      </div>
                    </div>
                  </form>
                )}

                {/* SECURITY */}
                {activeTab === 'security' && (
                  <form
                    className="profile-form"
                    onSubmit={handleChangePassword}
                  >
                    <h3 className="profile-section-title">
                      Changer le mot de passe
                    </h3>
                    <p className="profile-section-hint">
                      Utilisez au moins 8 caractères avec un mélange de
                      lettres, chiffres et symboles.
                    </p>

                    {pwdMessage && (
                      <div
                        className={`profile-alert ${pwdMessage.type === 'success'
                          ? 'is-success'
                          : 'is-error'
                          }`}
                      >
                        {pwdMessage.type === 'success' ? (
                          <TickCircle
                            size={18}
                            variant="Bold"
                            color="var(--color-success-text)"
                          />
                        ) : (
                          <CloseCircle
                            size={18}
                            variant="Bold"
                            color="var(--color-danger-text)"
                          />
                        )}
                        {pwdMessage.text}
                      </div>
                    )}

                    <div className="profile-grid">
                      {[
                        { id: 'current', label: 'Mot de passe actuel' },
                        { id: 'next', label: 'Nouveau mot de passe' },
                        { id: 'confirm', label: 'Confirmer le mot de passe' }
                      ].map((p) => (
                        <div
                          key={p.id}
                          className="profile-field profile-field-full"
                        >
                          <label htmlFor={`pwd-${p.id}`}>{p.label}</label>
                          <div className="profile-password-wrap">
                            <input
                              id={`pwd-${p.id}`}
                              type={showPwd[p.id] ? 'text' : 'password'}
                              value={pwd[p.id]}
                              onChange={(e) =>
                                setPwd((s) => ({
                                  ...s,
                                  [p.id]: e.target.value
                                }))
                              }
                              placeholder="••••••••"
                              required
                            />
                            <button
                              type="button"
                              className="profile-password-toggle"
                              onClick={() =>
                                setShowPwd((s) => ({
                                  ...s,
                                  [p.id]: !s[p.id]
                                }))
                              }
                              aria-label={
                                showPwd[p.id] ? 'Masquer' : 'Afficher'
                              }
                            >
                              {showPwd[p.id] ? (
                                <EyeSlash
                                  size={18}
                                  variant="Linear"
                                  color="var(--color-text-secondary)"
                                />
                              ) : (
                                <Eye
                                  size={18}
                                  variant="Linear"
                                  color="var(--color-text-secondary)"
                                />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="profile-form-actions">
                      <button
                        type="submit"
                        className="profile-btn profile-btn-primary"
                        disabled={isChangingPwd}
                      >
                        <Lock1 size={16} variant="Bold" color="var(--color-surface)" />
                        {isChangingPwd ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                      </button>
                    </div>
                  </form>
                )}


              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
