import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Header, Sidebar } from '../../components/layout';
import {
  Trash, SearchNormal1, ArrowDown2, RotateLeft,
  InfoCircle, CloseCircle, Grid2, HambergerMenu
} from 'iconsax-react';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText } from 'react-shimmer-effects';
import { getTrashIncidentsService, restoreIncidentService, deleteIncidentService } from '../incident/service/incident_service';
import { BlurryImage } from '../../components/atoms/BlurryImage';
import { FiltersBar } from '../../components/molecules/FiltersBar';
import { useRechercheDebouncee } from '../../hooks/useRechercheDebouncee';
import { OffcanvasModal } from '../../components/molecules/OffcanvasModal';
import './trash.css';

// Composant Shimmer Skeleton pour le chargement des incidents de la corbeille
const TrashSkeleton = ({ viewMode = 'list' }) => {
  if (viewMode === 'grid') {
    return (
      <div className="trash-grid">
        {[...Array(6)].map((_, idx) => (
          <div className="trash-card" key={idx} style={{ opacity: 0.7 }}>
            <div className="trash-card-thumb">
              <ShimmerThumbnail height={160} rounded />
            </div>
            <div className="trash-card-body" style={{ gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <ShimmerThumbnail height={20} width={60} rounded />
                <ShimmerThumbnail height={20} width={80} rounded />
              </div>
              <ShimmerTitle line={1} gap={0} width="60%" />
              <ShimmerText line={2} gap={8} />
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <ShimmerText line={1} width={100} />
                <ShimmerText line={1} width={100} />
              </div>
            </div>
            <div className="trash-card-actions">
              <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
                <ShimmerThumbnail height={24} width={80} rounded />
              </div>
              <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
                <ShimmerThumbnail height={24} width={80} rounded />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="trash-list" style={{ gap: '12px' }}>
      {[...Array(5)].map((_, idx) => (
        <div className="trash-row" key={idx} style={{ opacity: 0.7, padding: '16px' }}>
          <div style={{ width: '16px' }} />
          <div className="trash-row-thumb">
            <ShimmerThumbnail height={54} width={72} rounded />
          </div>
          <div className="trash-row-main" style={{ gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <ShimmerThumbnail height={16} width={50} rounded />
              <ShimmerThumbnail height={16} width={70} rounded />
            </div>
            <ShimmerTitle line={1} gap={0} width="40%" />
            <ShimmerText line={1} width="80%" />
          </div>
          <div className="trash-row-meta" style={{ gap: '6px', alignItems: 'flex-end' }}>
            <ShimmerText line={1} width={80} />
            <ShimmerText line={1} width={100} />
            <ShimmerText line={1} width={120} />
          </div>
          <div style={{ width: '120px', display: 'flex', gap: '8px', paddingLeft: '16px', borderLeft: '1px solid var(--color-border)' }}>
            <ShimmerThumbnail height={32} width={50} rounded />
            <ShimmerThumbnail height={32} width={50} rounded />
          </div>
        </div>
      ))}
    </div>
  );
};

// Fonction d'adaptation des données de l'incident pour la corbeille
const adaptTrashIncidentData = (incident) => {
  if (!incident) return null;

  const getBadgeFromEtat = (etat) => {
    const badges = {
      'declared': { label: 'DÉCLARÉ', variant: 'declared' },
      'taken_into_account': { label: 'PRIS EN COMPTE', variant: 'taken' },
      'resolved': { label: 'RÉSOLU', variant: 'resolved' }
    };
    return badges[etat] || { label: 'EN COURS', variant: 'in-progress' };
  };

  const badge = getBadgeFromEtat(incident.etat);

  // Calcul du nombre de jours restants avant suppression définitive (30 jours max)
  const createdDate = new Date(incident.created_at || Date.now());
  const now = new Date();
  const diffTime = Math.abs(now - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const expiresIn = Math.max(1, 30 - diffDays);

  return {
    ...incident,
    title: incident.title || 'Sans titre',
    description: incident.description || 'Aucune description disponible',
    // Pas de photo de remplacement : BlurryImage affiche son propre etat
    // « aucune photo ». Une image de banque d'images faisait croire a une
    // vraie photo du signalement, en plus d'appeler un CDN externe.
    image: incident.photo || '',
    type: incident.zone || 'Non spécifié',
    location: incident.zone || 'Localisation non spécifiée',
    deletedAt: incident.created_at ? new Date(incident.created_at).toLocaleDateString('fr-FR') : 'Non spécifiée',
    badgeLabel: badge.label,
    badgeVariant: badge.variant,
    expiresIn: expiresIn
  };
};

export const TrashPage = () => {
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();

  // Utiliser useSWR pour charger les incidents supprimés
  const { data: incidentsData, error: incidentsError, isLoading, mutate } = useSWR(
    'trash-incidents',
    getTrashIncidentsService,
    {
      revalidateOnFocus: false
    }
  );

  const incidents = useMemo(() => {
    const rawList = incidentsData
      ? Array.isArray(incidentsData)
        ? incidentsData
        : Array.isArray(incidentsData.results)
          ? incidentsData.results
          : []
      : [];
    return rawList.map(adaptTrashIncidentData);
  }, [incidentsData]);

  const {
    saisie: searchInput,
    setSaisie: setSearchInput,
    recherche: search,
    reinitialiser: reinitialiserRecherche,
  } = useRechercheDebouncee();
  const [typeFilter, setTypeFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmClosing, setConfirmClosing] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const types = useMemo(() => [...new Set(incidents.map((i) => i.type).filter(Boolean))], [incidents]);

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      const matchSearch =
        !search ||
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.location?.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || i.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [incidents, search, typeFilter]);

  const closeConfirmModal = () => {
    setConfirmClosing(true);
    setTimeout(() => {
      setConfirmId(null);
      setConfirmClosing(false);
    }, 280);
  };

  // ── Restaurer un incident ──────────────────────────────
  const handleRestore = async (id) => {
    const item = incidents.find((i) => i.id === id);
    try {
      await restoreIncidentService(id);
      await mutate();
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      showToast(`"${item?.title}" a été restauré.`);
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      showToast('Erreur lors de la restauration.');
    }
  };

  // ── Supprimer définitivement ──────────────────────────
  const handleDeletePermanent = async (id) => {
    try {
      if (id === 'batch') {
        await Promise.all([...selected].map(selectedId => deleteIncidentService(selectedId)));
        await mutate();
        setSelected(new Set());
        showToast('Incidents sélectionnés supprimés définitivement.');
      } else {
        await deleteIncidentService(id);
        await mutate();
        setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
        showToast('Incident supprimé définitivement.');
      }
      closeConfirmModal();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showToast('Erreur lors de la suppression.');
      closeConfirmModal();
    }
  };

  // ── Restaurer tous les sélectionnés ───────────────────
  const handleRestoreSelected = async () => {
    try {
      await Promise.all([...selected].map(selectedId => restoreIncidentService(selectedId)));
      const count = selected.size;
      await mutate();
      showToast(`${count} incident(s) restauré(s).`);
      setSelected(new Set());
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      showToast('Erreur lors de la restauration.');
    }
  };

  // ── Toast ─────────────────────────────────────────────
  const showToast = (message) => {
    setToast({ message, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Sélection ─────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  };

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  // ── Composant carte réutilisable ─────────────────────
  const IncidentItem = ({ incident }) => {
    const isChecked = selected.has(incident.id);
    const urgent = incident.expiresIn <= 5;

    if (viewMode === 'list') {
      return (
        <div className={`trash-row ${isChecked ? 'is-selected' : ''}`}>
          <input
            type="checkbox"
            className="trash-row-checkbox"
            checked={isChecked}
            onChange={() => toggleSelect(incident.id)}
          />

          <div className="trash-row-thumb">
            <BlurryImage src={incident.image} alt={incident.title} />
          </div>

          <div className="trash-row-main">
            <div className="trash-row-top">
              <span className={`trash-badge trash-badge-${incident.badgeVariant}`}>
                {incident.badgeLabel}
              </span>
              <span className="trash-card-type">{incident.type}</span>
            </div>
            <h3 className="trash-row-title">{incident.title}</h3>
            <p className="trash-row-desc">{incident.description}</p>
          </div>

          <div className="trash-row-meta">
            <span className="trash-card-location">{incident.location}</span>
            <span className="trash-card-date">{incident.deletedAt}</span>
            <div className="trash-card-expiry">
              <span
                className="trash-expiry-dot"
                style={{ backgroundColor: urgent ? 'var(--color-danger)' : 'var(--color-warning)' }}
              />
              <span style={{ color: urgent ? 'var(--color-danger)' : 'inherit' }}>
                {incident.expiresIn}j restant{incident.expiresIn > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="trash-row-actions">
            <button
              className="trash-btn-restore"
              onClick={() => handleRestore(incident.id)}
              title="Restaurer"
            >
              <RotateLeft size={15} variant="Linear" color="var(--color-primary)" />
              Restaurer
            </button>
            <button
              className="trash-btn-delete"
              onClick={() => setConfirmId(incident.id)}
              title="Supprimer définitivement"
            >
              <Trash size={15} variant="Linear" color="var(--color-danger)" />
              Supprimer
            </button>
          </div>
        </div>
      );
    }

    // ── Vue grille ──
    return (
      <div className={`trash-card ${isChecked ? 'is-selected' : ''}`}>
        <input
          type="checkbox"
          className="trash-card-checkbox"
          checked={isChecked}
          onChange={() => toggleSelect(incident.id)}
        />

        <div className="trash-card-thumb">
          <BlurryImage src={incident.image} alt={incident.title} />
          <div className="trash-card-overlay" aria-hidden="true" />
        </div>

        <div className="trash-card-body">
          <div className="trash-card-meta">
            <span className={`trash-badge trash-badge-${incident.badgeVariant}`}>
              {incident.badgeLabel}
            </span>
            <span className="trash-card-type">{incident.type}</span>
          </div>

          <h3 className="trash-card-title">{incident.title}</h3>
          <p className="trash-card-desc">{incident.description}</p>

          <div className="trash-card-info-row">
            <span className="trash-card-location">📍 {incident.location}</span>
            <span className="trash-card-date">🗑 Supprimé le {incident.deletedAt}</span>
          </div>

          <div className="trash-card-expiry">
            <span
              className="trash-expiry-dot"
              style={{ backgroundColor: urgent ? 'var(--color-danger)' : 'var(--color-warning)' }}
            />
            Expire dans <strong>{incident.expiresIn} jour{incident.expiresIn > 1 ? 's' : ''}</strong>
          </div>
        </div>

        <div className="trash-card-actions">
          <button
            className="trash-btn-restore"
            onClick={() => handleRestore(incident.id)}
            title="Restaurer cet signalement"
          >
            <RotateLeft size={16} variant="Linear" color="var(--color-primary)" />
            Restaurer
          </button>
          <button
            className="trash-btn-delete"
            onClick={() => setConfirmId(incident.id)}
            title="Supprimer définitivement"
          >
            <Trash size={15} variant="Linear" color="var(--color-danger)" />
            Supprimer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="trash-page">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div className={`trash-page-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="trash-content">

          {/* ── État de chargement ── */}
          {isLoading && (
            <TrashSkeleton viewMode={viewMode} />
          )}

          {/* ── État d'erreur ── */}
          {incidentsError && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-danger-text)' }}>
              <p>Erreur lors du chargement des signalements supprimés.</p>
              <button
                onClick={() => mutate()}
                style={{ marginTop: '12px', padding: '8px 16px', cursor: 'pointer' }}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* ── Contenu principal ── */}
          {!isLoading && !incidentsError && (
            <>
              {/* ── Header de page ── */}
              <div className="trash-header">
                <div className="trash-header-left">

                  <div>
                    <h1 className="trash-title">Corbeille</h1>
                    <p className="trash-subtitle">
                      Les incidents supprimés sont conservés pendant <strong>30 jours</strong> avant d'être définitivement effacés.
                    </p>
                  </div>
                </div>

                <div className="trash-header-right">
                  {selected.size > 0 && (
                    <div className="trash-batch-actions" style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <button className="trash-btn-restore-all" onClick={handleRestoreSelected}>
                        <RotateLeft size={16} variant="Linear" color="var(--color-surface)" />
                        Restaurer ({selected.size})
                      </button>
                      <button className="trash-btn-delete-all" onClick={() => setConfirmId('batch')} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-5)', backgroundColor: 'var(--color-danger)', color: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)', fontFamily: 'var(--font-family)', cursor: 'pointer', transition: 'background-color 0.2s ease, transform 0.1s ease', whiteSpace: 'nowrap' }}>
                        <Trash size={16} variant="Linear" color="var(--color-surface)" />
                        Supprimer ({selected.size})
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Bannière info ── */}
              <div className="trash-info-banner">
                <InfoCircle size={16} variant="Linear" color="var(--color-primary)" />
                <span>{incidents.length} incident(s) dans la corbeille. La suppression définitive est irréversible.</span>
              </div>

              {/* ── Filtres — fixe au defilement : voir .trash-filtres-fixes. ── */}
              <div className="trash-filtres-fixes">
              <FiltersBar
                recherche={searchInput}
                onRecherche={setSearchInput}
                placeholder="Rechercher un signalement, un lieu…"
                selects={[{
                  id: 'type',
                  valeur: typeFilter,
                  onChange: setTypeFilter,
                  ariaLabel: 'Filtrer par type',
                  tousLabel: 'Tous les types',
                  options: types.map((t) => ({ value: t, label: t })),
                }]}
                onEffacer={() => { reinitialiserRecherche(); setTypeFilter(''); }}
                resultats={filtered.length}
                nomResultat="signalement"
              >
                <label className="trash-select-all">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                  <span>Tout sélectionner</span>
                </label>

                {/* Toggle vue intégré sur la même ligne */}
                <div className="trash-view-toggle" role="group" aria-label="Changer de vue" style={{ marginLeft: 'auto' }}>
                  <button
                    className={`trash-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="Vue liste"
                    aria-pressed={viewMode === 'list'}
                  >
                    <HambergerMenu
                      size={18}
                      variant={viewMode === 'list' ? 'Bold' : 'Linear'}
                      color={viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                    />
                  </button>
                  <button
                    className={`trash-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Vue grille"
                    aria-pressed={viewMode === 'grid'}
                  >
                    <Grid2
                      size={18}
                      variant={viewMode === 'grid' ? 'Bold' : 'Linear'}
                      color={viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                    />
                  </button>
                </div>

              </FiltersBar>
              </div>

              {/* ── Contenu ── */}
              {filtered.length === 0 ? (
                <div className="trash-empty">
                  <div className="trash-empty-icon">
                    <Trash size={48} variant="Linear" color="var(--color-border)" />
                  </div>
                  <p className="trash-empty-title">La corbeille est vide</p>
                  <p className="trash-empty-sub">Aucun signalement supprimé ne correspond à vos critères.</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="trash-grid">
                  {filtered.map((incident) => (
                    <IncidentItem key={incident.id} incident={incident} />
                  ))}
                </div>
              ) : (
                <div className="trash-list">
                  {filtered.map((incident) => (
                    <IncidentItem key={incident.id} incident={incident} />
                  ))}
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* ── Modal confirmation ── */}
      {confirmId && (
        <OffcanvasModal
          onClose={closeConfirmModal}
          isClosing={Boolean(confirmClosing)}
          title="Suppression définitive"
          ariaLabel="Supprimer définitivement"
          role="alertdialog"
          tone="danger"
          size="sm"
          closeVariant="plain"
          footerLayout="col"
          footer={
            <>
              <button
                type="button"
                className="am-btn am-btn--danger"
                onClick={() => handleDeletePermanent(confirmId)}
              >
                Supprimer définitivement
              </button>
              <button
                type="button"
                className="am-btn am-btn--outline"
                onClick={closeConfirmModal}
              >
                Annuler
              </button>
            </>
          }
        >
          <div className="am-offcanvas-body am-offcanvas-body--centered">
            <div className="am-delete-icon-wrap" aria-hidden="true">
              <Trash size={32} variant="Bold" color="var(--color-danger)" />
            </div>

            <p className="am-delete-title">Confirmer la suppression</p>
            <p className="am-delete-text">
              Cette action est <strong>irréversible</strong>.<br />
              {confirmId === 'batch'
                ? `Vous êtes sur le point de supprimer définitivement ${selected.size} incident(s) sélectionnés.`
                : "Vous êtes sur le point de supprimer définitivement cet incident."
              } Ils ne pourront pas être récupérés.
            </p>
          </div>
        </OffcanvasModal>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="trash-toast">
          <RotateLeft size={16} variant="Linear" color="var(--color-surface)" />
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default TrashPage;
