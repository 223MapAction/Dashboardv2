import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FiltersBar } from '../../components/molecules/FiltersBar';
import { useRechercheDebouncee } from '../../hooks/useRechercheDebouncee';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import Pagination from '../../components/molecules/Pagination';
import { getIncidentsService } from '../incident/service/incident_service';
import DatePicker, { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale/fr';
import 'react-datepicker/dist/react-datepicker.css';
import {
  SearchNormal1,
  ArrowDown2,
  Calendar,
  CalendarRemove,
  Location,
  TickCircle,
  Clock,
  People,
  CloseCircle,
  TaskSquare,
  DocumentUpload,
  Eye,
  Add,
  CloseSquare,
  Danger,
  Refresh,
  Lock1,
  Crown1,
  Buildings2,
  Edit2,
  Trash
} from 'iconsax-react';
import { Header, Sidebar } from '../../components/layout';
import { CollaborationRequests } from '../collaboration-requests';
import { SuggestRequests } from '../suggest-request/SuggestRequests';
import { getCollaborationsService } from './service/collaboration_service';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText } from 'react-shimmer-effects';
import { BlurryImage } from '../../components/atoms/BlurryImage';
import './collaboration.css';

registerLocale('fr', fr);

// Organisations disponibles à suggérer
const AVAILABLE_ORGS = [
  { id: 'org-1', name: 'Croix-Rouge Sénégalaise', initials: 'CR', color: 'var(--color-danger-text)' },
  { id: 'org-2', name: 'OCHA', initials: 'OC', color: 'var(--color-primary-text)' },
  { id: 'org-3', name: 'PNUD Sénégal', initials: 'PN', color: 'var(--color-success-text)' },
  { id: 'org-4', name: 'UNICEF', initials: 'UN', color: 'var(--color-primary-text)' },
  { id: 'org-5', name: 'Médecins Sans Frontières', initials: 'MS', color: 'var(--color-warning-text)' },
  { id: 'org-6', name: 'Action Contre la Faim', initials: 'AF', color: '#A855F7' },
  { id: 'org-7', name: 'OXFAM', initials: 'OX', color: 'var(--color-success-text)' },
  { id: 'org-8', name: 'Care International', initials: 'CI', color: '#EC4899' },
  { id: 'org-9', name: 'Save the Children', initials: 'SC', color: 'var(--color-warning-text)' },
  { id: 'org-10', name: 'World Vision', initials: 'WV', color: '#6366F1' }
];

const ROLE_OPTIONS = [
  { id: 'leader', label: 'Leader', icon: Crown1, color: 'var(--color-warning-text)', description: 'Pilote l\'action' },
  { id: 'contributeur', label: 'Contributeur', icon: People, color: 'var(--color-primary-text)', description: 'Participe activement' },
  { id: 'observateur', label: 'Observateur', icon: Eye, color: 'var(--color-text-secondary)', description: 'Suit l\'avancement' }
];

export const Collaboration = () => {
  const navigate = useNavigate();
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'requests' ? 'requests' : tabParam === 'suggestions' ? 'suggestions' : 'collaborations';
  const setActiveTab = (tab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    saisie: searchInput,
    setSaisie: setSearchInput,
    recherche: search,
    reinitialiser: reinitialiserRecherche,
  } = useRechercheDebouncee();
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('accepted');
  const [localStatusFilter, setLocalStatusFilter] = useState('all');
  const [incidentFilter, setIncidentFilter] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [dateFrom, dateTo] = dateRange;


  // Réinitialiser la page à 1 lors du changement de filtre
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, incidentFilter, dateFrom, dateTo, localStatusFilter]);

  // Les cent signalements qui remplissent la liste déroulante du filtre.
  //
  // Mesuré à 9,7 s : c'est cher pour un menu, et cela partait jusqu'ici en même
  // temps que les collaborations elles-mêmes, sur une API qui rend déjà la main
  // lentement. On attend donc que le navigateur soit inoccupé — le contenu
  // principal est affiché à ce moment-là, et la liste est prête bien avant
  // qu'on ouvre le filtre.
  //
  // Différer plutôt que réduire : couper à vingt entrées rendrait le filtre
  // menteur, puisqu'il ne proposerait plus tous les signalements existants.
  const [filtreChargeable, setFiltreChargeable] = useState(false);
  useEffect(() => {
    const differer = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    const annuler = window.cancelIdleCallback || clearTimeout;
    const id = differer(() => setFiltreChargeable(true), { timeout: 4000 });
    return () => annuler(id);
  }, []);

  const { data: rawIncidents } = useSWR(
    filtreChargeable ? 'incidents_dropdown_list' : null,
    () => getIncidentsService(1, 100),
    { dedupingInterval: 300000, revalidateIfStale: false, revalidateOnFocus: false }
  );
  const incidentsList = useMemo(() => {
    return rawIncidents?.results || (Array.isArray(rawIncidents) ? rawIncidents : []);
  }, [rawIncidents]);

  // Modal tâches
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [modalClosing, setModalClosing] = useState(false);
  const [collabTasks, setCollabTasks] = useState({});
  const [expandedFailureTask, setExpandedFailureTask] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  // Progression sauvegardée (affichée sur la carte)
  const [savedProgress, setSavedProgress] = useState({});
  // Collaborations clôturées
  const [closedCollabs, setClosedCollabs] = useState({});
  // Confirmation de clôture
  const [confirmClose, setConfirmClose] = useState(false);
  // Modal d'ajout de tâche (séparé)
  const [addTaskModal, setAddTaskModal] = useState({ open: false, collabId: null });
  const [addTaskClosing, setAddTaskClosing] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDeadline, setEditTaskDeadline] = useState('');
  // Bottom sheet mobile pour actions sur carte
  const [mobileSheet, setMobileSheet] = useState({ open: false, collabId: null });
  const [mobileSheetClosing, setMobileSheetClosing] = useState(false);
  // Modal suggestion d'organisations (leader uniquement)
  const [suggestOrgModal, setSuggestOrgModal] = useState({ open: false, collabId: null });
  const [suggestClosing, setSuggestClosing] = useState(false);
  const [suggestedOrgs, setSuggestedOrgs] = useState([]);
  const [suggestSearch, setSuggestSearch] = useState('');
  const [suggestMessage, setSuggestMessage] = useState('');

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = (e) => setIsMobile(e.matches);
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Construit les paramètres d'appel pour une page donnée.
  const buildParams = useMemo(
    () => (pageArg) => {
      const params = { page: pageArg, page_size: pageSize };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (roleFilter) {
        params.role = roleFilter;
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      // Filtre d'avancement (Terminées / En cours)
      if (localStatusFilter === 'completed') {
        params.status = 'completed';
      } else if (localStatusFilter === 'in-progress') {
        params.status = 'in-progress';
      }
      if (incidentFilter) {
        params.incident_id = incidentFilter;
      }
      if (dateFrom) {
        params.date_from = dateFrom.toISOString().slice(0, 10);
      }
      if (dateTo) {
        params.date_to = dateTo.toISOString().slice(0, 10);
      }
      return params;
    },
    [search, roleFilter, statusFilter, incidentFilter, dateFrom, dateTo, localStatusFilter]
  );

  // Utiliser useSWR pour charger les collaborations
  const { data: swrData, error: swrError, isLoading, mutate } = useSWR(
    ['collaborations', page, search, roleFilter, statusFilter, incidentFilter, dateFrom, dateTo, localStatusFilter],
    () => getCollaborationsService(buildParams(page)),
    // Cette route met 8 a 10 secondes. Les revalidations automatiques de SWR —
    // au focus de la fenetre, a la reconnexion, ou parce que la donnee est
    // jugee perimee — relancent donc un appel de 10 secondes sans que
    // l'utilisateur ait rien demande. Mesure : un second appel identique
    // partait exactement a la fin du premier. Le rafraichissement reste
    // possible, mais seulement quand on revient sur l'onglet.
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false }
  );

  // Le prechargement de la page suivante est suspendu. Il avait du sens sur une
  // route rapide ; mesuree entre 7 et 12 secondes, elle fait payer a chacun un
  // appel lent pour un clic sur « suivant » qui n'arrivera peut-etre jamais.
  // A remettre quand /MapApi/collaborations/dashboard/ aura ete profile.

  // Revalider en fond au RETOUR sur l'onglet. La version precedente testait la
  // valeur de l'onglet et non son changement : elle se declenchait donc aussi
  // au premier montage, redemandant ce que SWR venait tout juste de demander.
  // Sur une route a 7-12 secondes, cela doublait le chargement de la page.
  const ongletPrecedent = useRef(activeTab);
  useEffect(() => {
    const revient = ongletPrecedent.current !== 'collaborations' && activeTab === 'collaborations';
    ongletPrecedent.current = activeTab;
    if (revient) mutate();
  }, [activeTab, mutate]);

  let shimmerColor = "#acb7c6"

  // Mapper les données API vers le format attendu par le composant
  const collaborations = useMemo(() => {
    if (!swrData) return [];
    const rawList = swrData.results || (Array.isArray(swrData) ? swrData : []);

    return rawList.map(collab => {
      const createdDate = new Date(collab.created_at);
      const startDate = collab.start_date ? new Date(collab.start_date) : null;
      const endDate = collab.end_date ? new Date(collab.end_date) : null;
      const incidentTitle = collab.incident_details?.title || collab.incident_title || `Incident`;
      const incidentImage = collab.incident_photo || collab.incident_thumbnail || collab.photo || collab.thumbnail || collab.incident_details?.photo || collab.incident_details?.image || '';
      const orgName = collab.organisation_name || collab.user_full_name || ``;
      const incidentLocation = collab.incident_details?.zone || collab.incident_zone || 'À définir';
      const incidentDescription = collab.incident_description || collab.incident_details?.description || collab.motivation || 'Aucune description';
      const incidentProgress = collab.incident_progress || 0;
      const participantsCount = collab.participants_count || collab.incident_details?.participants_count || 0;

      return {
        id: collab.id,
        userRole: collab.role,
        title: incidentTitle,
        incidentId: collab.incident,
        userId: collab.user,
        status: parseInt(incidentProgress) === 100 ? 'completed' : (collab.status === 'accepted' ? 'in-progress' : collab.status),
        createdAt: collab.created_at,
        motivation: collab.motivation,
        otherOption: collab.other_option,
        image: incidentImage,
        organisation: orgName,
        role: collab.role,
        joinedAt: createdDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        startDate: startDate ? startDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) : 'Non défini',
        endDate: endDate ? endDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) : 'Non défini',
        startAt: collab.created_at,
        endAt: collab.end_date,
        location: incidentLocation,
        description: incidentDescription,
        progress: incidentProgress,
        tasks: collab.tasks || [],
        participantsCount
      };
    });
  }, [swrData]);

  // Filtres locaux pour recherche et dates (le filtre de statut est maintenant géré par l'API)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return collaborations.filter((c) => {
      // Filtre période (optionnel, peut être géré par l'API aussi)
      if (dateFrom || dateTo) {
        const cStart = c.startAt ? new Date(c.startAt) : null;
        const cEnd = c.endAt ? new Date(c.endAt) : null;
        if (dateFrom && cEnd && cEnd < dateFrom) return false;
        if (dateTo && cStart && cStart > dateTo) return false;
      }

      // Filtre recherche
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.organisation.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
      );
    });
  }, [collaborations, search, dateFrom, dateTo]);

  const resetDateRange = () => setDateRange([null, null]);

  const openCollabDetail = (collab) => {
    navigate(`/collaboration-detail/${collab.id}`);
  };

  const openTasksModal = (collab) => {
    setSelectedCollab(collab);
    setModalClosing(false);
    // Initialiser les tâches si pas déjà fait
    if (!collabTasks[collab.id] && collab.tasks) {
      setCollabTasks(prev => ({
        ...prev,
        [collab.id]: collab.tasks
      }));
    }
  };

  const closeTasksModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setSelectedCollab(null);
      setModalClosing(false);
      setConfirmClose(false);
      setExpandedFailureTask(null);
      setFailureReason('');
    }, 280);
  };

  // Modal d'ajout de tâche
  const openAddTaskModal = (collab) => {
    if (!collabTasks[collab.id]) {
      setCollabTasks(prev => ({ ...prev, [collab.id]: collab.tasks || [] }));
    }
    setAddTaskModal({ open: true, collabId: collab.id });
  };

  const closeAddTaskModal = () => {
    setAddTaskClosing(true);
    setTimeout(() => {
      setAddTaskModal({ open: false, collabId: null });
      setAddTaskClosing(false);
      setNewTaskTitle('');
      setNewTaskDeadline('');
      setEditingTaskId(null);
      setEditTaskTitle('');
      setEditTaskDeadline('');
    }, 280);
  };

  const submitNewTask = () => {
    if (!newTaskTitle.trim() || !addTaskModal.collabId) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      deadline: newTaskDeadline || null,
      createdBy: 'me',
      createdAt: new Date().toISOString().slice(0, 10),
      completed: false,
      completedAt: null,
      failed: false,
      failedAt: null,
      failureReason: null,
      proof: null
    };
    setCollabTasks(prev => ({
      ...prev,
      [addTaskModal.collabId]: [...(prev[addTaskModal.collabId] || []), newTask]
    }));
    setNewTaskTitle('');
    setNewTaskDeadline('');
  };

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDeadline(task.deadline || '');
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskDeadline('');
  };

  const saveEditTask = (collabId, taskId) => {
    if (!editTaskTitle.trim()) return;
    setCollabTasks(prev => ({
      ...prev,
      [collabId]: prev[collabId].map(t =>
        t.id === taskId
          ? { ...t, title: editTaskTitle.trim(), deadline: editTaskDeadline || null }
          : t
      )
    }));
    cancelEditTask();
  };

  const deleteTask = (collabId, taskId) => {
    setCollabTasks(prev => ({
      ...prev,
      [collabId]: prev[collabId].filter(t => t.id !== taskId)
    }));
  };

  // Bottom sheet mobile
  const openMobileSheet = (collab) => {
    setMobileSheet({ open: true, collabId: collab.id });
  };

  const closeMobileSheet = () => {
    setMobileSheetClosing(true);
    setTimeout(() => {
      setMobileSheet({ open: false, collabId: null });
      setMobileSheetClosing(false);
    }, 280);
  };

  // Modal suggestion d'organisations
  const openSuggestOrgModal = (collab) => {
    setSuggestOrgModal({ open: true, collabId: collab.id });
  };

  const closeSuggestOrgModal = () => {
    setSuggestClosing(true);
    setTimeout(() => {
      setSuggestOrgModal({ open: false, collabId: null });
      setSuggestClosing(false);
      setSuggestedOrgs([]);
      setSuggestSearch('');
      setSuggestMessage('');
    }, 280);
  };

  const toggleSuggestedOrg = (org) => {
    setSuggestedOrgs(prev =>
      prev.find(o => o.id === org.id)
        ? prev.filter(o => o.id !== org.id)
        : [...prev, { ...org, role: 'contributeur', comment: '' }]
    );
    setSuggestSearch('');
  };

  const updateSuggestedRole = (orgId, role) => {
    setSuggestedOrgs(prev => prev.map(o => o.id === orgId ? { ...o, role } : o));
  };

  const updateSuggestedComment = (orgId, comment) => {
    setSuggestedOrgs(prev => prev.map(o => o.id === orgId ? { ...o, comment } : o));
  };

  const submitSuggestions = () => {
 
    closeSuggestOrgModal();
  };

  const toggleTask = (collabId, taskId) => {
    setCollabTasks(prev => ({
      ...prev,
      [collabId]: prev[collabId].map(task =>
        task.id === taskId
          ? {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : null,
            failed: false,
            failedAt: null,
            failureReason: null
          }
          : task
      )
    }));
  };

  const markTaskFailed = (collabId, taskId, reason) => {
    setCollabTasks(prev => ({
      ...prev,
      [collabId]: prev[collabId].map(task =>
        task.id === taskId
          ? {
            ...task,
            failed: true,
            failedAt: new Date().toISOString(),
            failureReason: reason,
            completed: false,
            completedAt: null
          }
          : task
      )
    }));
  };

  const resetTaskStatus = (collabId, taskId) => {
    setCollabTasks(prev => ({
      ...prev,
      [collabId]: prev[collabId].map(task =>
        task.id === taskId
          ? {
            ...task,
            failed: false,
            failedAt: null,
            failureReason: null,
            completed: false,
            completedAt: null
          }
          : task
      )
    }));
  };

  const handleProofUpload = (collabId, taskId, file) => {
    // Simuler l'upload de fichier
    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
    const fakeUrl = URL.createObjectURL(file);

    setCollabTasks(prev => ({
      ...prev,
      [collabId]: prev[collabId].map(task =>
        task.id === taskId
          ? {
            ...task,
            proof: { type: fileType, url: fakeUrl }
          }
          : task
      )
    }));
  };

  // Calculer la progression basée sur les tâches (état courant dans le modal)
  const getCalculatedProgress = (collab) => {
    const tasks = collabTasks[collab.id] || collab.tasks || [];
    if (tasks.length === 0) return collab.progress;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Progression affichée sur la carte (sauvegardée)
  const getSavedProgress = (collab) => {
    if (savedProgress[collab.id] !== undefined) return savedProgress[collab.id];
    return collab.progress;
  };

  // Vérifier s'il y a des changements non sauvegardés
  const hasPendingChanges = (collab) => {
    return getCalculatedProgress(collab) !== getSavedProgress(collab);
  };

  // Sauvegarder la progression
  const saveProgress = (collabId) => {
    const collab = collaborations.find(c => c.id === collabId);
    if (!collab) return;
    setSavedProgress(prev => ({
      ...prev,
      [collabId]: getCalculatedProgress(collab)
    }));
  };

  // Clôturer une collaboration
  const closeCollaboration = (collabId) => {
    const collab = collaborations.find(c => c.id === collabId);
    if (!collab) return;
    setSavedProgress(prev => ({
      ...prev,
      [collabId]: getCalculatedProgress(collab)
    }));
    setClosedCollabs(prev => ({ ...prev, [collabId]: true }));
    setConfirmClose(false);
    closeTasksModal();
  };

  const isCollabClosed = (collabId) => {
    return closedCollabs[collabId] === true;
  };

  const counts = useMemo(
    () => ({
      all: collaborations.length,
      'in-progress': collaborations.filter((c) => c.status === 'in-progress')
        .length,
      completed: collaborations.filter((c) => c.status === 'completed')
        .length
    }),
    [collaborations]
  );

  return (
    <div className="collaboration-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div
        className={`collaboration-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''
          }`}
      >
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="collaboration-content">
          <div className="collab-page">
            {/* Header avec tabs */}
            <div className="collab-page-header">
              <div>
                <h1 className="collab-title">Collaborations</h1>
                <p className="collab-subtitle">
                  Gérez vos collaborations actives et vos demandes de participation.
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="collab-tabs">
              <button
                type="button"
                className={`collab-tab ${activeTab === 'collaborations' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('collaborations')}
              >
                Mes collaborations
              </button>
              <button
                type="button"
                className={`collab-tab ${activeTab === 'requests' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                Demandes
              </button>
              <button
                type="button"
                className={`collab-tab ${activeTab === 'suggestions' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('suggestions')}
              >
                Suggestions
              </button>
            </div>

            {/* Contenu conditionnel */}
            {activeTab === 'collaborations' ? (
              <>
                {/* Toolbar */}
                <FiltersBar
                  recherche={searchInput}
                  onRecherche={setSearchInput}
                  placeholder="Rechercher un titre, une organisation, un lieu…"
                  selects={[
                    { id: 'statut', valeur: statusFilter, onChange: setStatusFilter,
                      ariaLabel: 'Filtrer par statut', neutre: 'all',
                      options: [
                        { value: 'all', label: 'Tous les statuts' },
                        { value: 'accepted', label: 'Acceptée' },
                        { value: 'pending', label: 'En attente' },
                        { value: 'declined', label: 'Refusée' },
                      ] },
                    { id: 'role', valeur: roleFilter, onChange: setRoleFilter,
                      ariaLabel: 'Filtrer par rôle', tousLabel: 'Tous les rôles',
                      options: [
                        { value: 'leader', label: 'Leader' },
                        { value: 'contributor', label: 'Contributeur' },
                        { value: 'observer', label: 'Observateur' },
                      ] },
                    { id: 'signalement', valeur: incidentFilter, onChange: setIncidentFilter,
                      ariaLabel: 'Filtrer par signalement', tousLabel: 'Tous les signalements',
                      options: incidentsList.map((inc) => ({ value: inc.id, label: inc.title })) },
                  ]}
                  onEffacer={() => {
                    reinitialiserRecherche();
                    setStatusFilter('all'); setRoleFilter(''); setIncidentFilter('');
                    setLocalStatusFilter('all'); resetDateRange();
                  }}
                  actifSupplementaire={localStatusFilter !== 'all' || Boolean(dateFrom) || Boolean(dateTo)}
                >
                    <div className="collab-date-range">
                      <Calendar size={16} variant="Bold" color="var(--color-primary-text)" />
                      <span className="collab-date-label">Période :</span>
                      <DatePicker
                        selectsRange
                        startDate={dateFrom}
                        endDate={dateTo}
                        onChange={(update) => setDateRange(update)}
                        locale="fr"
                        dateFormat="dd MMM yyyy"
                        placeholderText={
                          isMobile ? 'Période…' : 'Sélectionner une période…'
                        }
                        isClearable={false}
                        monthsShown={isMobile ? 1 : 2}
                        withPortal={isMobile}
                        shouldCloseOnSelect={!isMobile}
                        className="collab-date-input"
                        calendarClassName="collab-datepicker"
                        popperClassName="collab-datepicker-popper"
                        portalId="collab-datepicker-portal"
                      />
                      {(dateFrom || dateTo) && (
                        <button
                          type="button"
                          className="collab-date-clear"
                          onClick={resetDateRange}
                          aria-label="Réinitialiser la période"
                          title="Réinitialiser"
                        >
                          <CalendarRemove
                            size={16}
                            variant="Bold"
                            color="var(--color-danger-text)"
                          />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`collab-filter-pill ${localStatusFilter === 'all' ? 'is-active' : ''}`}
                      onClick={() => setLocalStatusFilter('all')}
                    >
                      Toutes
                      <span className="collab-filter-count">{counts.all}</span>
                    </button>
                    <button
                      type="button"
                      className={`collab-filter-pill ${localStatusFilter === 'in-progress' ? 'is-active' : ''}`}
                      onClick={() => setLocalStatusFilter('in-progress')}
                    >
                      En cours
                      <span className="collab-filter-count">
                        {counts['in-progress']}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`collab-filter-pill ${localStatusFilter === 'completed' ? 'is-active' : ''}`}
                      onClick={() => setLocalStatusFilter('completed')}
                    >
                      Terminées
                      <span className="collab-filter-count">
                        {counts.completed}
                      </span>
                    </button>

                </FiltersBar>

                {/* État de chargement avec react-shimmer-effects */}
                {isLoading && (
                  <div className="collab-grid">
                    {[...Array(6)].map((_, idx) => (
                      <article key={idx} className="collab-card" style={{ cursor: 'default' }}>
                        <ShimmerThumbnail height={180} rounded className="m-0" />
                        <div className="collab-card-body" style={{ padding: '20px' }}>
                          {/* Org name shimmer */}
                          <div style={{ width: '120px', marginBottom: '8px' }}>
                            <ShimmerText line={1} gap={0} />
                          </div>

                          {/* Title shimmer */}
                          <div style={{ width: '100%', marginBottom: '16px' }}>
                            <ShimmerTitle line={1} gap={0} variant="primary" />
                          </div>

                          {/* Description shimmer */}
                          <div style={{ marginBottom: '16px' }}>
                            <ShimmerText line={2} gap={8} />
                          </div>

                          {/* Meta rows shimmer */}
                          <div className="collab-card-meta" style={{ marginTop: 'auto' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <ShimmerThumbnail height={14} width={14} rounded />
                              <div style={{ width: '100px' }}><ShimmerText line={1} gap={0} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                              <ShimmerThumbnail height={14} width={14} rounded />
                              <div style={{ width: '150px' }}><ShimmerText line={1} gap={0} /></div>
                            </div>
                          </div>

                          {/* Progress bar shimmer */}
                          <div className="collab-progress" style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ width: '60px' }}><ShimmerText line={1} /></div>
                              <div style={{ width: '40px' }}><ShimmerText line={1} /></div>
                            </div>
                            <ShimmerThumbnail height={8} rounded />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* État d'erreur */}
                {swrError && (
                  <div className="collab-empty body-large text-center" >
                    <p>Erreur lors du chargement des collaborations.</p>
                    <button
                      onClick={() => mutate()}
                      className='btn btn-primary'
                    >
                      Réessayer
                    </button>
                  </div>
                )}

                {/* Liste */}
                {!isLoading && !swrError && filtered.length === 0 ? (
                  <div className="collab-empty">
                    <p>Aucune collaboration ne correspond à vos critères.</p>
                  </div>
                ) : !isLoading && !swrError ? (
                  <>
                    <div className="collab-grid">
                      {filtered.map((c) => (
                        <article
                          key={c.id}
                          className="collab-card collab-card-clickable"
                          onClick={() => openCollabDetail(c)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openCollabDetail(c);
                            }
                          }}
                        >
                          <div
                            className="collab-card-cover"
                            style={{ backgroundImage: `url(${c.image})` }}
                          >
                            <span
                              className={`collab-status-badge collab-status-${c.status}`}
                            >
                              {c.status === 'completed' ? (
                                <>
                                  <TickCircle
                                    size={14}
                                    variant="Bold"
                                    color="var(--color-surface)"
                                  />
                                  Terminée
                                </>
                              ) : (
                                <>
                                  <Clock size={14} variant="Bold" color="var(--color-surface)" />
                                  En cours
                                </>
                              )}
                            </span>
                          </div>

                          <div className="collab-card-body">
                            <div className="collab-card-org">{c.organisation}</div>
                            <h3 className="collab-card-title">{c.title}</h3>
                            {/* Badge de rôle */}
                            {c.userRole && (
                              <div className={`collab-role-badge collab-role-${c.userRole}`}>
                                {c.userRole === 'leader' && <Crown1 size={12} variant="Bold" color="var(--color-warning-text)" />}
                                {c.userRole === 'contributor' && <People size={12} variant="Bold" color="var(--color-primary-text)" />}
                                {c.userRole === 'observateur' && <Eye size={12} variant="Bold" color="var(--color-text-secondary)" />}
                                <span>Votre rôle : {c.userRole.charAt(0).toUpperCase() + c.userRole.slice(1)}</span>
                              </div>
                            )}
                            <p className="collab-card-desc">{c.description}</p>

                            <div className="collab-card-meta">
                              <div className="collab-meta-row">
                                <Location
                                  size={14}
                                  variant="Bold"
                                  color="var(--color-text-secondary)"
                                />
                                <span>{c.location}</span>
                              </div>
                              <div className="collab-meta-row">
                                <Calendar
                                  size={14}
                                  variant="Bold"
                                  color="var(--color-text-secondary)"
                                />
                                <span>
                                  {c.startDate} → {c.endDate}
                                </span>
                              </div>
                              <div className="collab-meta-row">
                                <People
                                  size={14}
                                  variant="Bold"
                                  color="var(--color-text-secondary)"
                                />
                                <span>
                                  {c.participantsCount} {c.participantsCount > 1 ? 'participants' : 'participant'}
                                </span>
                              </div>
                            </div>

                            <div className="collab-progress">
                              <div className="collab-progress-head">
                                <span>Progression</span>
                                <span className="collab-progress-value">
                                  {getSavedProgress(c)}%
                                </span>
                              </div>
                              <div className="collab-progress-bar">
                                <div
                                  className={`collab-progress-fill collab-progress-${isCollabClosed(c.id) ? 'completed' : c.status}`}
                                  style={{ width: `${getSavedProgress(c)}%` }}
                                />
                              </div>
                            </div>

                            {isCollabClosed(c.id) && (
                              <div className="collab-closed-badge">
                                <Lock1 size={14} variant="Bold" color="var(--color-surface)" />
                                Collaboration clôturée
                              </div>
                            )}


                          </div>
                        </article>
                      ))}
                    </div>

                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      count={swrData?.count || filtered.length}
                      onChange={setPage}
                    />
                  </>
                ) : null}
              </>
            ) : activeTab === 'requests' ? (
              <CollaborationRequests embedded={true} />
            ) : activeTab === 'suggestions' ? (
              <SuggestRequests embedded={true} />
            ) : null}
          </div>
        </main>
      </div>

      {/* Modal Tâches */}
      {selectedCollab && (
        <div
          className={`tasks-modal-overlay ${modalClosing ? 'closing' : ''}`}
          onClick={closeTasksModal}
        >
          <aside
            className={`tasks-modal ${modalClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="tasks-modal-header">
              <div>
                <h3 className="tasks-modal-title">{selectedCollab.title}</h3>
                <p className="tasks-modal-subtitle">
                  {selectedCollab.organisation} • {selectedCollab.location}
                </p>
              </div>
              <button
                type="button"
                className="tasks-modal-close"
                onClick={closeTasksModal}
              >
                <CloseCircle size={24} variant="Linear" color="var(--color-text-primary)" />
              </button>
            </header>

            <div className="tasks-modal-body">
              {/* Badge clôturée */}
              {isCollabClosed(selectedCollab.id) && (
                <div className="tasks-closed-banner">
                  <Lock1 size={18} variant="Bold" color="var(--color-success-text)" />
                  <span>Cette collaboration a été clôturée</span>
                </div>
              )}

              {/* Progression globale */}
              <div className="tasks-progress-section">
                <div className="tasks-progress-header">
                  <span className="tasks-progress-label">Progression</span>
                  <div className="tasks-progress-values">
                    {hasPendingChanges(selectedCollab) && (
                      <span className="tasks-progress-saved">
                        Sauvegardée : {getSavedProgress(selectedCollab)}%
                      </span>
                    )}
                    <span className="tasks-progress-percent">
                      {getCalculatedProgress(selectedCollab)}%
                    </span>
                  </div>
                </div>
                <div className="tasks-progress-bar">
                  <div
                    className="tasks-progress-fill"
                    style={{ width: `${getCalculatedProgress(selectedCollab)}%` }}
                  />
                </div>
                <div className="tasks-progress-stats">
                  <span>{(collabTasks[selectedCollab.id] || selectedCollab.tasks).filter(t => t.completed).length} tâches terminées</span>
                  <span>•</span>
                  <span>{(collabTasks[selectedCollab.id] || selectedCollab.tasks).filter(t => t.failed).length} échouées</span>
                  <span>•</span>
                  <span>{(collabTasks[selectedCollab.id] || selectedCollab.tasks).filter(t => !t.completed && !t.failed).length} en cours</span>
                </div>

                {/* Bouton mettre à jour progression */}
                {!isCollabClosed(selectedCollab.id) && hasPendingChanges(selectedCollab) && (
                  <button
                    type="button"
                    className="tasks-update-progress-btn"
                    onClick={() => saveProgress(selectedCollab.id)}
                  >
                    <Refresh size={16} variant="Bold" color="var(--color-surface)" />
                    Mettre à jour la progression
                  </button>
                )}
              </div>

              {/* Liste des tâches */}
              <div className="tasks-list">
                {(collabTasks[selectedCollab.id] || selectedCollab.tasks).map((task) => (
                  <div key={task.id} className={`task-item ${task.completed ? 'is-completed' : ''} ${task.failed ? 'is-failed' : ''}`}>
                    <div className="task-main">
                      <label className="task-checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(selectedCollab.id, task.id)}
                          className="task-checkbox"
                          disabled={task.failed}
                        />
                        <span className="task-checkmark">
                          <TickCircle size={20} variant="Bold" color="var(--color-surface)" />
                        </span>
                      </label>

                      <div className="task-content">
                        <div className="task-title-row">
                          <div className="task-title">{task.title}</div>
                          {task.failed && (
                            <span className="task-failed-badge">
                              <Danger size={14} variant="Bold" color="var(--color-surface)" />
                              Échouée
                            </span>
                          )}
                        </div>
                        <div className="task-meta">
                          <span className={`task-creator ${task.createdBy === 'me' ? 'is-me' : ''}`}>
                            {task.createdBy === 'me' ? 'Créée par moi' : `Créée par ${task.createdBy}`}
                          </span>
                          <span>•</span>
                          <span>{new Date(task.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          {task.completedAt && (
                            <>
                              <span>•</span>
                              <span className="task-completed-date">
                                Terminée le {new Date(task.completedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </span>
                            </>
                          )}
                          {task.failedAt && (
                            <>
                              <span>•</span>
                              <span className="task-failed-date">
                                Échouée le {new Date(task.failedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {!task.completed && !task.failed && (
                        <button
                          type="button"
                          className="task-fail-btn"
                          onClick={() => {
                            if (expandedFailureTask === task.id) {
                              setExpandedFailureTask(null);
                              setFailureReason('');
                            } else {
                              setExpandedFailureTask(task.id);
                              setFailureReason('');
                            }
                          }}
                          title="Marquer comme échouée"
                        >
                          <CloseSquare size={18} variant="Bold" color="var(--color-danger-text)" />
                        </button>
                      )}

                      {task.failed && (
                        <button
                          type="button"
                          className="task-reset-btn"
                          onClick={() => resetTaskStatus(selectedCollab.id, task.id)}
                          title="Réinitialiser la tâche"
                        >
                          <Add size={18} variant="Bold" color="var(--color-text-secondary)" />
                        </button>
                      )}
                    </div>

                    {/* Raison de l'échec */}
                    {task.failed && task.failureReason && (
                      <div className="task-failure-section">
                        <div className="task-failure-label">Raison de l'échec :</div>
                        <div className="task-failure-reason">{task.failureReason}</div>
                      </div>
                    )}

                    {/* Formulaire inline pour marquer comme échouée */}
                    {!task.completed && !task.failed && expandedFailureTask === task.id && (
                      <div className="task-failure-form">
                        <label htmlFor={`failure-reason-${task.id}`} className="failure-form-label">
                          Raison de l'échec <span className="required">*</span>
                        </label>
                        <p className="failure-form-help">
                          Expliquez pourquoi cette tâche n'a pas pu être réalisée.
                        </p>
                        <textarea
                          id={`failure-reason-${task.id}`}
                          className="failure-form-textarea"
                          rows={4}
                          value={failureReason}
                          onChange={(e) => setFailureReason(e.target.value)}
                          placeholder="Ex : Conditions météorologiques défavorables, manque de matériel..."
                          autoFocus
                        />
                        <div className="failure-form-actions">
                          <button
                            type="button"
                            className="failure-form-cancel"
                            onClick={() => {
                              setExpandedFailureTask(null);
                              setFailureReason('');
                            }}
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            className="failure-form-confirm"
                            onClick={() => {
                              if (failureReason.trim()) {
                                markTaskFailed(selectedCollab.id, task.id, failureReason.trim());
                                setExpandedFailureTask(null);
                                setFailureReason('');
                              }
                            }}
                            disabled={!failureReason.trim()}
                          >
                            <Danger size={16} variant="Bold" color="var(--color-surface)" />
                            Marquer comme échouée
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Preuve */}
                    {task.completed && (
                      <div className="task-proof-section">
                        {task.proof ? (
                          <div className="task-proof-display">
                            <div className="task-proof-label">Preuve fournie :</div>
                            {task.proof.type === 'image' ? (
                              <div className="task-proof-image">
                                <BlurryImage src={task.proof.url} alt="Preuve" />
                              </div>
                            ) : (
                              <div className="task-proof-video">
                                <iframe
                                  src={task.proof.url}
                                  title="Preuve vidéo"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="task-proof-upload">
                            <label className="task-proof-btn">
                              <DocumentUpload size={16} variant="Bold" color="var(--color-primary-text)" />
                              Ajouter une preuve (image/vidéo)
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleProofUpload(selectedCollab.id, task.id, e.target.files[0]);
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer avec bouton clôturer */}
            {!isCollabClosed(selectedCollab.id) && (
              <footer className="tasks-modal-footer">
                {confirmClose ? (
                  <div className="tasks-close-confirm">
                    <p className="tasks-close-confirm-text">
                      <Danger size={18} variant="Bold" color="var(--color-warning-text)" />
                      Êtes-vous sûr de vouloir clôturer cette collaboration ? Cette action est irréversible.
                    </p>
                    <div className="tasks-close-confirm-actions">
                      <button
                        type="button"
                        className="tasks-close-cancel"
                        onClick={() => setConfirmClose(false)}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="tasks-close-confirm-btn"
                        onClick={() => closeCollaboration(selectedCollab.id)}
                      >
                        <Lock1 size={16} variant="Bold" color="var(--color-surface)" />
                        Confirmer la clôture
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="tasks-footer-actions">
                    <button
                      type="button"
                      className="tasks-footer-close-btn"
                      onClick={closeTasksModal}
                    >
                      <CloseCircle size={16} variant="Linear" color="currentColor" />
                      Fermer
                    </button>
                    <button
                      type="button"
                      className="tasks-close-collab-btn"
                      onClick={() => setConfirmClose(true)}
                    >
                      <Lock1 size={16} variant="Bold" color="var(--color-surface)" />
                      Clôturer la collab
                    </button>
                  </div>
                )}
              </footer>
            )}
          </aside>
        </div>
      )}

      {/* Modal Ajouter / Gérer mes tâches */}
      {addTaskModal.open && (() => {
        const currentCollab = collaborations.find(c => c.id === addTaskModal.collabId);
        const allTasks = collabTasks[addTaskModal.collabId] || currentCollab?.tasks || [];
        const myTasks = allTasks.filter(t => t.createdBy === 'me');
        return (
          <div
            className={`tasks-modal-overlay ${addTaskClosing ? 'closing' : ''}`}
            onClick={closeAddTaskModal}
          >
            <aside
              className={`tasks-modal ${addTaskClosing ? 'closing' : ''}`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
            >
              <header className="tasks-modal-header">
                <div>
                  <h3 className="tasks-modal-title">Gérer mes tâches</h3>
                  <p className="tasks-modal-subtitle">
                    {currentCollab?.title}
                  </p>
                </div>
                <button
                  type="button"
                  className="tasks-modal-close"
                  onClick={closeAddTaskModal}
                >
                  <CloseCircle size={24} variant="Linear" color="var(--color-text-primary)" />
                </button>
              </header>

              <div className="tasks-modal-body">
                {/* Formulaire d'ajout */}
                <div className="tasks-add-form">
                  <div className="tasks-add-form-header">
                    <h4 className="tasks-add-form-title">
                      Nouvelle tâche
                    </h4>
                  </div>

                  <label className="tasks-add-label">
                    Titre <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="tasks-add-input"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ex : Collecte des déchets zone A"
                  />

                  <label className="tasks-add-label">
                    Date d'échéance (optionnel)
                  </label>
                  <input
                    type="date"
                    className="tasks-add-input"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                  />

                  <div className="tasks-add-form-actions">
                    <button
                      type="button"
                      className="tasks-add-confirm"
                      onClick={submitNewTask}
                      disabled={!newTaskTitle.trim()}
                    >
                      <Add size={16} variant="Bold" color="var(--color-surface)" />
                      Ajouter à la liste
                    </button>
                  </div>
                </div>

                {/* Liste de mes tâches */}
                <div className="my-tasks-section">
                  <div className="my-tasks-header">
                    <h4 className="my-tasks-title">
                      Mes tâches ({myTasks.length})
                    </h4>
                  </div>

                  {myTasks.length === 0 ? (
                    <div className="my-tasks-empty">
                      <TaskSquare size={32} variant="Linear" color="var(--color-text-muted)" />
                      <p>Vous n'avez encore ajouté aucune tâche.</p>
                    </div>
                  ) : (
                    <div className="my-tasks-list">
                      {myTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`my-task-item ${task.completed ? 'is-completed' : ''} ${task.failed ? 'is-failed' : ''}`}
                        >
                          {editingTaskId === task.id ? (
                            <div className="my-task-edit">
                              <input
                                type="text"
                                className="tasks-add-input"
                                value={editTaskTitle}
                                onChange={(e) => setEditTaskTitle(e.target.value)}
                                placeholder="Titre"
                                autoFocus
                              />
                              <input
                                type="date"
                                className="tasks-add-input"
                                value={editTaskDeadline}
                                onChange={(e) => setEditTaskDeadline(e.target.value)}
                              />
                              <div className="my-task-edit-actions">
                                <button
                                  type="button"
                                  className="my-task-btn-cancel"
                                  onClick={cancelEditTask}
                                >
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  className="my-task-btn-save"
                                  onClick={() => saveEditTask(addTaskModal.collabId, task.id)}
                                  disabled={!editTaskTitle.trim()}
                                >
                                  <TickCircle size={14} variant="Bold" color="var(--color-surface)" />
                                  Enregistrer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="my-task-info">
                                <div className="my-task-title">{task.title}</div>
                                <div className="my-task-meta">
                                  {task.deadline && (
                                    <span className="my-task-deadline">
                                      <Calendar size={12} variant="Linear" color="var(--color-text-secondary)" />
                                      {task.deadline}
                                    </span>
                                  )}
                                  {task.completed && (
                                    <span className="my-task-status completed">
                                      <TickCircle size={12} variant="Bold" color="var(--color-success-text)" />
                                      Terminée
                                    </span>
                                  )}
                                  {task.failed && (
                                    <span className="my-task-status failed">
                                      <Danger size={12} variant="Bold" color="var(--color-danger-text)" />
                                      Échouée
                                    </span>
                                  )}
                                  {!task.completed && !task.failed && (
                                    <span className="my-task-status pending">
                                      <Clock size={12} variant="Bold" color="var(--color-warning-text)" />
                                      En cours
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="my-task-actions">
                                <button
                                  type="button"
                                  className="my-task-action-btn edit"
                                  onClick={() => startEditTask(task)}
                                  title="Modifier"
                                >
                                  <Edit2 size={16} variant="Linear" color="var(--color-primary-text)" />
                                </button>
                                <button
                                  type="button"
                                  className="my-task-action-btn delete"
                                  onClick={() => deleteTask(addTaskModal.collabId, task.id)}
                                  title="Supprimer"
                                >
                                  <Trash size={16} variant="Linear" color="var(--color-danger-text)" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <footer className="tasks-modal-footer">
                <div className="tasks-footer-actions">
                  <button
                    type="button"
                    className="tasks-footer-close-btn"
                    onClick={closeAddTaskModal}
                  >
                    <CloseCircle size={16} variant="Linear" color="currentColor" />
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="tasks-close-collab-btn"
                    onClick={closeAddTaskModal}
                  >
                    <TickCircle size={16} variant="Bold" color="var(--color-surface)" />
                    Confirmer
                  </button>
                </div>
              </footer>
            </aside>
          </div>
        );
      })()}

      {/* Bottom sheet mobile - Actions sur la carte */}
      {mobileSheet.open && (() => {
        const c = collaborations.find(x => x.id === mobileSheet.collabId);
        if (!c) return null;
        const closed = isCollabClosed(c.id);
        return (
          <div
            className={`mobile-sheet-overlay ${mobileSheetClosing ? 'closing' : ''}`}
            onClick={closeMobileSheet}
          >
            <div
              className={`mobile-sheet ${mobileSheetClosing ? 'closing' : ''}`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
            >
              <div className="mobile-sheet-handle" />

              <div className="mobile-sheet-header">
                <div
                  className="mobile-sheet-cover"
                  style={{ backgroundImage: `url(${c.image})` }}
                />
                <div className="mobile-sheet-info">
                  <div className="mobile-sheet-org">{c.organisation}</div>
                  <h3 className="mobile-sheet-title">{c.title}</h3>
                  {c.userRole && (
                    <div className={`collab-role-badge collab-role-${c.userRole}`}>
                      {c.userRole === 'leader' && <Crown1 size={12} variant="Bold" color="var(--color-warning-text)" />}
                      {c.userRole === 'contributeur' && <People size={12} variant="Bold" color="var(--color-primary-text)" />}
                      {c.userRole === 'observateur' && <Eye size={12} variant="Bold" color="var(--color-text-secondary)" />}
                      <span>{c.userRole.charAt(0).toUpperCase() + c.userRole.slice(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mobile-sheet-actions">
                {c.tasks && c.tasks.length > 0 && (
                  <button
                    type="button"
                    className="mobile-sheet-action primary"
                    onClick={() => {
                      closeMobileSheet();
                      setTimeout(() => openTasksModal(c), 300);
                    }}
                  >
                    <div className="mobile-sheet-action-icon" style={{ backgroundColor: 'rgba(58, 162, 221, 0.12)' }}>
                      <TaskSquare size={20} variant="Bold" color="var(--color-primary-text)" />
                    </div>
                    <div className="mobile-sheet-action-text">
                      <span className="mobile-sheet-action-label">Voir les tâches</span>
                      <span className="mobile-sheet-action-sub">
                        {(collabTasks[c.id] || c.tasks).filter(t => t.completed).length}/{c.tasks.length} terminées
                      </span>
                    </div>
                  </button>
                )}

                {!closed && (
                  <button
                    type="button"
                    className="mobile-sheet-action"
                    onClick={() => {
                      closeMobileSheet();
                      setTimeout(() => openAddTaskModal(c), 300);
                    }}
                  >
                    <div className="mobile-sheet-action-icon" style={{ backgroundColor: 'rgba(58, 162, 221, 0.12)' }}>
                      <Add size={20} variant="Bold" color="var(--color-primary-text)" />
                    </div>
                    <div className="mobile-sheet-action-text">
                      <span className="mobile-sheet-action-label">Ajouter une tâche</span>
                      <span className="mobile-sheet-action-sub">Créer et gérer mes tâches</span>
                    </div>
                  </button>
                )}

                {!closed && c.userRole === 'leader' && (
                  <button
                    type="button"
                    className="mobile-sheet-action"
                    onClick={() => {
                      closeMobileSheet();
                      setTimeout(() => openSuggestOrgModal(c), 300);
                    }}
                  >
                    <div className="mobile-sheet-action-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
                      <Buildings2 size={20} variant="Bold" color="var(--color-warning-text)" />
                    </div>
                    <div className="mobile-sheet-action-text">
                      <span className="mobile-sheet-action-label">Suggérer des organisations</span>
                      <span className="mobile-sheet-action-sub">Inviter d'autres organisations</span>
                    </div>
                  </button>
                )}

                {closed && (
                  <div className="mobile-sheet-closed-info">
                    <Lock1 size={20} variant="Bold" color="var(--color-success-text)" />
                    <span>Cette collaboration est clôturée</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="mobile-sheet-cancel"
                onClick={closeMobileSheet}
              >
                Fermer
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modal Suggérer des organisations */}
      {suggestOrgModal.open && (() => {
        const currentCollab = collaborations.find(c => c.id === suggestOrgModal.collabId);
        const filteredOrgs = AVAILABLE_ORGS.filter(o =>
          o.name.toLowerCase().includes(suggestSearch.toLowerCase())
        );
        return (
          <div
            className={`tasks-modal-overlay ${suggestClosing ? 'closing' : ''}`}
            onClick={closeSuggestOrgModal}
          >
            <aside
              className={`tasks-modal ${suggestClosing ? 'closing' : ''}`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
            >
              <header className="tasks-modal-header">
                <div>
                  <h3 className="tasks-modal-title">
                    <Crown1
                      size={20}
                      variant="Bold"
                      color="var(--color-warning-text)"
                      style={{ marginRight: 6, verticalAlign: 'middle' }}
                    />
                    Suggérer des organisations
                  </h3>
                  <p className="tasks-modal-subtitle">
                    {currentCollab?.title}
                  </p>
                </div>
                <button
                  type="button"
                  className="tasks-modal-close"
                  onClick={closeSuggestOrgModal}
                >
                  <CloseCircle size={24} variant="Linear" color="var(--color-text-primary)" />
                </button>
              </header>

              <div className="tasks-modal-body">
                {/* Bandeau d'info */}
                <div className="suggest-info-banner">
                  <Crown1 size={18} variant="Bold" color="var(--color-warning-text)" />
                  <span>
                    En tant que <strong>leader</strong>, vous pouvez suggérer d'autres
                    organisations et leur attribuer un rôle.
                  </span>
                </div>

                {/* Recherche */}
                <div className="suggest-section">
                  <label className="suggest-section-label">
                    Rechercher une organisation
                  </label>
                  <div className="suggest-search-wrapper">
                    <div className="suggest-search">
                      <SearchNormal1 size={16} variant="Linear" color="var(--color-text-secondary)" />
                      <input
                        type="text"
                        className="suggest-search-input"
                        placeholder="Tapez le nom d'une organisation..."
                        value={suggestSearch}
                        onChange={(e) => setSuggestSearch(e.target.value)}
                      />
                      {suggestSearch && (
                        <button
                          type="button"
                          className="suggest-search-clear"
                          onClick={() => setSuggestSearch('')}
                        >
                          <CloseCircle size={16} variant="Linear" color="var(--color-text-secondary)" />
                        </button>
                      )}
                    </div>

                    {/* Résultats déroulants - uniquement si recherche active */}
                    {suggestSearch.trim() && (
                      <div className="suggest-search-results">
                        {filteredOrgs.filter(o => !suggestedOrgs.find(s => s.id === o.id)).length === 0 ? (
                          <div className="suggest-search-empty">
                            <Buildings2 size={20} variant="Linear" color="var(--color-text-muted)" />
                            <span>Aucune organisation trouvée</span>
                          </div>
                        ) : (
                          filteredOrgs
                            .filter(o => !suggestedOrgs.find(s => s.id === o.id))
                            .map(org => (
                              <button
                                type="button"
                                key={org.id}
                                className="suggest-search-result"
                                onClick={() => toggleSuggestedOrg(org)}
                              >
                                <div
                                  className="suggest-org-avatar"
                                  style={{ backgroundColor: org.color }}
                                >
                                  {org.initials}
                                </div>
                                <span className="suggest-org-name">{org.name}</span>
                                <Add size={18} variant="Linear" color="var(--color-primary-text)" />
                              </button>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Organisations sélectionnées avec rôles */}
                <div className="suggest-section">
                  <label className="suggest-section-label">
                    <People size={16} variant="Bold" color="var(--color-primary-text)" />
                    Sélectionnées ({suggestedOrgs.length})
                  </label>

                  {suggestedOrgs.length === 0 ? (
                    <div className="suggest-empty">
                      <People size={28} variant="Linear" color="var(--color-text-muted)" />
                      <p>Aucune organisation sélectionnée pour le moment.</p>
                    </div>
                  ) : (
                    <div className="suggest-roles-list">
                      {suggestedOrgs.map(org => {
                        const currentRole = ROLE_OPTIONS.find(r => r.id === org.role);
                        return (
                          <div key={org.id} className="suggest-role-row">
                            <div className="suggest-role-row-header">
                              <div className="suggest-role-org">
                                <div
                                  className="suggest-org-avatar"
                                  style={{ backgroundColor: org.color }}
                                >
                                  {org.initials}
                                </div>
                                <span className="suggest-org-name">{org.name}</span>
                              </div>
                              <button
                                type="button"
                                className="suggest-remove-btn"
                                onClick={() => toggleSuggestedOrg(org)}
                                title="Retirer"
                              >
                                <CloseCircle size={18} variant="Linear" color="var(--color-danger-text)" />
                              </button>
                            </div>

                            <div className="suggest-role-attribution">
                              <span className="suggest-role-attribution-label">Rôle :</span>
                              <div className="role-options">
                                {ROLE_OPTIONS.map(role => {
                                  const RoleIcon = role.icon;
                                  const isRoleSel = org.role === role.id;
                                  return (
                                    <button
                                      type="button"
                                      key={role.id}
                                      className={`role-option ${isRoleSel ? 'is-selected' : ''}`}
                                      onClick={() => updateSuggestedRole(org.id, role.id)}
                                      style={
                                        isRoleSel
                                          ? { borderColor: role.color, color: role.color }
                                          : {}
                                      }
                                    >
                                      <RoleIcon
                                        size={12}
                                        variant={isRoleSel ? 'Bold' : 'Linear'}
                                        color={isRoleSel ? role.color : 'var(--color-text-secondary)'}
                                      />
                                      {role.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {currentRole && (
                              <p className="suggest-role-desc">
                                {currentRole.description}
                              </p>
                            )}

                            {/* Commentaire par org */}
                            <div className="suggest-role-comment">
                              <label className="suggest-role-attribution-label">
                                <Edit2 size={12} variant="Bold" color="var(--color-primary-text)" />
                                Commentaire (optionnel)
                              </label>
                              <textarea
                                className="suggest-textarea"
                                rows={2}
                                value={org.comment || ''}
                                onChange={(e) => updateSuggestedComment(org.id, e.target.value)}
                                placeholder="Pourquoi suggérez-vous cette organisation ?"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <footer className="tasks-modal-footer">
                <div className="tasks-footer-actions">
                  <button
                    type="button"
                    className="tasks-footer-close-btn"
                    onClick={closeSuggestOrgModal}
                  >
                    <CloseCircle size={16} variant="Linear" color="currentColor" />
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="tasks-close-collab-btn"
                    onClick={submitSuggestions}
                    disabled={suggestedOrgs.length === 0}
                  >
                    <Buildings2 size={16} variant="Bold" color="var(--color-surface)" />
                    Envoyer ({suggestedOrgs.length})
                  </button>
                </div>
              </footer>
            </aside>
          </div>
        );
      })()}
    </div>
  );
};

export default Collaboration;
