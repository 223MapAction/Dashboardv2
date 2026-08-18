import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import debounce from 'lodash.debounce';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Header, Sidebar } from '../../components/layout';
import SignalementList from './components/SignalementList/SignalementList';
import { getSignalementsService } from './service/signalement_service';
import SignalementModalContext from './modale/SignalementModalContext';
import SignalementDeleteModal from './modale/SignalementDeleteModal';
import SignalementAssignModal from './modale/SignalementAssignModal';
import './signalement.css';
import { useReinitialisationSurChangement } from '../../hooks/useReinitialisationSurChangement';
import { BandeauErreur } from '../../components/molecules/BandeauErreur';
import { logger } from '../../utils/logger';


// Fonction pour adapter les données de l'API au format attendu
const adaptSignalementData = (signalement, currentUserId = null) => {
  if (!signalement) return null;

  const isOwner = currentUserId && signalement.taken_by ? parseInt(signalement.taken_by) === parseInt(currentUserId) : false;

  // Mapper l'état de l'signalement vers un badge en prenant en compte le propriétaire
  const getBadgeFromEtat = (etat) => {
    if (etat === 'taken_into_account') {
      return {
        label: isOwner ? 'PRIS EN COMPTE (PAR MOI)' : signalement.taken_by ? 'PRIS EN COMPTE (PAR AUTRE)' : 'PRIS EN COMPTE',
        variant: isOwner ? 'taken-me' : signalement.taken_by ? 'taken-other' : 'taken'
      };
    }
    if (etat === 'resolved') {
      return {
        label: isOwner ? 'RÉSOLU (PAR MOI)' : signalement.taken_by ? 'RÉSOLU (PAR AUTRE)' : 'RÉSOLU',
        variant: isOwner ? 'resolved-me' : signalement.taken_by ? 'resolved-other' : 'resolved'
      };
    }
    if (etat === 'declared') {
      return { label: 'DÉCLARÉ', variant: 'declared' };
    }
    return { label: 'EN COURS', variant: 'in-progress' };
  };

  return {
    ...signalement,
    // Adapter les champs pour la carte et le détail
    location: signalement.zone || signalement.location || 'Localisation non spécifiée',
    type: signalement.zone || signalement.type || 'Non spécifié',
    image: signalement.photo || signalement.image,
    photo: signalement.photo || signalement.image, // Pour SignalementCard
    organisation_name: signalement.organisation_name || signalement.user_id?.organisation_name || 'Non spécifié',
    user_full_name: signalement.user_full_name || (signalement.user_id ? `${signalement.user_id.first_name} ${signalement.user_id.last_name}` : 'Non spécifié'),
    badges: [getBadgeFromEtat(signalement.etat)],
    description: signalement.description || 'Aucune description disponible',
    // Ajouter les coordonnées formatées
    coordinates: (() => {
      const lat = parseFloat(signalement.lattitude);
      const lng = parseFloat(signalement.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return { lat, lng };
      }
      return null;
    })(),
    // Dates formatées
    startDate: signalement.created_at ? new Date(signalement.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date(signalement.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h') : 'Non spécifié',
    endDate: signalement.resolution_end_date ? new Date(signalement.resolution_end_date).toLocaleDateString('fr-FR') : 'En cours',
    // Informations supplémentaires
    objectives: signalement.objectives || [],
    participants: signalement.participants || [],
    // taken_by est l'ID de la personne qui a pris en charge, pas le nombre
    participantsCount: signalement.participants?.length || 0,
    extraParticipants: 0,
    // taken_by contient l'ID de l'utilisateur qui a pris en charge l'signalement
    takenBy: signalement.taken_by,
    // Déterminer si l'utilisateur connecté est propriétaire de l'signalement
    isOwner: currentUserId ? signalement.taken_by === parseInt(currentUserId) : false
  };
};

export const Signalement = () => {
  const navigate = useNavigate();
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();

  const workspaceClass = [
    'signalement-workspace',
  ].join(' ');

  // Récupérer l'ID de l'utilisateur connecté
  const currentUserId = sessionStorage.getItem('user_id');

  // États pour la pagination et recherche
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Debounce search input de 200ms
  const debouncedSetSearch = React.useMemo(
    () => debounce((val) => setSearch(val), 200),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  // Retour a la premiere page des qu'un filtre change.
  useReinitialisationSurChangement([search, statusFilter], () => setPage(1));

  // Charger la liste des signalements avec useSWR
  const {
    data: rawSignalements,
    error: erreurSignalements,
    isLoading: isLoadingSignalements,
    mutate: mutateSignalements
  } = useSWR(
    // statusFilter fait partie de la cle : sans lui, changer de statut ne
    // redemandait rien au serveur et le filtre ne s'appliquait qu'aux lignes
    // deja recues — soit la page courante, pendant que la pagination
    // continuait d'annoncer le total complet.
    ['/incidents/all', page, search, statusFilter],
    () => getSignalementsService(page, pageSize, search, statusFilter),
    {
      revalidateOnReconnect: true,
      onError: (error) => {
        logger.error('[INCIDENT] Erreur chargement incidents:', error);
      }
    }
  );

  // Adapter les données des signalements avec l'ID de l'utilisateur
  const rawList = rawSignalements
    ? Array.isArray(rawSignalements)
      ? rawSignalements
      : Array.isArray(rawSignalements.results)
        ? rawSignalements.results
        : []
    : [];

  const signalements = rawList.map((inc) => adaptSignalementData(inc, currentUserId));

  // ── États locaux pour la gestion des modales d'signalements ─────────────────────
  const [deleteModal, setDeleteModal] = useState({ open: false, incident: null });
  const [assignModal, setAssignModal] = useState({ open: false, incident: null });
  const [deleteAlert, setDeleteAlert] = useState({ type: null, message: null });
  const [assignAlert, setAssignAlert] = useState({ type: null, message: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [deleteClosing, setDeleteClosing] = useState(false);
  const [assignClosing, setAssignClosing] = useState(false);

  const openDeleteModal = (signalement) => {
    setDeleteModal({ open: true, signalement });
    setDeleteAlert({ type: null, message: null });
    setDeleteClosing(false);
  };

  const closeDeleteModal = () => {
    setDeleteClosing(true);
    setTimeout(() => {
      setDeleteModal({ open: false, incident: null });
      setDeleteAlert({ type: null, message: null });
      setDeleteClosing(false);
    }, 280);
  };

  const openAssignModal = (signalement) => {
    setAssignModal({ open: true, signalement });
    setAssignAlert({ type: null, message: null });
    setAssignClosing(false);
  };

  const closeAssignModal = () => {
    setAssignClosing(true);
    setTimeout(() => {
      setAssignModal({ open: false, incident: null });
      setAssignAlert({ type: null, message: null });
      setAssignClosing(false);
    }, 280);
  };

  const contextValue = {
    deleteModal,
    setDeleteModal,
    assignModal,
    setAssignModal,
    deleteAlert,
    setDeleteAlert,
    assignAlert,
    setAssignAlert,
    isDeleting,
    setIsDeleting,
    isAssigning,
    setIsAssigning,
    deleteClosing,
    setDeleteClosing,
    assignClosing,
    setAssignClosing,
    mutateSignalements,
    openDeleteModal,
    closeDeleteModal,
    openAssignModal,
    closeAssignModal
  };

  return (
    <SignalementModalContext.Provider value={contextValue}>
      <div className="signalement-page">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        <div className={`signalement-page-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            sidebarCollapsed={sidebarCollapsed}
          />

          <div className={workspaceClass}>
            <BandeauErreur
              erreur={erreurSignalements}
              onReessayer={mutateSignalements}
              message="Impossible de charger les signalements. La liste affichée peut ne plus être à jour."
            />
            {/* Liste des signalements (Pleine largeur) */}
            <SignalementList
              signalements={signalements}
              isLoading={isLoadingSignalements}
              onSelectSignalement={(signalement) => navigate(`/signalements/${signalement.id}`, { state: { signalement } })}
              search={searchInput}
              setSearch={(val) => {
                setSearchInput(val);
                debouncedSetSearch(val);
              }}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              count={rawSignalements?.count || 0}
            />
          </div>
        </div>

        {/* Modales d'actions d'signalements */}
        <SignalementAssignModal />
        <SignalementDeleteModal />
      </div>
    </SignalementModalContext.Provider>
  );
};

export default Signalement;
