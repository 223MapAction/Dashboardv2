import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerButton } from 'react-shimmer-effects';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Header, Sidebar } from '../../components/layout';
import { CollaborationDetailProvider } from './context/CollaborationDetailContext';
import { TaskModal } from './modal/TaskModal';
import { SuggestOrgModal } from './modal/SuggestOrgModal';
import { DeleteTaskModal } from './modal/DeleteTaskModal';
import { AgentReportsModal } from './modal/AgentReportsModal';
import { NotFound } from '../not-found';
import { getCollaborationService } from '../collaboration/service/collaboration_service';
import { getOrganisationsService, formatOrganisation } from '../organisations/service/organisation_service';
import { BlurryImage } from '../../components/atoms/BlurryImage';
import {
  getDiscussionMessagesService,
  sendMessageService,
  formatMessage,
  suggestCollaborationPartnerService
} from './service/collab_detail_service';
import {
  getTasksService,
  createTaskService,
  completeTaskService,
  failTaskService,
  deleteTaskService,
  updateTaskService
} from '../incident/service/task_service';
import { closeIncidentService } from '../incident/service/incident_service';
import {
  ArrowLeft2,
  Location,
  Calendar,
  People,
  Crown1,
  Eye,
  Lock1,
  TickCircle,
  Clock,
  Danger,
  CloseSquare,
  Add,
  DocumentUpload,
  Refresh,
  Send2,
  TaskSquare,
  Edit2,
  Trash,
  Paperclip,
  Microphone,
  InfoCircle,
  SearchNormal1,
  Buildings2,
  CloseCircle,
  Play,
  Pause,
  DocumentText
} from 'iconsax-react';
import './collaboration-detail.css';

const formatFailureReason = (reason) => {
  if (!reason) return '';
  try {
    let clean = reason;
    if (clean.includes("{'") || clean.includes('{"')) {
      clean = clean.replace(/'/g, '"');
      const parsed = JSON.parse(clean);
      if (parsed.failure_reason) return parsed.failure_reason;
      if (typeof parsed === 'object') {
        return Object.values(parsed).flat().join(', ');
      }
    }
    return reason;
  } catch (e) {
    let clean = reason.replace(/\{'failure_reason':\s*'/g, '').replace(/'\}/g, '');
    clean = clean.replace(/\{"failure_reason":\s*"/g, '').replace(/"\}/g, '');
    return clean;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const dayAndMonth = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dayAndMonth} à ${time}`;
  } catch (e) {
    return dateStr;
  }
};

const CustomAudioPlayer = ({ id, src, activeAudioId, setActiveAudioId }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Éviter les coupures d'audio lors des rafraîchissements SWR
  // Si le token change mais que c'est le même fichier, on ne met pas à jour la source.
  const [stableSrc, setStableSrc] = useState(src);

  useEffect(() => {
    if (!src) return;
    if (!stableSrc) {
      setStableSrc(src);
      return;
    }
    const oldBase = stableSrc.split('?')[0];
    const newBase = src.split('?')[0];
    if (oldBase !== newBase) {
      setStableSrc(src);
    }
  }, [src, stableSrc]);

  // Si un autre audio démarre, on met celui-ci en pause
  useEffect(() => {
    if (activeAudioId && activeAudioId !== id && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [activeAudioId, id, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const onAudioEnd = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      audio.currentTime = 0;
      if (setActiveAudioId && activeAudioId === id) setActiveAudioId(null);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onAudioEnd);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onAudioEnd);
    };
  }, [id, activeAudioId, setActiveAudioId]);

  const togglePlayPause = () => {
    const prevValue = isPlaying;
    if (!prevValue) {
      if (setActiveAudioId) setActiveAudioId(id);
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setProgress(e.target.value);
  };

  const formatTime = (time) => {
    if (time && !isNaN(time)) {
      const minutes = Math.floor(time / 60);
      const formatMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const seconds = Math.floor(time % 60);
      const formatSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
      return `${formatMinutes}:${formatSeconds}`;
    }
    return '00:00';
  };

  return (
    <div className="custom-audio-player" style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
      <audio ref={audioRef} src={stableSrc} preload="metadata" />
      <button
        onClick={togglePlayPause}
        style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: 'var(--color-primary)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,

          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)'; }}
      >
        {isPlaying ? <Pause size={20} variant="Bold" color="#FFF" /> : <Play size={20} variant="Bold" color="#FFF" style={{ marginLeft: '2px' }} />}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ position: 'relative', width: '100%', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'var(--color-primary)', width: `${progress || 0}%`, borderRadius: '3px', transition: 'width 0.1s linear' }} />
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleProgressChange}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer', margin: 0, padding: 0
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600', fontFamily: 'monospace' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export const CollaborationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const formatEtat = (etat) => {
    if (!etat) return 'Inconnu';
    switch (etat) {
      case 'taken_into_account':
        return 'Pris en compte';
      case 'resolved':
        return 'Résolu';
      case 'pending':
        return 'En attente';
      default:
        return etat.charAt(0).toUpperCase() + etat.slice(1);
    }
  };

  const getEtatBadgeClass = (etat) => {
    switch (etat) {
      case 'taken_into_account':
        return 'badge-primary';
      case 'resolved':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Inconnu';
    switch (status) {
      case 'accepted':
        return 'Acceptée';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Refusée';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'accepted':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const formatRole = (role) => {
    if (!role) return 'Membre';
    switch (role) {
      case 'leader':
        return 'Leader';
      case 'contributeur':
        return 'Contributeur';
      case 'observateur':
        return 'Observateur';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'leader':
        return 'badge-warning';
      case 'contributeur':
        return 'badge-primary';
      case 'observateur':
        return 'badge-info';
      default:
        return 'badge-primary';
    }
  };

  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();

  // Utiliser useSWR pour charger la collaboration depuis l'API
  const { data: collaborationData, error: collaborationError, isLoading } = useSWR(
    id ? `collaboration-${id}` : null,
    () => getCollaborationService(id),
    {
      revalidateOnFocus: false
    }
  );

  console.log(collaborationData);


  // Récupérer l'incidentId depuis la collaboration
  const incidentId = collaborationData?.incident;

  // Utiliser useSWR pour charger les tâches de l'incident avec polling intelligent
  const { data: tasksData, error: tasksError, isLoading: tasksLoading, mutate: mutateTasks } = useSWR(
    incidentId ? `tasks-${incidentId}` : null,
    () => getTasksService(incidentId),
    {
      revalidateOnFocus: false,
      // Polling intelligent : 10 secondes (non-agressif)
      // Désactivé quand l'onglet est en arrière-plan
      refreshInterval: 10000,
      // Arrêter le polling si l'onglet n'est pas visible
      refreshWhenHidden: false,
      // Arrêter le polling si pas de connexion
      refreshWhenOffline: false,
      // Revalider quand la fenêtre reprend le focus
      revalidateOnReconnect: true
    }
  );

  // Utiliser useSWR pour charger les messages de discussion de l'incident
  const { data: rawMessagesData, error: messagesError, mutate: mutateMessages } = useSWR(
    incidentId ? `discussion-${incidentId}` : null,
    () => getDiscussionMessagesService(incidentId),
    {
      revalidateOnFocus: false,
      refreshInterval: 5000 // actualisation toutes les 5 secondes
    }
  );

  // Formater les messages pour l'affichage
  const messages = useMemo(() => {
    return (rawMessagesData || []).map(msg => {
      const formatted = formatMessage(msg);
      if (!formatted) return null;
      formatted.sender = formatted.senderName;
      return formatted;
    }).filter(Boolean);
  }, [rawMessagesData]);

  const [collabTasks, setCollabTasks] = useState({});
  const [savedProgress, setSavedProgress] = useState({});
  const [closedCollabs, setClosedCollabs] = useState({});

  const [expandedFailureTask, setExpandedFailureTask] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [failureAlert, setFailureAlert] = useState(null);
  const [failureSaving, setFailureSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // États pour la navigation mobile
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'chat' | 'tasks'

  const getTodayStr = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDeadline, setEditTaskDeadline] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskStartDate, setEditTaskStartDate] = useState('');
  const [editTaskSaving, setEditTaskSaving] = useState(false);
  const [taskAlert, setTaskAlert] = useState(null);
  const [taskSubmitSaving, setTaskSubmitSaving] = useState(false);
  const [taskSubmitAlert, setTaskSubmitAlert] = useState(null);
  const [deletingTaskIds, setDeletingTaskIds] = useState([]);
  const [expandedProofTask, setExpandedProofTask] = useState(null);
  const [uploadingProofTask, setUploadingProofTask] = useState(null);
  const [selectedProofFile, setSelectedProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState(null);
  const [proofPreviewType, setProofPreviewType] = useState(null);
  const [proofUploadError, setProofUploadError] = useState(null);
  const [proofUploadSuccess, setProofUploadSuccess] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [draftTasks, setDraftTasks] = useState([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState(getTodayStr());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalClosing, setTaskModalClosing] = useState(false);
  const [taskModalShowing, setTaskModalShowing] = useState(false);

  // États pour le modal de suggestion d'organisations
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [suggestModalClosing, setSuggestModalClosing] = useState(false);
  const [suggestModalShowing, setSuggestModalShowing] = useState(false);
  const [suggestSearch, setSuggestSearch] = useState('');
  const [suggestedOrgs, setSuggestedOrgs] = useState([]);
  const [suggestAlert, setSuggestAlert] = useState(null);
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);
  const [activeProofPreview, setActiveProofPreview] = useState(null);
  const [expandedCompletedProofs, setExpandedCompletedProofs] = useState([]);

  // États pour le modal de clôture d'incident
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeModalShowing, setCloseModalShowing] = useState(false);
  const [resolutionStartDate, setResolutionStartDate] = useState('');
  const [resolutionEndDate, setResolutionEndDate] = useState('');
  const [resolutionFile, setResolutionFile] = useState(null);
  const [closeAlert, setCloseAlert] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const toggleCompletedProof = (taskId) => {
    setExpandedCompletedProofs(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };


  const [newMessage, setNewMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedAudio, setAttachedAudio] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [downloadingMsgId, setDownloadingMsgId] = useState(null);
  const [openingMsgId, setOpeningMsgId] = useState(null);
  const [activeAudioId, setActiveAudioId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Charger toutes les organisations depuis l'API
  const { data: orgsData } = useSWR(
    'organisations-list',
    async () => {
      try {
        const rawOrgs = await getOrganisationsService();
        return (rawOrgs || []).map(org => formatOrganisation(org)).filter(Boolean);
      } catch (err) {
        console.error('[CollaborationDetail] Erreur chargement organisations list:', err);
        return [];
      }
    },
    {
      revalidateOnFocus: false
    }
  );

  // Données pour les organisations disponibles
  const AVAILABLE_ORGS = useMemo(() => {
    return orgsData || [];
  }, [orgsData]);

  // Détecter le mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1020);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Faire défiler vers le bas quand les messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  // Bloquer le scroll du body quand un modal est ouvert
  useEffect(() => {
    if (showTaskModal || showSuggestModal || showCloseModal || taskToDelete !== null || showReportsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showTaskModal, showSuggestModal, showCloseModal, taskToDelete, showReportsModal]);

  // Mapper les données API vers le format attendu par le composant
  const collaboration = collaborationData ? {
    id: collaborationData.id,
    userRole: collaborationData.role,
    title: collaborationData.incident_details?.title || collaborationData.incident_title || `Incident #${collaborationData.incident}`,
    incidentId: collaborationData.incident,
    userId: collaborationData.user,
    status: collaborationData.status,
    createdAt: collaborationData.created_at,
    motivation: collaborationData.motivation,
    endDate: collaborationData.end_date
      ? new Date(collaborationData.end_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      : 'En cours',
    otherOption: collaborationData.other_option,
    image: collaborationData.incident_details?.photo || '',
    organisation: collaborationData.organisation_name || `Utilisateur #${collaborationData.user}`,
    role: collaborationData.role,
    joinedAt: new Date(collaborationData.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    startDate: new Date(collaborationData.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    location: collaborationData.incident_details?.zone || 'À définir',
    description: collaborationData.incident_details?.description || collaborationData.motivation || 'Aucune description',
    progress: collaborationData.incident_details?.progress || 0,
    tasks: [],
    // Informations additionnelles retournées par l'API
    userFullName: collaborationData.user_full_name,
    userEmail: collaborationData.user_email,
    organisationId: collaborationData.organisation_id,
    incidentDetails: collaborationData.incident_details,
    predictionDetails: collaborationData.prediction_details
  } : null;

  // Utiliser les tâches de l'API en les formatant pour l'affichage
  const currentTasks = useMemo(() => {
    return (tasksData || []).map(task => {
      const formatted = { ...task };
      if (formatted.state === 'done' || formatted.status === 'completed' || formatted.state === 'completed') formatted.completed = true;
      if (formatted.state === 'failed' || formatted.status === 'failed') formatted.failed = true;

      // Normaliser createdBy pour l'affichage local
      if (!formatted.createdBy) {
        if (formatted.created_by === collaboration?.userId) {
          formatted.createdBy = 'me';
        } else {
          formatted.createdBy = formatted.created_by_organisation;
        }
      }

      // Normaliser assignedTo pour l'affichage local
      if (!formatted.assignedTo) {
        if (formatted.assigned_to === collaboration?.userId) {
          formatted.assignedTo = 'me';
        } else {
          formatted.assignedTo = formatted.assigned_to_name;
        }
      }
      return formatted;
    });
  }, [tasksData, collaboration]);

  const hasUnresolvedOrFailedTasks = useMemo(() => {
    if (currentTasks.length === 0) return true;
    return currentTasks.some(task => !task.completed || task.failed);
  }, [currentTasks]);

  // Gestion des états de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="app-container">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className={`collab-detail-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <main className="collaboration-detail-page-wrapper">
            <div className="collaboration-detail-page">
              {/* Header Shimmer */}
              <header className="collab-detail-header">

                <button
                  type="button"
                  className="detail-back-btn"
                  onClick={() => navigate(location.state?.from || '/collaboration')}
                  aria-label="Retour à la liste"
                  style={{ display: 'flex', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                >
                  <ArrowLeft2 size={20} variant="Linear" color="var(--color-text-primary)" />
                </button>
                <div className="collab-detail-header-info" style={{ marginLeft: '12px' }}>
                  <div style={{ width: '180px' }}>
                    <ShimmerTitle line={1} gap={0} variant="primary" />
                  </div>
                  <div style={{ width: '280px', marginTop: '6px' }}>
                    <ShimmerText line={1} gap={0} />
                  </div>
                </div>
              </header>

              {/* Content Shimmer */}
              <div className={`collab-detail-content ${isMobile ? 'mobile-view' : ''}`}>
                {/* Column 1: Details Sidebar */}
                {(!isMobile || activeTab === 'details') && (
                  <aside className="collab-detail-sidebar">
                    <div className="collab-detail-section">
                      <h3 className="collab-detail-section-title">Détails de la collaboration</h3>

                      {/* Progress bar shimmer */}
                      <div className="collab-detail-subsection">
                        <h4 className="collab-detail-subsection-title">Progression globale</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ width: '60px' }}><ShimmerText line={1} /></div>
                          <div style={{ width: '40px' }}><ShimmerText line={1} /></div>
                        </div>
                        <ShimmerThumbnail height={8} rounded />
                      </div>

                      {/* Subsection 1: L'Incident */}
                      <div className="collab-detail-subsection">
                        <h4 className="collab-detail-subsection-title">L'Incident</h4>
                        <div className="collab-detail-meta-group">
                          <div className="collab-detail-meta-row">
                            <span className="collab-detail-meta-label">Titre</span>
                            <div style={{ width: '80%', marginTop: '4px' }}><ShimmerText line={1} gap={0} /></div>
                          </div>
                          <div className="collab-detail-meta-row">
                            <span className="collab-detail-meta-label">Catégorie</span>
                            <div style={{ width: '40%', marginTop: '4px' }}><ShimmerThumbnail height={20} rounded /></div>
                          </div>
                          <div className="collab-detail-meta-row">
                            <span className="collab-detail-meta-label">Zone</span>
                            <div style={{ width: '90%', marginTop: '4px' }}><ShimmerText line={2} gap={4} /></div>
                          </div>
                        </div>
                      </div>

                      {/* Subsection 2: Impact Estimé */}
                      <div className="collab-detail-subsection">
                        <h4 className="collab-detail-subsection-title">Analyse d'Impact IA</h4>
                        <div className="collab-detail-meta-group">
                          <div className="collab-detail-meta-row">
                            <span className="collab-detail-meta-label">Score de gravité</span>
                            <div style={{ width: '30%', marginTop: '4px' }}><ShimmerThumbnail height={32} rounded /></div>
                          </div>
                          <div className="collab-detail-meta-row">
                            <span className="collab-detail-meta-label">Recommandation</span>
                            <div style={{ width: '95%', marginTop: '4px' }}><ShimmerText line={2} gap={4} /></div>
                          </div>
                        </div>
                      </div>

                      {/* Subsection 3: La Collaboration */}
                      <div className="collab-detail-subsection">
                        <h4 className="collab-detail-subsection-title">La Collaboration</h4>
                        <div className="collab-detail-meta-group">
                          <div className="collab-detail-meta-row">
                            <span className="collab-detail-meta-label">Votre rôle</span>
                            <div style={{ width: '35%', marginTop: '4px' }}><ShimmerThumbnail height={24} rounded /></div>
                          </div>
                          <div className="collab-detail-meta-row">
                            <span className="collab-detail-meta-label">Organisation</span>
                            <div style={{ width: '70%', marginTop: '4px' }}><ShimmerText line={1} gap={0} /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>
                )}

                {/* Column 2: Discussion */}
                {(!isMobile || activeTab === 'chat') && (
                  <main className="collab-detail-main">
                    <div className="collab-detail-section">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                        <h3 className="collab-detail-section-title" style={{ margin: 0 }}>Discussion</h3>
                        <button
                          type="button"
                          className="am-btn am-btn--outline w-full"

                        >
                          <DocumentText size={16} variant="Bold" color="var(--color-text-secondary)" />
                          Rapports de terrain
                        </button>
                      </div>

                      <div className="collab-discussion">
                        <div className="collab-discussion-messages" style={{ overflow: 'hidden' }}>
                          {[...Array(3)].map((_, idx) => {
                            const isMe = idx % 2 === 1;
                            return (
                              <div
                                key={idx}
                                className={`collab-message ${isMe ? 'is-me' : ''}`}
                              >
                                <ShimmerThumbnail height={36} width={36} rounded />
                                <div className="collab-message-content">
                                  {!isMe && (
                                    <div style={{ width: '80px', marginBottom: '4px' }}>
                                      <ShimmerText line={1} />
                                    </div>
                                  )}
                                  <div style={{ width: isMe ? '220px' : '300px' }}>
                                    <ShimmerThumbnail height={60} rounded />
                                  </div>
                                  <div style={{ width: '50px', marginTop: '4px' }}>
                                    <ShimmerText line={1} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="collab-discussion-input">
                          <div className="collab-discussion-input-wrapper">
                            <div className="collab-discussion-input-row">
                              <ShimmerThumbnail height={44} width={44} rounded />
                              <div style={{ flex: 1 }}>
                                <ShimmerThumbnail height={44} rounded />
                              </div>
                              <ShimmerThumbnail height={44} width={44} rounded />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </main>
                )}

                {/* Column 3: Tâches */}
                {(!isMobile || activeTab === 'tasks') && (
                  <aside className="collab-detail-tasks">
                    <div className="collab-detail-section">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                        <h3 className="collab-detail-section-title" style={{ margin: 0 }}>Tâches</h3>
                        <ShimmerThumbnail height={36} width={120} rounded />
                      </div>

                      <div className="collab-tasks-list" style={{ overflow: 'hidden' }}>
                        {[...Array(4)].map((_, idx) => (
                          <div key={idx} className="collab-task-item" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }}>
                            <ShimmerThumbnail height={20} width={20} rounded />
                            <div style={{ flex: 1 }}>
                              <div style={{ width: '180px', marginBottom: '8px' }}><ShimmerTitle line={1} gap={0} /></div>
                              <div style={{ width: '100px' }}><ShimmerText line={1} gap={0} /></div>
                            </div>
                            <ShimmerThumbnail height={24} width={24} rounded />
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>
                )}
              </div>

              {/* Bottom Navigation Bar pour Mobile */}
              {isMobile && (
                <div className="collab-mobile-nav">
                  <button
                    className={`collab-mobile-nav-item ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                  >
                    <InfoCircle size={24} variant={'Bold'} />
                    <span>Détails</span>
                  </button>
                  <button
                    className={`collab-mobile-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                  >
                    <Send2 size={24} variant={'Bold'} />
                    <span>Chat</span>
                  </button>
                  <button
                    className={`collab-mobile-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                  >
                    <TaskSquare size={24} variant={'Bold'} />
                    <span>Tâches</span>
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (collaborationError || !collaboration) {
    return (
      <NotFound
        message="Désolé, la collaboration demandée n'existe pas ou vous n'avez pas l'autorisation d'y accéder."
      />
    );
  }

  const isCollabClosed = (collabId) => closedCollabs[collabId] === true;

  const getCalculatedProgress = () => {
    if (!currentTasks.length) return 0;
    const completed = currentTasks.filter(t => t.completed || t.status === 'completed').length;
    return Math.round((completed / currentTasks.length) * 100);
  };

  const getSavedProgress = () => {
    return savedProgress[collaboration?.id] ?? collaboration?.progress ?? 0;
  };

  const hasPendingChanges = () => {
    const calculated = getCalculatedProgress();
    const saved = getSavedProgress();
    return calculated !== saved;
  };

  const saveProgress = () => {
    setSavedProgress(prev => ({
      ...prev,
      [collaboration?.id]: getCalculatedProgress()
    }));
  };

  // Marquer une tâche comme terminée via API (avec preuve optionnelle)
  const toggleTask = async (taskId) => {
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      if (task.completed || task.status === 'completed') {
        // Remettre en cours via patch
        await updateTaskService(incidentId, taskId, { status: 'in_progress' });
      } else {
        // Marquer comme complétée (sans preuve)
        const formData = new FormData();
        await completeTaskService(incidentId, taskId, formData);
      }
      await mutateTasks();
    } catch (err) {
      console.error('[toggleTask] Erreur:', err);
    }
  };

  // Marquer une tâche comme échouée via API
  const markTaskFailed = async (taskId, reason) => {
    setFailureSaving(true);
    setFailureAlert(null);
    try {
      await failTaskService(incidentId, taskId, { failure_reason: reason });
      await mutateTasks();
      setFailureAlert({ type: 'success', message: 'Tâche marquée comme échouée avec succès.' });
      setTimeout(() => {
        setExpandedFailureTask(null);
        setFailureReason('');
        setFailureAlert(null);
      }, 1500);
    } catch (err) {
      console.error('[markTaskFailed] Erreur:', err);
      let errorMessage = "Erreur lors du marquage de la tâche.";
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errorMessage = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join(' | ');
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      }
      setFailureAlert({ type: 'danger', message: errorMessage });
    } finally {
      setFailureSaving(false);
    }
  };

  // Remettre une tâche à "en cours" via API
  const resetTaskStatus = async (taskId) => {
    try {
      await updateTaskService(incidentId, taskId, { status: 'in_progress' });
      await mutateTasks();
    } catch (err) {
      console.error('[resetTaskStatus] Erreur:', err);
    }
  };

  // Uploader une preuve (image/vidéo/document) pour terminer une tâche via API
  const handleProofUpload = async (taskId, file) => {
    setProofUploadError(null);
    setProofUploadSuccess(null);
    try {
      const formData = new FormData();
      if (file.type && file.type.startsWith('video/')) {
        formData.append('proof_video', file);
      } else if (file.type && file.type.startsWith('image/')) {
        formData.append('proof_image', file);
      } else {
        // Pour les documents (PDF, Word, Excel, etc.)
        formData.append('proof_image', file);
      }
      await completeTaskService(incidentId, taskId, formData);
      await mutateTasks();
      setProofUploadSuccess('Preuve téléversée et tâche terminée avec succès !');
      return true;
    } catch (err) {
      console.error('[handleProofUpload] Erreur:', err);
      let errorMessage = "Erreur lors de l'envoi de la preuve.";
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errorMessage = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join(' | ');
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      }
      setProofUploadError(errorMessage);
      throw err;
    }
  };

  // Ouvrir le modal des tâches avec initialisation
  const openTaskModal = () => {
    setShowTaskModal(true);
    setTimeout(() => {
      setTaskModalShowing(true);
    }, 10);
  };

  // Ajouter une tâche à la liste temporaire (draft)
  const addDraftTask = () => {
    if (!newTaskTitle.trim()) return;
    setTaskSubmitAlert(null);

    const todayStr = getTodayStr();

    // Validation 1: Date de début ne peut pas être dans le passé
    if (newTaskStartDate && newTaskStartDate < todayStr) {
      setTaskSubmitAlert({
        type: 'danger',
        message: "La date de début ne peut pas être antérieure à la date d'aujourd'hui."
      });
      return;
    }

    if (newTaskStartDate && newTaskDeadline) {
      // Validation 2: Date de début ne peut pas être égale à la date de fin
      if (newTaskStartDate === newTaskDeadline) {
        setTaskSubmitAlert({
          type: 'danger',
          message: "La date de début ne peut pas être égale à la date de fin."
        });
        return;
      }
      // Validation 3: Date de début ne peut pas être supérieure à la date de fin
      if (newTaskStartDate > newTaskDeadline) {
        setTaskSubmitAlert({
          type: 'danger',
          message: "La date de début ne peut pas être supérieure à la date de fin."
        });
        return;
      }
    }

    const task = {
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || null,
      start_date: newTaskStartDate || null,
      end_date: newTaskDeadline || null,
      assigned_to: collaboration?.userId ? parseInt(collaboration.userId) : null
    };
    setDraftTasks([...draftTasks, task]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskStartDate(getTodayStr());
    setNewTaskDeadline('');
  };

  // Créer toutes les tâches draftées dans la base de données via API
  const submitNewTask = async () => {
    if (draftTasks.length === 0) {
      closeTaskModal();
      return;
    }

    setTaskSubmitSaving(true);
    setTaskSubmitAlert(null);

    try {
      // Créer chaque tâche séquentiellement/en parallèle via l'API
      await Promise.all(
        draftTasks.map(task =>
          createTaskService(incidentId, {
            incident: parseInt(incidentId),
            title: task.title,
            description: task.description || null,
            start_date: task.start_date || null,
            end_date: task.end_date || null,
            assigned_to: task.assigned_to || null
          })
        )
      );

      await mutateTasks();
      setTaskSubmitAlert({ type: 'success', message: 'Tâche(s) créée(s) et ajoutée(s) avec succès !' });

      // Afficher l'alerte pendant 2 secondes puis refermer le modal
      setTimeout(() => {
        closeTaskModal();
      }, 2000);
    } catch (err) {
      console.error('[submitNewTask] Erreur lors de la création:', err);
      let errorMessage = 'Une erreur est survenue lors de la création des tâches.';
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errorMessage = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join(' | ');
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      }
      setTaskSubmitAlert({ type: 'danger', message: errorMessage });
      setTaskSubmitSaving(false); // Réactive le bouton et cache le loader
    }
  };

  // Supprimer une tâche via API
  const deleteTask = async (taskId) => {
    setDeletingTaskIds(prev => [...prev, taskId]);
    try {
      await deleteTaskService(incidentId, taskId);
      await mutateTasks();
    } catch (err) {
      console.error('[deleteTask] Erreur:', err);
    } finally {
      setDeletingTaskIds(prev => prev.filter(id => id !== taskId));
    }
  };

  // Modifier une tâche via API
  const startEditTask = (task) => {
    setTaskAlert(null); // Reset alert
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskStartDate(task.start_date || '');
    setEditTaskDeadline(task.end_date || task.deadline || '');
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskDescription('');
    setEditTaskStartDate('');
    setEditTaskDeadline('');
    setTaskAlert(null);
  };

  const saveEditTask = async (taskId) => {
    if (!editTaskTitle.trim()) return;
    setTaskAlert(null);

    const todayStr = getTodayStr();

    // Validation 1: Date de début ne peut pas être dans le passé
    if (editTaskStartDate && editTaskStartDate < todayStr) {
      setTaskAlert({
        type: 'danger',
        message: "La date de début ne peut pas être antérieure à la date d'aujourd'hui."
      });
      return;
    }

    if (editTaskStartDate && editTaskDeadline) {
      // Validation 2: Date de début ne peut pas être égale à la date de fin
      if (editTaskStartDate === editTaskDeadline) {
        setTaskAlert({
          type: 'danger',
          message: "La date de début ne peut pas être égale à la date de fin."
        });
        return;
      }
      // Validation 3: Date de début ne peut pas être supérieure à la date de fin
      if (editTaskStartDate > editTaskDeadline) {
        setTaskAlert({
          type: 'danger',
          message: "La date de début ne peut pas être supérieure à la date de fin."
        });
        return;
      }
    }

    setEditTaskSaving(true);
    try {
      await updateTaskService(incidentId, taskId, {
        incident: parseInt(incidentId),
        title: editTaskTitle.trim(),
        description: editTaskDescription.trim() || null,
        start_date: editTaskStartDate || null,
        end_date: editTaskDeadline || null,
        status: 'in_progress'
      });
      await mutateTasks();
      setTaskAlert({ type: 'success', message: 'Tâche modifiée avec succès !' });
      setTimeout(() => {
        cancelEditTask();
      }, 1500);
    } catch (err) {
      console.error('[saveEditTask] Erreur:', err);
      let errorMessage = 'Une erreur est survenue lors de la modification de la tâche.';
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errorMessage = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join(' | ');
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      }
      setTaskAlert({ type: 'danger', message: errorMessage });
    } finally {
      setEditTaskSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (allowedTypes.includes(file.type)) {
        setAttachedFile(file);
      } else {
        alert('Type de fichier non supporté. Veuillez choisir un fichier PDF, Word ou Excel.');
      }
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAudioSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAttachedAudio(file);
      } else {
        alert('Veuillez choisir un fichier audio valide.');
      }
    }
  };

  const removeAttachedAudio = () => {
    setAttachedAudio(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'enregistrement_vocal.webm', { type: 'audio/webm' });
          setAttachedAudio(audioFile);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erreur d'accès au microphone:", err);
      alert("Impossible d'accéder au microphone. Veuillez vérifier vos permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = []; // Ignorer les données
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
      setAttachedAudio(null);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  const getFileIcon = (fileName) => {
    if (!fileName) return '📎';
    const cleanName = fileName.split('?')[0];
    const ext = cleanName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    if (ext === 'xls' || ext === 'xlsx') return '📊';
    if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)) return '🎵';
    return '📎';
  };

  const handleDownload = async (url, fileName, msgId) => {
    try {
      setDownloadingMsgId(msgId);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erreur réseau');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      window.open(url, '_blank');
    } finally {
      setDownloadingMsgId(null);
    }
  };
  const handleOpen = async (url, msgId) => {
    try {
      setOpeningMsgId(msgId);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erreur réseau');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      // On nettoie après un délai raisonnable
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture:', error);
      window.open(url, '_blank');
    } finally {
      setOpeningMsgId(null);
    }
  };


  const sendMessage = async () => {
    if (!newMessage.trim() && !attachedFile && !attachedAudio) return;

    setSendingMessage(true);
    try {
      if (attachedAudio) {
        await sendMessageService(incidentId, {
          message: newMessage.trim(),
          audio: attachedAudio
        });
      } else if (attachedFile) {
        await sendMessageService(incidentId, {
          message: newMessage.trim(),
          attachment: attachedFile
        });
      } else {
        await sendMessageService(incidentId, {
          message: newMessage.trim()
        });
      }

      await mutateMessages();
      setNewMessage('');
      setAttachedFile(null);
      setAttachedAudio(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('[sendMessage] Erreur envoi message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const closeTaskModal = () => {
    setTaskModalShowing(false);
    setTaskModalClosing(true);
    setTimeout(() => {
      setShowTaskModal(false);
      setTaskModalClosing(false);
      setDraftTasks([]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskStartDate(getTodayStr());
      setNewTaskDeadline('');
      setTaskSubmitAlert(null);
      setTaskSubmitSaving(false);
    }, 300);
  };

  // Fermeture du modal de suggestion avec animation
  const closeSuggestModal = () => {
    setSuggestModalShowing(false);
    setSuggestModalClosing(true);
    setTimeout(() => {
      setShowSuggestModal(false);
      setSuggestModalClosing(false);
      setSuggestSearch('');
      setSuggestedOrgs([]);
      setSuggestAlert(null);
    }, 300);
  };

  // Ouvrir le modal de clôture d'incident
  const openCloseModal = () => {
    setShowCloseModal(true);
    setResolutionStartDate('');
    setResolutionEndDate('');
    setResolutionFile(null);
    setCloseAlert(null);
    setTimeout(() => {
      setCloseModalShowing(true);
    }, 10);
  };

  // Fermer le modal de clôture d'incident
  const closeCloseModal = () => {
    setCloseModalShowing(false);
    setTimeout(() => {
      setShowCloseModal(false);
      setResolutionStartDate('');
      setResolutionEndDate('');
      setResolutionFile(null);
      setCloseAlert(null);
    }, 300);
  };

  // Clôturer l'incident
  const handleCloseIncident = async () => {
    if (!resolutionStartDate || !resolutionEndDate) {
      setCloseAlert({ type: 'danger', message: 'Veuillez renseigner les deux dates.' });
      return;
    }

    if (new Date(resolutionStartDate) > new Date(resolutionEndDate)) {
      setCloseAlert({ type: 'danger', message: 'La date de début doit être antérieure à la date de fin.' });
      return;
    }

    setIsClosing(true);
    setCloseAlert(null);

    try {
      await closeIncidentService(collaboration.incidentId, {
        resolution_start_date: resolutionStartDate,
        resolution_end_date: resolutionEndDate,
        resolution_file: resolutionFile
      });
      setCloseAlert({ type: 'success', message: 'Incident résolu avec succès !' });
      setTimeout(() => {
        closeCloseModal();
        window.location.reload(); // Recharger pour mettre à jour l'état
      }, 2000);
    } catch (err) {
      console.error('[CloseIncident] Erreur:', err);
      const errorMsg = err?.detail || err?.message || 'Erreur lors de la résolution de l\'incident.';
      setCloseAlert({ type: 'danger', message: errorMsg });
    } finally {
      setIsClosing(false);
    }
  };

  // Envoi des suggestions d'organisations partenaires
  const handleSuggestSubmit = async () => {
    if (!suggestedOrgs.length || !collaboration?.id) return;
    setSuggestSubmitting(true);
    setSuggestAlert(null);
    const errors = [];
    const successes = [];



    const results = await Promise.allSettled(
      suggestedOrgs.map(org =>
        suggestCollaborationPartnerService(collaboration.incidentId, {
          incident: collaboration.incidentId,
          suggested_partner: org.id,
          suggested_role: org.role === 'observateur' ? 'observer' : 'contributor',
          justification: org.comment || ''
        }).then(() => ({ ok: true, name: org.name }))
          .catch(err => {
            const data = err?.response?.data;
            let errorDetail = 'Erreur inconnue';
            if (data) {
              if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
                const msg = data.non_field_errors[0];
                errorDetail = msg.includes('unique set')
                  ? 'déjà invitée ou suggérée pour cet incident'
                  : msg;
              } else if (data.detail) {
                errorDetail = data.detail;
              } else if (data.message) {
                errorDetail = data.message;
              } else {
                const keys = Object.keys(data);
                if (keys.length > 0) {
                  const val = data[keys[0]];
                  const msg = Array.isArray(val) ? val[0] : String(val);
                  errorDetail = msg.includes('unique set')
                    ? 'déjà invitée ou suggérée pour cet incident'
                    : msg;
                } else {
                  errorDetail = err?.message || 'Erreur inconnue';
                }
              }
            } else {
              errorDetail = err?.message || 'Erreur inconnue';
            }
            return {
              ok: false,
              name: org.name,
              detail: errorDetail
            };
          })
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.ok) successes.push(result.value.name);
        else errors.push(`${result.value.name} : ${result.value.detail}`);
      }
    }

    setSuggestSubmitting(false);
    if (errors.length === 0) {
      setSuggestAlert({ type: 'success', message: `Suggestion(s) envoyée(s) avec succès pour : ${successes.join(', ')}.` });
      setSuggestedOrgs([]);
    } else if (successes.length > 0) {
      setSuggestAlert({ type: 'warning', message: `Succès : ${successes.join(', ')}. Erreurs : ${errors.join(' | ')}` });
    } else {
      setSuggestAlert({ type: 'danger', message: errors.join(' | ') });
    }
  };

  // Gestion des organisations suggérées
  const toggleSuggestedOrg = (org) => {


    setSuggestedOrgs(prev => {
      const exists = prev.find(o => o.id === org.id);
      if (exists) {
        return prev.filter(o => o.id !== org.id);
      } else {
        return [...prev, { ...org, role: 'contributeur', comment: '' }];
      }
    });
  };

  const updateSuggestedRole = (orgId, roleId) => {
    setSuggestedOrgs(prev =>
      prev.map(org => org.id === orgId ? { ...org, role: roleId } : org)
    );
  };

  const updateSuggestedComment = (orgId, comment) => {
    setSuggestedOrgs(prev =>
      prev.map(org => org.id === orgId ? { ...org, comment } : org)
    );
  };

  // Options de rôles
  const ROLE_OPTIONS = [

    {
      id: 'contributeur',
      label: 'Contributeur',
      icon: People,
      color: '#3AA2DD',
      description: 'Peut participer activement et créer des tâches'
    },
    {
      id: 'observateur',
      label: 'Observateur',
      icon: Eye,
      color: '#6C7278',
      description: 'Peut uniquement consulter les informations'
    }
  ];

  const contextValue = {
    collaboration,
    showSuggestModal,
    suggestModalClosing,
    suggestModalShowing,
    closeSuggestModal,
    suggestSearch,
    setSuggestSearch,
    suggestedOrgs,
    toggleSuggestedOrg,
    updateSuggestedRole,
    updateSuggestedComment,
    suggestAlert,
    setSuggestAlert,
    suggestSubmitting,
    handleSuggestSubmit,
    ROLE_OPTIONS,
    AVAILABLE_ORGS,
    showTaskModal,
    setShowTaskModal,
    taskModalClosing,
    setTaskModalClosing,
    taskModalShowing,
    closeTaskModal,
    openTaskModal,
    draftTasks,
    setDraftTasks,
    newTaskTitle,
    setNewTaskTitle,
    newTaskDescription,
    setNewTaskDescription,
    newTaskStartDate,
    setNewTaskStartDate,
    newTaskDeadline,
    setNewTaskDeadline,
    addDraftTask,
    submitNewTask,
    currentTasks,
    editingTaskId,
    setEditingTaskId,
    editTaskTitle,
    setEditTaskTitle,
    editTaskDescription,
    setEditTaskDescription,
    editTaskStartDate,
    setEditTaskStartDate,
    editTaskDeadline,
    setEditTaskDeadline,
    editTaskSaving,
    taskAlert,
    taskSubmitSaving,
    taskSubmitAlert,
    deletingTaskIds,
    startEditTask,
    cancelEditTask,
    saveEditTask,
    deleteTask,
    taskToDelete,
    setTaskToDelete
  };

  return (
    <CollaborationDetailProvider value={contextValue}>
      <div className="app-container">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={`collab-detail-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>


          <main className=" collaboration-detail-page-wrapper">
            <div className="collaboration-detail-page">
              {/* Header */}
              <header className="collab-detail-header">

                <button
                  type="button"
                  className="detail-back-btn"
                  onClick={() => navigate(location.state?.from || '/collaboration')}
                  aria-label="Retour à la liste"
                  style={{ display: 'flex', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                >
                  <ArrowLeft2 size={20} variant="Linear" color="var(--color-text-primary)" />
                </button>
                <div className="collab-detail-header-info">
                  <h1 className="collab-detail-title">{collaboration?.title}</h1>
                  <p className="collab-detail-subtitle">
                    {collaboration?.organisation} • {collaboration?.location}
                  </p>
                </div>
                {isCollabClosed(collaboration?.id) ? (
                  <div className="collab-detail-closed-badge">
                    <Lock1 size={16} variant="Bold" color="#FFFFFF" />
                    Clôturée
                  </div>
                ) : collaboration?.userRole === 'leader' && (
                  <button
                    type="button"
                    onClick={openCloseModal}
                    className='btn btn-success'
                    disabled={hasUnresolvedOrFailedTasks}
                    title={hasUnresolvedOrFailedTasks ? (currentTasks.length === 0 ? "Vous devez créer au moins une tâche avant de résoudre l'incident." : "Toutes les tâches doivent être complétées et aucune ne doit avoir échoué pour résoudre l'incident.") : "Résoudre l'incident"}
                  >
                    Résoudre l'incident
                  </button>
                )}
              </header>

              {/* Content - 3 colonnes (desktop) ou 1 colonne avec tabs (mobile) */}
              <div className={`collab-detail-content ${isMobile ? 'mobile-view' : ''}`}>
                {/* Section 1: Détails de la collaboration */}
                {(!isMobile || activeTab === 'details') && (
                  <aside className="collab-detail-sidebar">
                    <div className="collab-detail-section">
                      <h3 className="collab-detail-section-title">Détails de la collaboration</h3>

                      {collaboration?.image && (
                        <div className="collab-detail-image">
                          <BlurryImage src={collaboration?.image} alt={collaboration?.title} />
                        </div>
                      )}

                      {/* Progression globale */}
                      <div className="collab-detail-subsection">
                        <h4 className="collab-detail-subsection-title">Progression globale</h4>
                        <div className="collab-detail-progress">
                          <div className="collab-detail-progress-header">
                            {hasPendingChanges() && (
                              <span className="collab-detail-progress-saved">
                                Sauvegardée : {getSavedProgress()}%
                              </span>
                            )}
                            <span className="collab-detail-progress-percent">
                              {getCalculatedProgress()}%
                            </span>
                          </div>
                          <div className="collab-detail-progress-bar">
                            <div
                              className="collab-detail-progress-fill"
                              style={{ width: `${getCalculatedProgress()}%` }}
                            />
                          </div>
                          <div className="collab-detail-progress-stats">
                            <span>{currentTasks.filter(t => t.completed).length} terminées</span>
                            <span>•</span>
                            <span>{currentTasks.filter(t => t.failed).length} échouées</span>
                            <span>•</span>
                            <span>{currentTasks.filter(t => !t.completed && !t.failed).length} en cours</span>
                          </div>
                        </div>
                      </div>

                      {/* Subsection 1: L'Incident (Most Important) */}
                      <div className="collab-detail-subsection">
                        <h4 className="collab-detail-subsection-title">L'Incident</h4>
                        <div className="collab-detail-meta-group">
                          {collaboration?.title && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Titre</span>
                              <span className="collab-detail-meta-val text-highlight">{collaboration.title}</span>
                            </div>
                          )}
                          {(collaboration?.predictionDetails?.sub_category || collaboration?.predictionDetails?.macro_category) && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Catégorie</span>
                              <span className="collab-detail-meta-val">
                                <span className="collab-detail-badge badge-primary">
                                  {collaboration.predictionDetails.sub_category || collaboration.predictionDetails.macro_category}
                                </span>
                              </span>
                            </div>
                          )}
                          {(collaboration?.predictionDetails?.display_name || collaboration?.location) && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Zone / Localisation</span>
                              <span className="collab-detail-meta-val">{collaboration.predictionDetails?.display_name || collaboration.location}</span>
                            </div>
                          )}
                          {(collaboration?.predictionDetails?.latitude || collaboration?.incidentDetails?.lattitude) && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Coordonnées</span>
                              <span className="collab-detail-meta-val">
                                {collaboration.predictionDetails?.latitude || collaboration.incidentDetails?.lattitude}, {collaboration.predictionDetails?.longitude || collaboration.incidentDetails?.longitude}
                              </span>
                            </div>
                          )}
                          {collaboration?.incidentDetails?.etat && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">État incident</span>
                              <span className="collab-detail-meta-val">
                                <span className={`collab-detail-badge ${getEtatBadgeClass(collaboration.incidentDetails.etat)}`}>
                                  {formatEtat(collaboration.incidentDetails.etat)}
                                </span>
                              </span>
                            </div>
                          )}
                          {collaboration?.description && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Description</span>
                              <span className="collab-detail-meta-val" style={{ whiteSpace: 'pre-wrap' }}>{collaboration.description}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subsection 2: Impact Estimé & IA (Second Most Important) */}
                      <div className="collab-detail-subsection">
                        <h4 className="collab-detail-subsection-title">Analyse d'Impact IA</h4>
                        {collaboration?.predictionDetails ? (
                          <div className="collab-detail-meta-group">
                            {collaboration.predictionDetails.global_impact_score !== undefined && (
                              <div className="collab-detail-meta-row">
                                <span className="collab-detail-meta-label">Score de gravité</span>
                                <div className="collab-detail-gravity-badge">
                                  {collaboration.predictionDetails.global_impact_score}
                                  <span className="collab-detail-gravity-max">/10</span>
                                </div>
                              </div>
                            )}

                            {collaboration.predictionDetails.recommendation && (
                              <div className="collab-detail-meta-row">
                                <span className="collab-detail-meta-label">Recommandation</span>
                                <span className="collab-detail-meta-val text-highlight" style={{ fontSize: '13px' }}>
                                  {collaboration.predictionDetails.recommendation}
                                </span>
                              </div>
                            )}

                            {collaboration.predictionDetails.total_population_exposed !== undefined && (
                              <div className="collab-detail-meta-row">
                                <span className="collab-detail-meta-label">Population exposée</span>
                                <span className="collab-detail-meta-val" style={{ fontWeight: '600' }}>
                                  {collaboration.predictionDetails.total_population_exposed} personnes
                                </span>
                                {(collaboration.predictionDetails.children_exposed !== undefined ||
                                  collaboration.predictionDetails.adult_men_exposed !== undefined ||
                                  collaboration.predictionDetails.adult_women_exposed !== undefined) && (
                                    <span className="collab-detail-meta-val" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                      (Enfants : {collaboration.predictionDetails.children_exposed || 0}, Hommes : {collaboration.predictionDetails.adult_men_exposed || 0}, Femmes : {collaboration.predictionDetails.adult_women_exposed || 0})
                                    </span>
                                  )}
                              </div>
                            )}

                            {(collaboration.predictionDetails.residential_buildings !== undefined ||
                              collaboration.predictionDetails.water_points !== undefined) && (
                                <div className="collab-detail-meta-row">
                                  <span className="collab-detail-meta-label">Infrastructures à risque</span>
                                  <span className="collab-detail-meta-val">
                                    {[
                                      collaboration.predictionDetails.residential_buildings !== undefined && `${collaboration.predictionDetails.residential_buildings} bâtiment(s) résidentiel(s)`,
                                      collaboration.predictionDetails.water_points !== undefined && `${collaboration.predictionDetails.water_points} point(s) d'eau`,
                                      collaboration.predictionDetails.schools !== undefined && collaboration.predictionDetails.schools > 0 && `${collaboration.predictionDetails.schools} école(s)`,
                                      collaboration.predictionDetails.health_centers !== undefined && collaboration.predictionDetails.health_centers > 0 && `${collaboration.predictionDetails.health_centers} centre(s) de santé`
                                    ].filter(Boolean).join(', ') || 'Aucune identifiée'}
                                  </span>
                                </div>
                              )}

                            {collaboration.predictionDetails.potential_risk?.message && (
                              <div className="collab-detail-meta-row">
                                <span className="collab-detail-meta-label">Vecteur de propagation</span>
                                <span className="collab-detail-meta-val" style={{ fontSize: '13px' }}>
                                  {collaboration.predictionDetails.potential_risk.message}
                                </span>
                              </div>
                            )}

                            {collaboration.predictionDetails.impact_tags && collaboration.predictionDetails.impact_tags.length > 0 && (
                              <div className="collab-detail-meta-row">
                                <span className="collab-detail-meta-label">Domaines d'impact</span>
                                <div className="collab-detail-tag-list">
                                  {collaboration.predictionDetails.impact_tags.map((tag, i) => (
                                    <span key={i} className="collab-detail-tag">{tag}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="collab-detail-meta-val" style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                            Aucune prédiction IA disponible pour cet incident.
                          </div>
                        )}
                      </div>

                      {/* Subsection 3: Collaboration & Participation (Third Most Important) */}
                      <div className="collab-detail-subsection">
                        <h4 className="collab-detail-subsection-title">La Collaboration</h4>
                        <div className="collab-detail-meta-group">
                          {collaboration?.userRole && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Votre rôle</span>
                              <span className="collab-detail-meta-val">
                                <span className={`collab-detail-badge ${getRoleBadgeClass(collaboration.userRole)}`}>
                                  {formatRole(collaboration.userRole)}
                                </span>
                              </span>
                            </div>
                          )}
                          {collaboration?.organisation && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Organisation</span>
                              <span className="collab-detail-meta-val" style={{ fontWeight: '500' }}>{collaboration.organisation}</span>
                            </div>
                          )}
                          {collaboration?.userFullName && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Collaborateur</span>
                              <span className="collab-detail-meta-val">
                                {collaboration.userFullName}
                              </span>
                            </div>
                          )}
                          {collaboration?.status && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Statut invitation</span>
                              <span className="collab-detail-meta-val">
                                <span className={`collab-detail-badge ${getStatusBadgeClass(collaboration.status)}`}>
                                  {formatStatus(collaboration.status)}
                                </span>
                              </span>
                            </div>
                          )}
                          {collaboration?.joinedAt && (
                            <div className="collab-detail-meta-row">
                              <span className="collab-detail-meta-label">Rejoint le</span>
                              <span className="collab-detail-meta-val">{collaboration.joinedAt}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bouton suggérer/inviter des organisations */}
                      <div className="collab-detail-info-block" style={{ marginTop: 'var(--spacing-4)' }}>
                        <button
                          type="button"
                          className="collab-suggest-org-btn"
                          onClick={() => {
                            setShowSuggestModal(true);
                            setTimeout(() => setSuggestModalShowing(true), 10);
                          }}
                        >
                          <span>
                            {collaboration?.userRole === 'leader'
                              ? 'Inviter des organisations'
                              : 'Suggérer des organisations'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </aside>
                )}

                {/* Section 2: Discussion */}
                {(!isMobile || activeTab === 'chat') && (
                  <main className="collab-detail-main">
                    <div className="collab-detail-section">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                        <h3 className="collab-detail-section-title" style={{ margin: 0 }}>Discussion</h3>
                        <button
                          type="button"

                          className="am-btn am-btn--outline w-full"
                          style={{ width: "fit-content" }}
                          onClick={() => setShowReportsModal(true)}

                        >
                          <DocumentText size={16} variant="Bold" color="var(--color-text-secondary)" />
                          Rapports de terrain
                        </button>
                      </div>

                      <div className="collab-discussion">
                        <div className="collab-discussion-messages">
                          {messages.length === 0 ? (
                            <div className="collab-discussion-empty">
                              <Send2 size={48} color="var(--color-text-secondary)" />
                              <p className="collab-empty-title">Aucun message pour le moment</p>
                              <p className="collab-empty-subtitle">Lancez la discussion en envoyant le premier message aux collaborateurs.</p>
                            </div>
                          ) : (
                            messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`collab-message ${msg.isMe ? 'is-me' : ''}`}
                              >
                                {!msg.isMe && (
                                  <div
                                    className="collab-message-avatar"
                                    style={{ backgroundColor: msg.senderColor }}
                                  >
                                    {msg.senderInitials}
                                  </div>
                                )}
                                <div className="collab-message-content">
                                  {!msg.isMe && (
                                    <div className="collab-message-sender">{msg.sender}</div>
                                  )}
                                  <div
                                    className={`collab-message-bubble ${(!msg.message && (msg.file || msg.audio)) ? 'is-media-only' : ''}`}
                                    style={(!msg.message && (msg.file || msg.audio)) ? { background: 'transparent', padding: 0, boxShadow: 'none', border: 'none' } : {}}
                                  >
                                    {msg.message && <div style={{ marginBottom: (msg.file || msg.audio) ? '6px' : '0' }}>{msg.message}</div>}
                                    {msg.file && (
                                      <div className="collab-message-file" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        backgroundColor: 'var(--color-surface)',
                                        borderRadius: '12px',
                                        marginTop: '4px',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        textAlign: 'left',
                                        minWidth: '240px'
                                      }}>
                                        <span className="collab-message-file-icon" style={{ display: 'flex', alignItems: 'center', fontSize: '24px' }}>
                                          {getFileIcon(msg.file.name)}
                                        </span>
                                        <div className="collab-message-file-info" style={{ flex: 1 }}>
                                          <div style={{ fontWeight: '500', fontSize: 'var(--font-size-body-small)', wordBreak: 'break-all', color: 'var(--color-text-primary)' }}>
                                            {msg.file.name}
                                          </div>
                                          <div className="collab-message-file-actions" style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                                            <button
                                              type="button"
                                              onClick={() => handleDownload(msg.file.url, msg.file.name, msg.id)}
                                              disabled={downloadingMsgId === msg.id}
                                              style={{ background: 'none', border: 'none', padding: 0, fontSize: '11px', fontWeight: '500', color: 'var(--color-primary)', textDecoration: 'none', cursor: downloadingMsgId === msg.id ? 'not-allowed' : 'pointer', opacity: downloadingMsgId === msg.id ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                              {downloadingMsgId === msg.id ? (
                                                <>
                                                  <svg style={{ animation: 'spin 1s linear infinite', width: '12px', height: '12px', color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                                                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
                                                  </svg>
                                                  <span>En cours...</span>
                                                </>
                                              ) : (
                                                'Télécharger'
                                              )}
                                            </button>
                                            {msg.file.size > 0 && (
                                              <>
                                                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>•</span>
                                                <span className="collab-message-file-size" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                                  {(msg.file.size / 1024).toFixed(2)} KB
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {msg.audio && (
                                      <div className="collab-message-audio" style={{
                                        padding: '8px 12px',
                                        backgroundColor: 'var(--color-surface)',
                                        borderRadius: '12px',
                                        marginTop: '4px',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        display: 'inline-block'
                                      }}>
                                        <CustomAudioPlayer
                                          id={msg.id}
                                          src={msg.audio}
                                          activeAudioId={activeAudioId}
                                          setActiveAudioId={setActiveAudioId}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="collab-message-time">
                                    {formatMessageTime(msg.timestamp)}
                                  </div>
                                </div>
                                {msg.isMe && (
                                  <div
                                    className="collab-message-avatar"
                                    style={{ backgroundColor: msg.senderColor }}
                                  >
                                    {msg.senderInitials}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {!isCollabClosed(collaboration?.id) && (
                          <div className="collab-discussion-input">
                            <div className="collab-discussion-input-wrapper">
                              {attachedFile && (
                                <div className="collab-attached-file">
                                  <span className="collab-attached-file-icon">{getFileIcon(attachedFile.name)}</span>
                                  <span className="collab-attached-file-name">{attachedFile.name}</span>
                                  <button
                                    type="button"
                                    className="collab-attached-file-remove"
                                    onClick={removeAttachedFile}
                                    title="Supprimer le fichier"
                                    disabled={sendingMessage}
                                  >
                                    <CloseSquare size={16} variant="Bold" color="#EF4444" />
                                  </button>
                                </div>
                              )}
                              {attachedAudio && (
                                <div className="collab-attached-file">
                                  <span className="collab-attached-file-icon">🎵</span>
                                  <span className="collab-attached-file-name">{attachedAudio.name}</span>
                                  <button
                                    type="button"
                                    className="collab-attached-file-remove"
                                    onClick={removeAttachedAudio}
                                    title="Supprimer l'audio"
                                    disabled={sendingMessage}
                                  >
                                    <CloseSquare size={16} variant="Bold" color="#EF4444" />
                                  </button>
                                </div>
                              )}
                              {isRecording ? (
                                <div className="collab-discussion-input-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'var(--color-surface)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, }}>
                                    <div className="collab-audio-wave">
                                      {Array.from({ length: 40 }).map((_, i) => (
                                        <div
                                          key={i}
                                          className="collab-audio-wave-bar"
                                          style={{ animationDelay: `${(Math.sin(i * 0.5) + 1) * 0.6}s` }}
                                        />
                                      ))}
                                    </div>
                                    <span className='body-large' style={{ color: "var(--color-text-primary)" }}>{formatRecordingTime(recordingTime)}</span>
                                  </div>

                                  <button type="button" onClick={stopRecording} title="Valider l'enregistrement" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TickCircle size={28} variant="Bold" color="var(--color-primary)" />
                                  </button>
                                </div>
                              ) : (
                                <div className="collab-discussion-input-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <label className="collab-discussion-attach" title="Joindre un fichier" style={{ opacity: sendingMessage ? 0.5 : 1, pointerEvents: sendingMessage ? 'none' : 'auto' }}>
                                    <Paperclip size={20} variant="Bold" color="var(--color-text-secondary)" />
                                    <input
                                      ref={fileInputRef}
                                      type="file"
                                      accept=".pdf,.doc,.docx,.xls,.xlsx,audio/*"
                                      onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          if (file.type.startsWith('audio/')) {
                                            handleAudioSelect(e);
                                          } else {
                                            handleFileSelect(e);
                                          }
                                        }
                                      }}
                                      style={{ display: 'none' }}
                                      disabled={sendingMessage}
                                    />
                                  </label>
                                  <input
                                    type="text"
                                    className="collab-discussion-field"
                                    placeholder={sendingMessage ? "Envoi en cours..." : "Écrivez un message..."}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={sendingMessage}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                      }
                                    }}
                                  />

                                  {(!newMessage.trim() && !attachedFile && !attachedAudio) ? (
                                    <button
                                      type="button"
                                      className="collab-discussion-send"
                                      onClick={startRecording}
                                      disabled={sendingMessage}
                                      title="Enregistrer un message vocal"
                                      style={{ opacity: sendingMessage ? 0.6 : 1, cursor: sendingMessage ? 'not-allowed' : 'pointer', backgroundColor: 'var(--color-primary)' }}
                                    >
                                      <Microphone size={20} variant="Bold" color="#FFFFFF" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="collab-discussion-send"
                                      onClick={sendMessage}
                                      disabled={sendingMessage}
                                      title="Envoyer le message"
                                      style={{ opacity: sendingMessage ? 0.6 : 1, cursor: sendingMessage ? 'not-allowed' : 'pointer' }}
                                    >
                                      {sendingMessage ? (
                                        <svg style={{ animation: 'spin 1s linear infinite', width: '20px', height: '20px', color: '#FFFFFF' }} viewBox="0 0 24 24" fill="none">
                                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
                                        </svg>
                                      ) : (
                                        <Send2 size={20} variant="Bold" color="#FFFFFF" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </main>
                )}

                {/* Section 3: Tâches */}
                {(!isMobile || activeTab === 'tasks') && (
                  <aside className="collab-detail-tasks">
                    <div className="collab-detail-section">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                        <h3 className="collab-detail-section-title" style={{ margin: 0 }}>Tâches</h3>
                        {!isCollabClosed(collaboration?.id) && (
                          <button
                            type="button"
                            className="collab-task-create-btn"
                            onClick={openTaskModal}
                            title="Créer une nouvelle tâche"
                          >
                            <Add size={20} color="#fff" />
                            <span>Nouvelle tâche</span>
                          </button>
                        )}
                      </div>

                      <div className="collab-tasks-list">
                        {tasksLoading ? (
                          [...Array(3)].map((_, idx) => (
                            <div key={idx} className="collab-task-item" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }}>
                              <ShimmerThumbnail height={20} width={20} rounded />
                              <div style={{ flex: 1 }}>
                                <div style={{ width: '180px', marginBottom: '8px' }}><ShimmerTitle line={1} gap={0} /></div>
                                <div style={{ width: '100px' }}><ShimmerText line={1} gap={0} /></div>
                              </div>
                              <ShimmerThumbnail height={24} width={24} rounded />
                            </div>
                          ))
                        ) : currentTasks.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body-small)' }}>
                            Aucune tâche pour le moment.
                          </div>
                        ) : (
                          currentTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`collab-task-item ${task.completed ? 'is-completed' : ''} ${task.failed ? 'is-failed' : ''}`}
                            >
                              <div className="collab-task-main">
                                <label className="collab-task-checkbox-wrapper">
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => {
                                      if (task.completed) {
                                        toggleTask(task.id);
                                      } else {
                                        setExpandedProofTask(prev => prev === task.id ? null : task.id);
                                        setExpandedFailureTask(null);
                                        setFailureReason('');
                                      }
                                    }}
                                    className="collab-task-checkbox"
                                    disabled={task.failed || isCollabClosed(collaboration?.id)}
                                  />
                                  <span className="collab-task-checkmark">
                                    <TickCircle size={18} variant="Bold" color="#FFFFFF" />
                                  </span>
                                </label>

                                <div
                                  className="collab-task-content"
                                  onClick={() => {
                                    if (!task.completed && !task.failed && !isCollabClosed(collaboration?.id)) {
                                      setExpandedProofTask(prev => prev === task.id ? null : task.id);
                                      setExpandedFailureTask(null);
                                      setFailureReason('');
                                    }
                                  }}
                                  style={{
                                    cursor: (!task.completed && !task.failed && !isCollabClosed(collaboration?.id)) ? 'pointer' : 'default',
                                    flex: 1
                                  }}
                                >
                                  <div className="collab-task-title" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)' }}>
                                    {task.title}
                                  </div>
                                  {task.description && (
                                    <div className="collab-task-desc" style={{
                                      fontSize: 'var(--font-size-body-small)',
                                      color: 'var(--color-text-secondary)',
                                      marginTop: '4px',
                                      whiteSpace: 'pre-wrap',
                                      lineHeight: '1.4'
                                    }}>
                                      {task.description}
                                    </div>
                                  )}
                                  <div className="collab-task-meta"
                                    style={{
                                      display: 'flex', flexWrap: 'wrap',
                                      gap: '8px', marginTop: '6px', alignItems: 'center',
                                      fontSize: 'var(--font-size-caption)',
                                      color: 'var(--color-text-secondary)'
                                    }}>
                                    {task.failed && (
                                      <span className="collab-task-failed-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#EF4444', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                                        <Danger size={10} variant="Bold" color="#FFFFFF" />
                                        Échouée
                                      </span>
                                    )}
                                    <span className={task.createdBy === 'me' ? 'is-me' : ''}>
                                      {task.createdBy === 'me' ? 'Par moi' : task.createdBy}
                                    </span>

                                    {(task.start_date || task.end_date) && (
                                      <>

                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <Calendar size={12} variant="Linear" />
                                          {task.start_date && new Date(task.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                          {task.start_date && task.end_date && ' - '}
                                          {task.end_date && new Date(task.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </span>
                                      </>
                                    )}
                                    {(task.completedAt || task.updated_at) && task.completed && (
                                      <>
                                        <span>•</span>
                                        <span className="completed-date" style={{ color: 'var(--color-success)', fontWeight: '500' }}>
                                          Fait le {formatDateTime(task.completedAt || task.updated_at)}
                                        </span>
                                      </>
                                    )}
                                    {task.failed && task.updated_at && (
                                      <>
                                        <span>•</span>
                                        <span className="failed-date" style={{ color: '#EF4444', fontWeight: '500' }}>
                                          Échouée le {formatDateTime(task.updated_at)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {!task.completed && !task.failed && !isCollabClosed(collaboration?.id) && (
                                  <button
                                    type="button"
                                    className="collab-task-fail-btn"
                                    onClick={() => {
                                      if (expandedFailureTask === task.id) {
                                        setExpandedFailureTask(null);
                                        setFailureReason('');
                                      } else {
                                        setExpandedFailureTask(task.id);
                                        setFailureReason('');
                                        setExpandedProofTask(null);
                                        setSelectedProofFile(null);
                                        setProofPreviewUrl(null);
                                        setProofPreviewType(null);
                                        setProofUploadError(null);
                                        setProofUploadSuccess(null);
                                      }
                                    }}
                                    title="Marquer comme échouée"
                                  >
                                    <Danger size={18} variant="Bold" color="#EF4444" />
                                  </button>
                                )}

                                {task.failed && !isCollabClosed(collaboration?.id) && (
                                  <button
                                    type="button"
                                    className="collab-task-reset-btn"
                                    onClick={() => resetTaskStatus(task.id)}
                                    title="Réinitialiser"
                                  >
                                    <Add size={18} variant="Bold" color="#6C7278" />
                                  </button>
                                )}

                                {!isCollabClosed(collaboration?.id) && (
                                  <button
                                    type="button"
                                    className="collab-task-delete-btn"
                                    onClick={() => setTaskToDelete(task)}
                                    disabled={deletingTaskIds.includes(task.id)}
                                    title="Supprimer la tâche"
                                  >
                                    {deletingTaskIds.includes(task.id) ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: '#EF4444', borderRightColor: '#EF4444', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}></span>
                                    ) : (
                                      <Trash size={18} variant="Bold" color="#EF4444" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {(task.failed && (task.failure_reason || task.failureReason)) && (
                                <div className="collab-task-failure-section" style={{
                                  marginTop: 'var(--spacing-2)',
                                  padding: '8px 12px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                  borderRadius: 'var(--radius-sm)',
                                  borderLeft: '3px solid #EF4444'
                                }}>
                                  <div className="collab-task-failure-label" style={{ fontSize: 'var(--font-size-caption)', fontWeight: 'bold', color: '#EF4444' }}>Raison :</div>
                                  <div className="collab-task-failure-reason" style={{ fontSize: 'var(--font-size-body-small)', color: 'var(--color-text-secondary)' }}>
                                    {formatFailureReason(task.failure_reason || task.failureReason)}
                                  </div>
                                </div>
                              )}

                              {!task.completed && !task.failed && expandedFailureTask === task.id && (
                                <div className="collab-task-failure-form">
                                  {failureAlert && (
                                    <div className={`alert alert-${failureAlert.type} d-flex align-items-center`} role="alert" style={{ padding: '8px 12px', fontSize: 'var(--font-size-body-small)', borderRadius: 'var(--radius-md)', margin: '0 0 8px 0' }}>
                                      <div style={{ flex: 1 }}>{failureAlert.message}</div>
                                    </div>
                                  )}
                                  <textarea
                                    className="collab-task-failure-textarea"
                                    rows={3}
                                    value={failureReason}
                                    onChange={(e) => setFailureReason(e.target.value)}
                                    placeholder="Raison de l'échec..."
                                    autoFocus
                                    disabled={failureSaving}
                                  />
                                  <div className="collab-task-failure-actions">
                                    <button
                                      type="button"
                                      className="collab-task-failure-cancel"
                                      disabled={failureSaving}
                                      onClick={() => {
                                        setExpandedFailureTask(null);
                                        setFailureReason('');
                                        setFailureAlert(null);
                                      }}
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      type="button"
                                      className="collab-task-failure-confirm"
                                      onClick={() => {
                                        if (failureReason.trim()) {
                                          markTaskFailed(task.id, failureReason.trim());
                                        }
                                      }}
                                      disabled={!failureReason.trim() || failureSaving}
                                    >
                                      {failureSaving ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: '#ffffff', borderRightColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}></span>
                                          <span>Envoi...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Danger size={14} variant="Bold" color="#FFFFFF" />
                                          Confirmer
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {!task.completed && !task.failed && expandedProofTask === task.id && (
                                <div className="collab-task-proof-upload-panel" style={{
                                  marginTop: 'var(--spacing-3)',
                                  padding: 'var(--spacing-3)',
                                  backgroundColor: 'rgba(58, 162, 221, 0.05)',
                                  border: '1.5px dashed var(--color-primary)',
                                  borderRadius: 'var(--radius-md)',
                                  animation: 'slideDown 0.2s ease-out'
                                }}>
                                  <div style={{ fontSize: 'var(--font-size-body-small)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)', marginBottom: 'var(--spacing-2)' }}>
                                    Compléter la tâche avec une preuve
                                  </div>
                                  <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-3) 0' }}>
                                    Sélectionnez une image, vidéo ou document (PDF, Word, Excel, etc.) pour justifier de la réalisation de la tâche.
                                  </p>

                                  {proofUploadError && (
                                    <div className="alert alert-danger d-flex align-items-center" role="alert" style={{ padding: '8px 12px', fontSize: 'var(--font-size-body-small)', borderRadius: 'var(--radius-md)', margin: '8px 0' }}>
                                      <div style={{ flex: 1 }}>{proofUploadError}</div>
                                    </div>
                                  )}

                                  {proofUploadSuccess && (
                                    <div className="alert alert-success d-flex align-items-center" role="alert" style={{ padding: '8px 12px', fontSize: 'var(--font-size-body-small)', borderRadius: 'var(--radius-md)', margin: '8px 0' }}>
                                      <div style={{ flex: 1 }}>{proofUploadSuccess}</div>
                                    </div>
                                  )}

                                  {(proofPreviewUrl || selectedProofFile) && (
                                    <div className="proof-file-preview-container" style={{ position: 'relative', marginTop: '8px', marginBottom: '12px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                      {proofPreviewType === 'image' ? (
                                        <>
                                          <BlurryImage src={proofPreviewUrl} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '200px' }} />
                                          <button
                                            type="button"
                                            disabled={uploadingProofTask === task.id}
                                            onClick={() => {
                                              setSelectedProofFile(null);
                                              setProofPreviewUrl(null);
                                              setProofPreviewType(null);
                                            }}
                                            style={{
                                              position: 'absolute',
                                              top: '4px',
                                              right: '4px',
                                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                              color: '#fff',
                                              border: 'none',
                                              borderRadius: '50%',
                                              width: '24px',
                                              height: '24px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              cursor: 'pointer',
                                              fontSize: '14px',
                                              zIndex: 10
                                            }}
                                          >
                                            ×
                                          </button>
                                        </>
                                      ) : proofPreviewType === 'video' ? (
                                        <>
                                          <video src={proofPreviewUrl} controls style={{ width: '100%', display: 'block', maxWidth: '300px' }} />
                                          <button
                                            type="button"
                                            disabled={uploadingProofTask === task.id}
                                            onClick={() => {
                                              setSelectedProofFile(null);
                                              setProofPreviewUrl(null);
                                              setProofPreviewType(null);
                                            }}
                                            style={{
                                              position: 'absolute',
                                              top: '4px',
                                              right: '4px',
                                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                              color: '#fff',
                                              border: 'none',
                                              borderRadius: '50%',
                                              width: '24px',
                                              height: '24px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              cursor: 'pointer',
                                              fontSize: '14px',
                                              zIndex: 10
                                            }}
                                          >
                                            ×
                                          </button>
                                        </>
                                      ) : (
                                        <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                                          <div style={{
                                            padding: 'var(--spacing-3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-2)',
                                            backgroundColor: 'var(--color-background)',
                                            flex: 1,
                                            minWidth: 0
                                          }}>
                                            <DocumentUpload size={28} variant="Bold" color="var(--color-primary)" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{
                                                fontSize: 'var(--font-size-body-small)',
                                                fontWeight: 'var(--font-weight-semibold)',
                                                color: 'var(--color-text-primary)',
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word',
                                                lineHeight: '1.4'
                                              }}>
                                                {selectedProofFile?.name}
                                              </div>
                                              <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                                {selectedProofFile?.size ? `${(selectedProofFile.size / 1024).toFixed(2)} KB` : ''}
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            disabled={uploadingProofTask === task.id}
                                            onClick={() => {
                                              setSelectedProofFile(null);
                                              setProofPreviewUrl(null);
                                              setProofPreviewType(null);
                                            }}
                                            style={{
                                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                              color: 'var(--color-danger)',
                                              border: 'none',
                                              borderLeft: '1px solid var(--color-border)',
                                              padding: '0 var(--spacing-3)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              cursor: 'pointer',
                                              fontSize: '18px',
                                              fontWeight: 'bold',
                                              transition: 'background-color 0.2s ease',
                                              minWidth: '40px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <label className="collab-task-proof-btn" style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: 'var(--font-size-body-small)' }}>
                                      <DocumentUpload size={14} variant="Bold" color="var(--color-primary)" />
                                      <span>Choisir un fichier</span>
                                      <input
                                        type="file"
                                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                        disabled={uploadingProofTask === task.id}
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            setSelectedProofFile(file);
                                            if (file.type.startsWith('image/')) {
                                              setProofPreviewUrl(URL.createObjectURL(file));
                                              setProofPreviewType('image');
                                            } else if (file.type.startsWith('video/')) {
                                              setProofPreviewUrl(URL.createObjectURL(file));
                                              setProofPreviewType('video');
                                            } else {
                                              setProofPreviewUrl(null);
                                              setProofPreviewType('document');
                                            }
                                            setProofUploadError(null);
                                            setProofUploadSuccess(null);
                                          }
                                        }}
                                        style={{ display: 'none' }}
                                      />
                                    </label>

                                    <button
                                      type="button"
                                      disabled={!selectedProofFile || uploadingProofTask === task.id}
                                      onClick={async () => {
                                        setUploadingProofTask(task.id);
                                        try {
                                          const isOk = await handleProofUpload(task.id, selectedProofFile);
                                          if (isOk) {
                                            setTimeout(() => {
                                              setExpandedProofTask(null);
                                              setSelectedProofFile(null);
                                              setProofPreviewUrl(null);
                                              setProofPreviewType(null);
                                              setProofUploadSuccess(null);
                                            }, 1500);
                                          }
                                        } catch (err) {
                                          console.error(err);
                                        } finally {
                                          setUploadingProofTask(null);
                                        }
                                      }}
                                      className='btn btn-primary py-2 my-2'
                                    >
                                      {uploadingProofTask === task.id ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: '#ffffff', borderRightColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}></span>
                                          <span>Envoi...</span>
                                        </>
                                      ) : (
                                        <>
                                          <TickCircle size={14} variant="Bold" color="#FFFFFF" />
                                          <span>Confirmer</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={uploadingProofTask === task.id}
                                      onClick={() => {
                                        setExpandedProofTask(null);
                                        setSelectedProofFile(null);
                                        setProofPreviewUrl(null);
                                        setProofPreviewType(null);
                                        setProofUploadError(null);
                                        setProofUploadSuccess(null);
                                      }}
                                      className='btn btn-light'
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              )}

                              {task.completed && (
                                <div className="collab-task-proof-section" style={{ marginTop: 'var(--spacing-2)' }}>
                                  {(task.proof_image || task.proof_video || task.proof) ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => toggleCompletedProof(task.id)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: 'var(--color-primary)',
                                          fontSize: 'var(--font-size-caption)',
                                          fontWeight: '500',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '4px 8px',
                                          backgroundColor: 'rgba(58, 162, 221, 0.08)',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          marginBottom: '8px',
                                          transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 162, 221, 0.15)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 162, 221, 0.08)'}
                                      >
                                        <span>{expandedCompletedProofs.includes(task.id) ? '▼ Masquer la preuve' : '▶ Afficher la preuve'}</span>
                                      </button>

                                      {expandedCompletedProofs.includes(task.id) && (
                                        <div
                                          className="collab-task-proof-display"
                                          style={{
                                            borderRadius: 'var(--radius-md)',
                                            overflow: 'hidden',
                                            border: '1px solid var(--color-border)',
                                            position: 'relative',
                                            animation: 'fadeIn 0.25s ease-out'
                                          }}
                                        >
                                          {/* Image */}
                                          {(task.proof_image || (task.proof?.type === 'image' && task.proof.url)) && (
                                            <div
                                              onClick={() => {
                                                setActiveProofPreview({ type: 'image', url: task.proof_image || task.proof.url });
                                              }}
                                              style={{
                                                cursor: 'pointer',
                                                backgroundColor: '#000',
                                                maxHeight: '400px',
                                                position: 'relative',
                                                width: '100%',
                                                height: '100%',
                                                overflow: 'hidden'
                                              }}
                                              className="proof-hover-container"
                                            >
                                              <BlurryImage
                                                src={task.proof_image || task.proof.url}
                                                alt="Preuve"
                                                className="collab-task-proof-image"
                                                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                                              />
                                              <div className="proof-hover-overlay" style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                opacity: 0, transition: 'opacity 0.3s ease', color: '#fff', gap: '8px', fontSize: '13px', fontWeight: '500'
                                              }}>
                                                <span>🔍 Cliquer pour agrandir</span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Vidéo */}
                                          {(task.proof_video || (task.proof?.type === 'video' && task.proof.url)) && (
                                            <div
                                              onClick={() => {
                                                setActiveProofPreview({ type: 'video', url: task.proof_video || task.proof.url });
                                              }}
                                              style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor: 'pointer' }}
                                              className="proof-hover-container"
                                            >
                                              <video
                                                src={task.proof_video || task.proof.url}
                                                className="collab-task-proof-video"
                                                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '200px', objectFit: 'cover' }}
                                              />
                                              <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', gap: '6px', fontSize: '12px'
                                              }}>
                                                <div style={{
                                                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)',
                                                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
                                                  border: '1px solid rgba(255,255,255,0.4)', transition: 'transform 0.2s ease'
                                                }} className="play-button-circle">
                                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5.25 20.25V3.75L19.5 12L5.25 20.25Z" fill="currentColor" />
                                                  </svg>
                                                </div>
                                                <span style={{ fontWeight: '500' }}>Lire la vidéo</span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Document (PDF, Word, Excel, etc.) */}
                                          {!task.proof_image && !task.proof_video && task.proof && (
                                            <a
                                              href={task.proof.url || task.proof}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              download
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-3)',
                                                padding: 'var(--spacing-4)',
                                                backgroundColor: 'var(--color-background)',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                transition: 'background-color 0.2s ease'
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 162, 221, 0.05)'}
                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
                                            >
                                              <DocumentUpload size={32} variant="Bold" color="var(--color-primary)" />
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-1)' }}>
                                                  Document de preuve
                                                </div>
                                                <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                                                  Cliquer pour ouvrir ou télécharger
                                                </div>
                                              </div>
                                              <div style={{ fontSize: '20px', color: 'var(--color-primary)' }}>→</div>
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  ) : !isCollabClosed(collaboration?.id) && (
                                    <label className="collab-task-proof-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: 'var(--font-size-caption)' }}>
                                      <DocumentUpload size={14} variant="Bold" color="#3AA2DD" />
                                      Ajouter une preuve
                                      <input
                                        type="file"
                                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                        onChange={(e) => {
                                          if (e.target.files[0]) {
                                            handleProofUpload(task.id, e.target.files[0]);
                                          }
                                        }}
                                        style={{ display: 'none' }}
                                      />
                                    </label>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </aside>
                )}
              </div>

              {/* Bottom Navigation Bar pour Mobile */}
              {isMobile && (
                <div className="collab-mobile-nav">
                  <button
                    className={`collab-mobile-nav-item ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                  >
                    <InfoCircle size={24} variant={'Bold'} />
                    <span>Détails</span>
                  </button>
                  <button
                    className={`collab-mobile-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                  >
                    <Send2 size={24} variant={'Bold'} />
                    <span>Chat</span>
                  </button>
                  <button
                    className={`collab-mobile-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                  >
                    <TaskSquare size={24} variant={'Bold'} />
                    <span>Tâches</span>
                  </button>
                </div>
              )}

              {/* Modal de gestion des tâches externalisé et réutilisable */}
              <TaskModal key={"gestion des taches-1"} />

              {/* Modal de suggestion d'organisations */}
              <SuggestOrgModal key="suggest-org" />

              {/* Modal de confirmation de suppression de tâche */}
              <DeleteTaskModal
                isOpen={taskToDelete !== null}
                onClose={() => setTaskToDelete(null)}
                taskId={taskToDelete?.id}
                onConfirm={async () => {
                  await mutateTasks();
                  setTaskToDelete(null);
                }}
                taskTitle={taskToDelete?.title || ''}
              />

              {/* Modal de prévisualisation de preuve en grand */}
              {activeProofPreview && (
                <div
                  className="proof-preview-modal-overlay"
                  onClick={() => setActiveProofPreview(null)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeIn 0.25s ease-out'
                  }}
                >
                  <div
                    className="proof-preview-modal-content"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'relative',
                      backgroundColor: '#1E1E1E',
                      borderRadius: '16px',
                      padding: '16px',
                      maxWidth: '90%',
                      maxHeight: '90%',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    {/* Bouton fermer */}
                    <button
                      type="button"
                      onClick={() => setActiveProofPreview(null)}
                      style={{
                        position: 'absolute',
                        top: '-16px',
                        right: '-16px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s ease, background-color 0.2s ease',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = '#DC2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = '#EF4444';
                      }}
                    >
                      ×
                    </button>

                    {/* Corps du modal */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderRadius: '12px', minHeight: '400px', backgroundColor: '#000000', width: '100%' }}>
                      {activeProofPreview.type === 'image' ? (
                        <BlurryImage
                          src={activeProofPreview.url}
                          alt="Aperçu Preuve"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '75vh',
                            minHeight: '400px',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <video
                          src={activeProofPreview.url}
                          controls
                          autoPlay
                          style={{
                            maxWidth: '100%',
                            maxHeight: '75vh',
                            minHeight: '400px',
                            width: 'auto',
                            height: 'auto',
                            display: 'block'
                          }}
                        />
                      )}
                    </div>

                    <div style={{ marginTop: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Preuve de complétion</span>

                    </div>
                  </div>
                </div>
              )}

              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes scaleUp {
                  from { transform: scale(0.9); opacity: 0; }
                  to { transform: scale(1); opacity: 1; }
                }
                .proof-hover-container:hover img {
                  transform: scale(1.04);
                }
                .proof-hover-container:hover .proof-hover-overlay {
                  opacity: 1 !important;
                }
                .proof-hover-container:hover .play-button-circle {
                  transform: scale(1.15);
                  background-color: rgba(255,255,255,0.3) !important;
                }
              `}</style>
            </div>
          </main>
        </div>
      </div>

      {/* Modal de résolution d'incident */}
      {showCloseModal && (
        <>
          <div
            className={[
              'am-offcanvas-backdrop',
              !closeModalShowing ? 'am-offcanvas-backdrop--closing' : '',
            ].filter(Boolean).join(' ')}
            onClick={closeCloseModal}
          />
          <div
            className={[
              'am-offcanvas-panel',
              !closeModalShowing ? 'am-offcanvas-panel--closing' : 'am-offcanvas-panel--opening',
            ].filter(Boolean).join(' ')}
            role="dialog"
            aria-modal="true"
            aria-label="Résoudre l'incident"
          >
            <div className="am-offcanvas-header">
              <h5 className="am-offcanvas-title">Résoudre l'incident</h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeCloseModal}
                disabled={isClosing}
              />
            </div>

            <div className="am-offcanvas-body">
              {closeAlert && (
                <div className="am-alert am-alert--danger" role="alert" style={{ marginBottom: 'var(--spacing-3)' }}>
                  <span className="am-alert__message">{closeAlert.message}</span>
                  <button
                    type="button"
                    className="am-alert__close"
                    onClick={() => setCloseAlert(null)}
                    aria-label="Close"
                  >×</button>
                </div>
              )}

              <p style={{ marginBottom: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-body)' }}>
                Veuillez renseigner les dates de début et de fin de résolution de l'incident.
              </p>

              <div className="am-field">
                <label className="am-label">
                  Date de début de résolution *
                </label>
                <input
                  type="date"
                  className="am-input"
                  value={resolutionStartDate}
                  onChange={(e) => setResolutionStartDate(e.target.value)}
                  disabled={isClosing}
                />
              </div>

              <div className="am-field">
                <label className="am-label">
                  Date de fin de résolution *
                </label>
                <input
                  type="date"
                  className="am-input"
                  value={resolutionEndDate}
                  onChange={(e) => setResolutionEndDate(e.target.value)}
                  disabled={isClosing}
                />
              </div>

              <div className="am-field">
                <label className="am-label">
                  Document justificatif (Image, Vidéo, PDF, Word, Excel)
                </label>
                <input
                  type="file"
                  className="am-input"
                  accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setResolutionFile(e.target.files[0] || null)}
                  disabled={isClosing}
                />
                {resolutionFile && (
                  <div style={{ marginTop: 'var(--spacing-2)', fontSize: 'var(--font-size-body-small)', color: 'var(--color-text-secondary)' }}>
                    Fichier sélectionné : <strong>{resolutionFile.name}</strong> ({Math.round(resolutionFile.size / 1024)} KB)
                  </div>
                )}
              </div>

              <div className='alert alert-info'>
                <p style={{ margin: 0, color: 'var(--color-info)', fontSize: 'var(--font-size-body)', lineHeight: '1.5' }}>
                  <strong>Attention :</strong> Cette action est irréversible. Une fois l'incident résolu, il ne pourra plus être modifié.
                </p>
              </div>
            </div>

            <div className="am-offcanvas-footer">
              <button
                type="button"
                className="am-btn am-btn--secondary"
                onClick={closeCloseModal}
                disabled={isClosing}
              >
                Annuler
              </button>
              <button
                type="button"
                className="am-btn am-btn--primary"
                onClick={handleCloseIncident}
                disabled={isClosing || !resolutionStartDate || !resolutionEndDate}
              >
                {isClosing ? (
                  <>
                    <span className="am-spinner" aria-hidden="true" />
                    Clôture en cours...
                  </>
                ) : (
                  <>
                    Resoudre cet incident
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
      <AgentReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        incidentId={collaboration?.incidentId}
        incidentTitle={collaboration?.title}
      />
    </CollaborationDetailProvider>
  );
};
