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
import { API_URL_BASE } from '../../config/api_url_base';
import { authService } from '../auth/services/authService';
import sendMessageSound from '../../assets/send_message.mp3';
import {
  getDiscussionMessagesService,
  sendMessageService,
  updateDiscussionMessageService,
  deleteDiscussionMessageService,
  formatMessage
} from './service/collab_detail_service';
import { createSuggestionService } from '../suggest-request/service/suggest_service';
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
import { OffcanvasModal } from '../../components/molecules/OffcanvasModal';
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
  } catch {
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
  } catch {
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

  // Ajuste pendant le rendu, pas dans un effet : sinon le <audio> est monte une
  // premiere fois avec l'ancienne source, puis remonte avec la nouvelle — ce
  // qui coupe la lecture, exactement ce que ce code cherche a eviter.
  const memeFichier = src && stableSrc && src.split('?')[0] === stableSrc.split('?')[0];
  if (src && stableSrc !== src && !memeFichier) {
    setStableSrc(src);
  }

  // Si un autre audio démarre, on met celui-ci en pause.
  // On ne touche plus a isPlaying ici : l'element emet un evenement 'pause',
  // ecoute plus bas. Une seule source de verite, et l'etat reste juste meme
  // quand la lecture s'arrete sans passer par nous (fin de piste, coupure).
  useEffect(() => {
    if (activeAudioId && activeAudioId !== id && isPlaying && audioRef.current) {
      audioRef.current.pause();
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

    const onLecture = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onAudioEnd);
    audio.addEventListener('play', onLecture);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onAudioEnd);
      audio.removeEventListener('play', onLecture);
      audio.removeEventListener('pause', onPause);
    };
  }, [id, activeAudioId, setActiveAudioId]);

  const togglePlayPause = () => {
    const prevValue = isPlaying;
    if (!prevValue) {
      if (setActiveAudioId) setActiveAudioId(id);
      audioRef.current.play();
    } else {
      audioRef.current.pause();
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
        {isPlaying ? <Pause size={20} variant="Bold" color="var(--color-surface)" /> : <Play size={20} variant="Bold" color="var(--color-surface)" style={{ marginLeft: '2px' }} />}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-micro)', color: 'var(--color-text-muted)', fontWeight: '600', fontFamily: 'monospace' }}>
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
  const tasksSocketRef = useRef(null);
  const closeModalBodyRef = useRef(null);

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
  const { data: collaborationData, error: collaborationError, isLoading, mutate: mutateCollaboration } = useSWR(
    id ? `collaboration-${id}` : null,
    () => getCollaborationService(id),
    {
      revalidateOnFocus: false
    }
  );

  console.log("[COLLAB_DETAIL] SWR Debug:", {
    idFromUrl: id,
    collaborationData,
    collaborationError,
    isLoading
  });


  // Récupérer l'incidentId depuis la collaboration
  const incidentId = collaborationData?.incident;
  const isIncidentResolved = collaborationData?.incident_details?.etat === 'resolved';

  // Utiliser useSWR pour charger les tâches de l'incident (sans polling, géré par WebSockets)
  const { data: tasksData, isLoading: tasksLoading, mutate: mutateTasks } = useSWR(
    incidentId ? `tasks-${incidentId}` : null,
    () => getTasksService(incidentId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  );

  // États pour la pagination du chat
  const [allMessages, setAllMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextBeforeId, setNextBeforeId] = useState(null);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const messagesContainerRef = useRef(null);

  // Référence pour éviter les stale closures dans les effets
  const allMessagesRef = useRef([]);
  // Drapeau: true quand on ajoute des messages anciens en haut (ne pas scroller en bas)
  const isPrependingRef = useRef(false);

  // Synchroniser la ref avec l'état
  useEffect(() => {
    allMessagesRef.current = Array.isArray(allMessages) ? allMessages : [];
  }, [allMessages]);

  // Réinitialiser la pagination quand incidentId change
  useEffect(() => {
    setAllMessages([]);
    setHasMoreMessages(false);
    setNextBeforeId(null);
    allMessagesRef.current = [];
  }, [incidentId]);

  // Charger les messages initiaux (10 plus récents) via SWR
  const { data: rawMessagesData, mutate: mutateMessages } = useSWR(
    incidentId ? `discussion-${incidentId}` : null,
    () => getDiscussionMessagesService(incidentId, { limit: 10 }),
    {
      revalidateOnFocus: false
    }
  );

  // Gérer à la fois le chargement initial et les mises à jour WebSocket
  // - Si allMessages est vide : chargement initial (initialise la liste + pagination)
  // - Si allMessages n'est pas vide : mise à jour WebSocket (ajoute seulement les nouveaux messages)
  useEffect(() => {
    if (!rawMessagesData || !Array.isArray(rawMessagesData.results)) return;

    const apiResults = rawMessagesData.results;
    const currentMessages = allMessagesRef.current;

    if (currentMessages.length === 0) {
      // Chargement initial : définir tous les messages depuis l'API
      setAllMessages(apiResults);
      setHasMoreMessages(rawMessagesData.has_more || false);
      setNextBeforeId(rawMessagesData.next_before || null);
      console.log('[Chat] Chargement initial:', apiResults.length, 'messages, has_more:', rawMessagesData.has_more);

      // Scroller vers le bas après le chargement initial
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // Mise à jour WebSocket : ajouter seulement les nouveaux messages
      const newMessages = apiResults.filter(
        newMsg => !currentMessages.some(existingMsg => existingMsg.id === newMsg.id)
      );

      if (newMessages.length > 0) {
        console.log('[Chat] Nouveaux messages reçus:', newMessages.length);
        setAllMessages(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return [...prevArray, ...newMessages];
        });

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [rawMessagesData]);

  // Écoute temps réel via WebSockets natifs
  useEffect(() => {
    if (!incidentId) return;

    const wsBaseUrl = API_URL_BASE.replace(/^http/, 'ws');
    const token = authService.getAccessToken();
    const query = token ? `?token=${token}` : '';

    let discussionSocket = null;
    let tasksSocket = null;
    let isCleanedUp = false;
    let discussionDelay = 3000;
    let tasksDelay = 3000;

    const shouldRetry = (code) => ![1000, 4001, 4003, 4004].includes(code);

    const connectDiscussion = () => {
      if (isCleanedUp) return;
      discussionSocket = new WebSocket(`${wsBaseUrl}/ws/incidents/${incidentId}/discussion/${query}`);

      discussionSocket.onopen = () => {
        discussionDelay = 3000;
        console.log('[WS] Discussion connectée');
      };
      discussionSocket.onmessage = () => mutateMessages();
      discussionSocket.onerror = () => discussionSocket.close();
      discussionSocket.onclose = (e) => {
        if (!isCleanedUp && shouldRetry(e.code)) {
          setTimeout(connectDiscussion, discussionDelay);
          discussionDelay = Math.min(discussionDelay * 2, 30000);
        }
      };
    };

    const connectTasks = () => {
      if (isCleanedUp) return;
      tasksSocket = new WebSocket(`${wsBaseUrl}/ws/incidents/${incidentId}/tasks/${query}`);
      tasksSocketRef.current = tasksSocket;

      tasksSocket.onopen = () => {
        tasksDelay = 3000;
        console.log('[WS] Tasks connectée');
      };
      tasksSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] Message reçu:', data);

          if (data.type === 'task_event' && data.action === 'delete' && data.task_id) {
            console.log('[WS] Suppression de tâche reçue en temps réel:', data.task_id);
            mutateTasks(prev => {
              const list = Array.isArray(prev) ? prev : (prev?.results || []);
              // Normaliser les IDs pour la comparaison (string vs number)
              const taskIdToDelete = String(data.task_id);
              return Array.isArray(prev)
                ? prev.filter(t => String(t.id) !== taskIdToDelete)
                : { ...prev, results: list.filter(t => String(t.id) !== taskIdToDelete) };
            }, { revalidate: false });
          } else {
            console.log('[WS] Rechargement complet des tâches');
            mutateTasks();
          }
        } catch (e) {
          console.error('[WS] Erreur parsing message:', e);
          mutateTasks();
        }
      };
      tasksSocket.onerror = () => tasksSocket.close();
      tasksSocket.onclose = (e) => {
        if (!isCleanedUp && shouldRetry(e.code)) {
          setTimeout(connectTasks, tasksDelay);
          tasksDelay = Math.min(tasksDelay * 2, 30000);
        }
      };
    };

    connectDiscussion();
    connectTasks();

    return () => {
      isCleanedUp = true;
      discussionSocket?.close();
      tasksSocket?.close();
      tasksSocketRef.current = null;
    };
  }, [incidentId]); // ← seulement incidentId

  // Fonction pour charger plus de messages (messages plus anciens)
  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoadingMoreMessages || !nextBeforeId || !incidentId) return;

    setIsLoadingMoreMessages(true);
    console.log('[Chat] Chargement de plus de messages avant ID:', nextBeforeId);

    try {
      const data = await getDiscussionMessagesService(incidentId, {
        limit: 10,
        before: nextBeforeId
      });

      if (data && Array.isArray(data.results)) {
        // Marquer qu'on ajoute des messages anciens (empêche le scroll vers le bas)
        isPrependingRef.current = true;
        // Ajouter les messages plus anciens au début de la liste
        setAllMessages(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return [...data.results, ...prevArray];
        });
        setHasMoreMessages(data.has_more || false);
        setNextBeforeId(data.next_before || null);
        console.log('[Chat] Chargé', data.results.length, 'messages supplémentaires, has_more:', data.has_more);
      }
    } catch (err) {
      console.error('[Chat] Erreur chargement messages supplémentaires:', err);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  // Détecter le scroll vers le haut pour charger plus de messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Si on scroll vers le haut (proche du début)
      if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMoreMessages) {
        const previousScrollHeight = container.scrollHeight;
        const previousScrollTop = container.scrollTop;

        loadMoreMessages().then(() => {
          // Maintenir la position de scroll après le chargement
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - previousScrollHeight;
            container.scrollTop = previousScrollTop + scrollDiff;
          });
        });
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, isLoadingMoreMessages, nextBeforeId, incidentId]);


  // Formater les messages pour l'affichage
  const messages = useMemo(() => {
    if (!Array.isArray(allMessages)) {
      console.warn('[Chat] allMessages n\'est pas un tableau:', allMessages);
      return [];
    }
    return allMessages.map(msg => {
      const formatted = formatMessage(msg);
      if (!formatted) return null;
      return formatted;
    }).filter(Boolean);
  }, [allMessages]);

  // Ces deux tables sont lues (isCollabClosed, getCalculatedProgress) mais plus
  // rien ne les alimente : la fonction qui appelait setSavedProgress avait deja
  // ete detachee de l'interface, et aucun appelant ne fermait de collaboration.
  // Resultat, isCollabClosed repond toujours faux et la progression retombe
  // toujours sur celle du serveur. On l'ecrit en clair plutot que de le cacher
  // derriere un useState qui donne l'illusion d'un etat vivant.
  const savedProgress = {};
  const closedCollabs = {};

  const [expandedFailureTask, setExpandedFailureTask] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [failureAlert, setFailureAlert] = useState(null);
  const [failureSaving, setFailureSaving] = useState(false);

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
  const [activeAudioId, setActiveAudioId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
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

  // Faire défiler vers le bas quand les messages changent (sauf lors du chargement de messages anciens)
  useEffect(() => {
    if (isPrependingRef.current) {
      isPrependingRef.current = false;
      return;
    }
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

  // Scroll to top of close modal body when an alert is set
  useEffect(() => {
    if (closeAlert && closeModalBodyRef.current) {
      closeModalBodyRef.current.scrollTop = 0;
    }
  }, [closeAlert]);

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
    image: collaborationData.incident_photo || collaborationData.incident_thumbnail || collaborationData.photo || collaborationData.thumbnail || collaborationData.incident_details?.photo || '',
    organisation: collaborationData.organisation_name || ``,
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
    location: collaborationData.incident_details?.zone || collaborationData.incident_zone || 'À définir',
    description: collaborationData.incident_description || collaborationData.incident_details?.description || collaborationData.motivation || 'Aucune description',
    progress: collaborationData.incident_progress || collaborationData.incident_details?.progress || 0,
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
                        <h4 className="collab-detail-subsection-title">L'Signalement</h4>
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

  if (collaborationError) {
    return (
      <div className="app-container">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className={`collab-detail-main-wrapper ${sidebarCollapsed ?
           'sidebar-collapsed' : ''}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
          <div className="collab-empty body-large text-center">
            <p>Erreur lors du chargement de la collaboration.</p>
            <button className="btn btn-primary" onClick={() => mutateCollaboration()}>Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  if (!collaboration) {
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
      assigned_to: null
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
            title: task.title,
            description: task.description || null,
            start_date: task.start_date || null,
            end_date: task.end_date || null,
            ...(task.assigned_to && { assigned_to: task.assigned_to })
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

  const notifyTaskChange = (action, taskId) => {
    console.log('[WS] notifyTaskChange appelé:', { action, taskId });

    if (!tasksSocketRef.current) {
      console.warn('[WS] tasksSocketRef.current est null');
      return;
    }

    console.log('[WS] État du socket:', tasksSocketRef.current.readyState, 'OPEN=', WebSocket.OPEN);

    if (tasksSocketRef.current.readyState === WebSocket.OPEN) {
      try {
        const message = { type: 'task_event', action, task_id: taskId };
        console.log('[WS] Envoi du message:', message);
        tasksSocketRef.current.send(JSON.stringify(message));
        console.log('[WS] Message envoyé avec succès');
      } catch (e) {
        console.error('[WS] Erreur lors de l\'envoi du message:', e);
      }
    } else {
      console.warn('[WS] Socket non ouvert, impossible d\'envoyer le message');
    }
  };

  // Supprimer une tâche via API
  const deleteTask = async (taskId) => {
    setDeletingTaskIds(prev => [...prev, taskId]);

    // Mise à jour optimiste locale instantanée
    mutateTasks(prev => {
      const list = Array.isArray(prev) ? prev : (prev?.results || []);
      return Array.isArray(prev)
        ? prev.filter(t => t.id !== taskId)
        : { ...prev, results: list.filter(t => t.id !== taskId) };
    }, { revalidate: false });

    try {
      await deleteTaskService(incidentId, taskId);
      notifyTaskChange('delete', taskId);
    } catch (err) {
      console.error('[deleteTask] Erreur:', err);
      await mutateTasks(); // Restaurer/Recharger la liste en cas d'erreur
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

      // Jouer le son une fois le message envoyé avec succès
      try {
        const audio = new Audio(sendMessageSound);
        audio.play().catch(() => {});
      } catch {
        // Meme raison qu'ailleurs : le son de confirmation est un confort. Le
        // message est deja parti, une politique d'autoplay ne doit pas donner
        // l'impression du contraire.
      }

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

  const handleEditMessage = async (msgId) => {
    if (!editingMessageText.trim()) return;
    setSavingEdit(true);
    try {
      await updateDiscussionMessageService(incidentId, msgId, editingMessageText.trim());
      await mutateMessages();
      setEditingMessageId(null);
      setEditingMessageText('');
    } catch (err) {
      console.error('[handleEditMessage] Erreur:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    setDeletingMessageId(msgId);
    try {
      await deleteDiscussionMessageService(incidentId, msgId);
      await mutateMessages();
    } catch (err) {
      console.error('[handleDeleteMessage] Erreur:', err);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const startEditMessage = (msg) => {
    setEditingMessageId(msg.id);
    setEditingMessageText(msg.message || '');
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
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
      setCloseAlert({ type: 'success', message: 'Signalement résolu avec succès !' });
      setTimeout(() => {
        closeCloseModal();
        mutateCollaboration(); // Recharger uniquement les données SWR au lieu de la page entière
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
        createSuggestionService(collaboration.incidentId, {
          incident: collaboration.incidentId,
          suggested_organisation: org.id,
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
      // Fermer le modal après un court délai pour que l'utilisateur voie le message de succès
      setTimeout(() => {
        closeSuggestModal();
      }, 1500);
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
      color: 'var(--color-primary-text)',
      description: 'Peut participer activement et créer des tâches'
    },
    {
      id: 'observateur',
      label: 'Observateur',
      icon: Eye,
      color: 'var(--color-text-secondary)',
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
                {isIncidentResolved ? (
                  <div className="collab-detail-closed-badge" style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-surface)' }}>
                    <TickCircle size={16} variant="Bold" color="var(--color-surface)" />
                    Incident Résolu
                  </div>
                ) : isCollabClosed(collaboration?.id) ? (
                  <div className="collab-detail-closed-badge">
                    <Lock1 size={16} variant="Bold" color="var(--color-surface)" />
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
                        <h4 className="collab-detail-subsection-title">L'Signalement</h4>
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
                              <span className="collab-detail-meta-label">État signalement</span>
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
                                <span className="collab-detail-meta-val text-highlight" style={{ fontSize: 'var(--font-size-body-small)' }}>
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
                                    <span className="collab-detail-meta-val" style={{ fontSize: 'var(--font-size-micro)', color: 'var(--color-text-secondary)' }}>
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
                                <span className="collab-detail-meta-val" style={{ fontSize: 'var(--font-size-body-small)' }}>
                                  {collaboration.predictionDetails.potential_risk.message}
                                </span>
                              </div>
                            )}

                            {(() => {
                              const rawTags = collaboration.predictionDetails.impact_tags;
                              let tagsArray = [];
                              if (Array.isArray(rawTags)) {
                                tagsArray = rawTags;
                              } else if (typeof rawTags === 'string') {
                                try {
                                  if (rawTags.trim().startsWith('[')) {
                                    tagsArray = JSON.parse(rawTags);
                                  } else {
                                    tagsArray = rawTags.split(',').map(t => t.trim()).filter(Boolean);
                                  }
                                } catch {
                                  tagsArray = rawTags.split(',').map(t => t.trim()).filter(Boolean);
                                }
                              }
                              if (!Array.isArray(tagsArray) || tagsArray.length === 0) return null;
                              return (
                                <div className="collab-detail-meta-row">
                                  <span className="collab-detail-meta-label">Domaines d'impact</span>
                                  <div className="collab-detail-tag-list">
                                    {tagsArray.map((tag, i) => (
                                      <span key={i} className="collab-detail-tag">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="collab-detail-meta-val" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body-small)', fontStyle: 'italic' }}>
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
                          {(() => {
                            const acting = collaboration?.incidentDetails?.acting_organisations || [];
                            const leaderOrg = acting.find(org => org.relation === 'leader');
                            const collaboratorOrgs = acting.filter(org => org.relation === 'collaborator');

                            return (
                              <>
                                {leaderOrg && (
                                  <div className="collab-detail-meta-row">
                                    <span className="collab-detail-meta-label">Organisation Leader</span>
                                    <span className="collab-detail-meta-val" style={{ fontWeight: '500' }}>{leaderOrg.name}</span>
                                  </div>
                                )}
                                {collaboratorOrgs.length > 0 && (
                                  <div className="collab-detail-meta-row">
                                    <span className="collab-detail-meta-label">Collaborateurs</span>
                                    <span className="collab-detail-meta-val" style={{ fontWeight: '500' }}>
                                      {collaboratorOrgs.map(org => org.name).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}

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
                      {!isIncidentResolved && (
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
                      )}
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
                        <div className="collab-discussion-messages" ref={messagesContainerRef}>
                          {/* Indicateur de chargement de messages plus anciens */}
                          {isLoadingMoreMessages && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center',
                              padding: '12px',
                              color: 'var(--color-text-secondary)',
                              fontSize: 'var(--font-size-body-small)',
                              gap: '8px',
                              alignItems: 'center'
                            }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid var(--color-border)',
                                borderTopColor: 'var(--color-primary)',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                              }} />
                              Chargement des messages...
                            </div>
                          )}

                          {/* Bouton "Charger plus de messages" (fonctionne même sans scroll) */}
                          {!isLoadingMoreMessages && hasMoreMessages && messages.length > 0 && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center',
                              padding: '8px 12px'
                            }}>
                              <button
                                type="button"
                                onClick={loadMoreMessages}
                                style={{
                                  background: 'var(--color-surface)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: '16px',
                                  padding: '6px 16px',
                                  fontSize: 'var(--font-size-caption)',
                                  color: 'var(--color-primary-text)',
                                  cursor: 'pointer',
                                  fontWeight: '500'
                                }}
                              >
                                Charger les messages précédents
                              </button>
                            </div>
                          )}

                          {messages.length === 0 ? (
                            <div className="collab-discussion-empty">
                              <Send2 size={48} color="var(--color-text-secondary)" />
                              <p className="collab-empty-title">Aucun message pour le moment</p>
                              <p className="collab-empty-subtitle">Lancez la discussion en envoyant le premier message aux collaborateurs.</p>
                            </div>
                          ) : (
                            messages.map((msg) => {
                              const currentUser = authService.getCurrentUser();
                              const isSuperAdmin = currentUser?.web_role === 'super_admin' || currentUser?.web_role === 'org_admin';
                              const canEditOrDelete = msg.isMe || isSuperAdmin;
                              const isEditing = editingMessageId === msg.id;
                              const isDeleting = deletingMessageId === msg.id;
                              const renderAvatar = () => (
                                <div
                                  className="collab-message-avatar"
                                  style={msg.senderAvatar ? { backgroundColor: 'transparent', overflow: 'hidden' } : { backgroundColor: msg.senderColor }}
                                >
                                  {msg.senderAvatar ? (
                                    <img
                                      src={msg.senderAvatar}
                                      alt={msg.senderName}
                                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div style={msg.senderAvatar ? { display: 'none', width: '100%', height: '100%', borderRadius: '50%', alignItems: 'center', justifyContent: 'center' } : { width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {msg.senderInitials}
                                  </div>
                                </div>
                              );
                              return (
                              <div
                                key={msg.id}
                                className={`collab-message ${msg.isMe ? 'is-me' : ''}`}
                              >
                                {!msg.isMe && renderAvatar()}
                                <div className="collab-message-content">
                                  {!msg.isMe && (
                                    <div className="collab-message-sender">
                                      <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{msg.senderName}</span>
                                      {msg.senderOrgName && (
                                        <span style={{ fontSize: 'var(--font-size-micro)', color: 'var(--color-text-muted)', marginLeft: '4px' }}>• {msg.senderOrgName}</span>
                                      )}
                                    </div>
                                  )}
                                  {msg.isMe && msg.senderOrgName && (
                                    <div className="collab-message-sender" style={{ textAlign: 'right' }}>
                                      <span style={{ fontSize: 'var(--font-size-micro)', color: 'var(--color-text-muted)', marginRight: '4px' }}>{msg.senderOrgName} •</span>
                                      <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{msg.senderName}</span>
                                    </div>
                                  )}
                                  <div
                                    className={`collab-message-bubble ${(!msg.message && (msg.file || msg.audio)) ? 'is-media-only' : ''}`}
                                    style={(!msg.message && (msg.file || msg.audio)) ? { background: 'transparent', padding: 0, boxShadow: 'none', border: 'none' } : {}}
                                  >
                                    {isEditing ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <textarea
                                          value={editingMessageText}
                                          onChange={(e) => setEditingMessageText(e.target.value)}
                                          style={{
                                            width: '100%', minHeight: '60px', resize: 'vertical',
                                            border: '1px solid var(--color-border)', borderRadius: '8px',
                                            padding: '8px 12px', fontSize: 'var(--font-size-body)',
                                            fontFamily: 'inherit'
                                          }}
                                          autoFocus
                                        />
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                          <button
                                            type="button"
                                            onClick={cancelEditMessage}
                                            disabled={savingEdit}
                                            style={{
                                              padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--color-border)',
                                              background: 'var(--color-surface)', fontSize: 'var(--font-size-caption)', cursor: 'pointer'
                                            }}
                                          >
                                            Annuler
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleEditMessage(msg.id)}
                                            disabled={savingEdit || !editingMessageText.trim()}
                                            style={{
                                              padding: '4px 12px', borderRadius: '6px', border: 'none',
                                              background: 'var(--color-primary)', color: 'var(--color-surface)', fontSize: 'var(--font-size-caption)',
                                              cursor: savingEdit ? 'not-allowed' : 'pointer', opacity: savingEdit ? 0.7 : 1
                                            }}
                                          >
                                            {savingEdit ? 'Enregistrement...' : 'Enregistrer'}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
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
                                            <span className="collab-message-file-icon" style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--font-size-h2)' }}>
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
                                                  style={{ background: 'none', border: 'none', padding: 0, fontSize: 'var(--font-size-micro)', fontWeight: '500', color: 'var(--color-primary-text)', textDecoration: 'none', cursor: downloadingMsgId === msg.id ? 'not-allowed' : 'pointer', opacity: downloadingMsgId === msg.id ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                  {downloadingMsgId === msg.id ? (
                                                    <>
                                                      <svg style={{ animation: 'spin 1s linear infinite', width: '12px', height: '12px', color: 'var(--color-primary-text)' }} viewBox="0 0 24 24" fill="none">
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
                                                    <span style={{ fontSize: 'var(--font-size-micro)', color: 'var(--color-text-muted)' }}>•</span>
                                                    <span className="collab-message-file-size" style={{ fontSize: 'var(--font-size-micro)', color: 'var(--color-text-muted)' }}>
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
                                      </>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <div className="collab-message-time">
                                      {formatMessageTime(msg.timestamp)}
                                    </div>
                                    {canEditOrDelete && !isEditing && msg.message && (
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                          type="button"
                                          onClick={() => startEditMessage(msg)}
                                          title="Modifier"
                                          style={{
                                            background: 'none', border: 'none', padding: '2px',
                                            cursor: 'pointer', color: 'var(--color-text-muted)',
                                            display: 'flex', alignItems: 'center'
                                          }}
                                        >
                                          <Edit2 size={12} variant="Linear" color="currentColor" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteMessage(msg.id)}
                                          disabled={isDeleting}
                                          title="Supprimer"
                                          style={{
                                            background: 'none', border: 'none', padding: '2px',
                                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                                            color: 'var(--color-danger-text)', opacity: isDeleting ? 0.5 : 1,
                                            display: 'flex', alignItems: 'center'
                                          }}
                                        >
                                          {isDeleting ? (
                                            <svg style={{ animation: 'spin 1s linear infinite', width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none">
                                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
                                            </svg>
                                          ) : (
                                            <Trash size={12} variant="Linear" color="currentColor" />
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {msg.isMe && renderAvatar()}
                              </div>
                              );
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {!isCollabClosed(collaboration?.id) && !isIncidentResolved && (
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
                                    <CloseSquare size={16} variant="Bold" color="var(--color-danger-text)" />
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
                                    <CloseSquare size={16} variant="Bold" color="var(--color-danger-text)" />
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
                                  <textarea
                                    className="collab-discussion-field"
                                    placeholder={sendingMessage ? "Envoi en cours..." : "Écrivez un message..."}
                                    value={newMessage}
                                    onChange={(e) => {
                                      setNewMessage(e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    disabled={sendingMessage}
                                    rows={1}
                                    style={{ resize: 'none', overflow: 'hidden', minHeight: '40px', maxHeight: '120px' }}
                                    onKeyDown={(e) => {
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
                                      <Microphone size={20} variant="Bold" color="var(--color-surface)" />
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
                                        <svg style={{ animation: 'spin 1s linear infinite', width: '20px', height: '20px', color: 'var(--color-surface)' }} viewBox="0 0 24 24" fill="none">
                                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
                                        </svg>
                                      ) : (
                                        <Send2 size={20} variant="Bold" color="var(--color-surface)" />
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
                        {!isCollabClosed(collaboration?.id) && !isIncidentResolved && (
                          <button
                            type="button"
                            className="collab-task-create-btn"
                            onClick={openTaskModal}
                            title="Créer une nouvelle tâche"
                          >
                            <Add size={20} color="var(--color-surface)" />
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
                                    <TickCircle size={18} variant="Bold" color="var(--color-surface)" />
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
                                      <span className="collab-task-failed-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-danger)', color: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px', fontSize: 'var(--font-size-micro)', fontWeight: 'bold' }}>
                                        <Danger size={10} variant="Bold" color="var(--color-surface)" />
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
                                        <span className="completed-date" style={{ color: 'var(--color-success-text)', fontWeight: '500' }}>
                                          Fait le {formatDateTime(task.completedAt || task.updated_at)}
                                        </span>
                                      </>
                                    )}
                                    {task.failed && task.updated_at && (
                                      <>
                                        <span>•</span>
                                        <span className="failed-date" style={{ color: 'var(--color-danger-text)', fontWeight: '500' }}>
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
                                    <Danger size={18} variant="Bold" color="var(--color-danger-text)" />
                                  </button>
                                )}

                                {task.failed && !isCollabClosed(collaboration?.id) && (
                                  <button
                                    type="button"
                                    className="collab-task-reset-btn"
                                    onClick={() => resetTaskStatus(task.id)}
                                    title="Réinitialiser"
                                  >
                                    <Add size={18} variant="Bold" color="var(--color-text-secondary)" />
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
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: 'var(--color-danger)', borderRightColor: 'var(--color-danger)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}></span>
                                    ) : (
                                      <Trash size={18} variant="Bold" color="var(--color-danger-text)" />
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
                                  <div className="collab-task-failure-label" style={{ fontSize: 'var(--font-size-caption)', fontWeight: 'bold', color: 'var(--color-danger-text)' }}>Raison :</div>
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
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: 'var(--color-surface)', borderRightColor: 'var(--color-surface)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}></span>
                                          <span>Envoi...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Danger size={14} variant="Bold" color="var(--color-surface)" />
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
                                  <div style={{ fontSize: 'var(--font-size-body-small)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary-text)', marginBottom: 'var(--spacing-2)' }}>
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
                                              color: 'var(--color-surface)',
                                              border: 'none',
                                              borderRadius: '50%',
                                              width: '24px',
                                              height: '24px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              cursor: 'pointer',
                                              fontSize: 'var(--font-size-body)',
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
                                              color: 'var(--color-surface)',
                                              border: 'none',
                                              borderRadius: '50%',
                                              width: '24px',
                                              height: '24px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              cursor: 'pointer',
                                              fontSize: 'var(--font-size-body)',
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
                                              color: 'var(--color-danger-text)',
                                              border: 'none',
                                              borderLeft: '1px solid var(--color-border)',
                                              padding: '0 var(--spacing-3)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              cursor: 'pointer',
                                              fontSize: 'var(--font-size-h3)',
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
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: 'var(--color-surface)', borderRightColor: 'var(--color-surface)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}></span>
                                          <span>Envoi...</span>
                                        </>
                                      ) : (
                                        <>
                                          <TickCircle size={14} variant="Bold" color="var(--color-surface)" />
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
                                          color: 'var(--color-primary-text)',
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
                                          {(task.proof_image || (task.proof?.type === 'image' && task.proof.url)) && (() => {
                                            const proofUrl = task.proof_image || task.proof?.url || '';
                                            const lowerUrl = proofUrl.split('?')[0].toLowerCase();
                                            const isImage = lowerUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|heic|heif)$/);
                                            if (!isImage) return null;
                                            return (
                                            <button
                                              type="button"
                                              aria-label="Agrandir la photo de preuve"
                                              onClick={() => {
                                                setActiveProofPreview({ type: 'image', url: proofUrl });
                                              }}
                                              style={{
                                                cursor: 'pointer',
                                                padding: 0,
                                                border: 'none',
                                                display: 'block',
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
                                                src={proofUrl}
                                                alt="Preuve"
                                                className="collab-task-proof-image"
                                                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                                              />
                                              <div className="proof-hover-overlay" style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                opacity: 0, transition: 'opacity 0.3s ease', color: 'var(--color-surface)', gap: '8px', fontSize: 'var(--font-size-body-small)', fontWeight: '500'
                                              }}>
                                                <span>🔍 Cliquer pour agrandir</span>
                                              </div>
                                            </button>
                                            );
                                          })()}

                                          {/* Vidéo */}
                                          {(task.proof_video || (task.proof?.type === 'video' && task.proof.url)) && (
                                            <button
                                              type="button"
                                              aria-label="Lire la video de preuve"
                                              onClick={() => {
                                                setActiveProofPreview({ type: 'video', url: task.proof_video || task.proof.url });
                                              }}
                                              style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor: 'pointer', padding: 0, border: 'none', background: 'none', display: 'block' }}
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
                                                color: 'var(--color-surface)', gap: '6px', fontSize: 'var(--font-size-caption)'
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
                                            </button>
                                          )}

                                          {/* Document (PDF, Word, Excel, etc.) */}
                                          {(() => {
                                            const proofDocUrl = task.proof_image || task.proof?.url || task.proof || '';
                                            const lowerDocUrl = (typeof proofDocUrl === 'string' ? proofDocUrl : '').split('?')[0].toLowerCase();
                                            const isImage = lowerDocUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|heic|heif)$/);
                                            const isVideo = task.proof_video || lowerDocUrl.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/);
                                            if (isImage || isVideo) return null;
                                            if (!proofDocUrl) return null;
                                            const docName = lowerDocUrl.split('/').pop() || 'Document de preuve';
                                            return (
                                            <a
                                              href={proofDocUrl}
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
                                                  {decodeURIComponent(docName)}
                                                </div>
                                                <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                                                  Cliquer pour ouvrir ou télécharger
                                                </div>
                                              </div>
                                              <div style={{ fontSize: 'var(--font-size-title)', color: 'var(--color-primary-text)' }}>→</div>
                                            </a>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </>
                                  ) : !isCollabClosed(collaboration?.id) && (
                                    <label className="collab-task-proof-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: 'var(--font-size-caption)' }}>
                                      <DocumentUpload size={14} variant="Bold" color="var(--color-primary-text)" />
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
                incidentId={collaborationData?.incident}
                onConfirm={async () => {
                  const taskId = taskToDelete?.id;
                  if (taskId) {
                    // Mise à jour optimiste locale instantanée
                    mutateTasks(prev => {
                      const list = Array.isArray(prev) ? prev : (prev?.results || []);
                      return Array.isArray(prev)
                        ? prev.filter(t => t.id !== taskId)
                        : { ...prev, results: list.filter(t => t.id !== taskId) };
                    }, { revalidate: false });
                  }

                  try {
                    await deleteTaskService(collaborationData?.incident, taskId);
                    notifyTaskChange('delete', taskId);
                  } catch {
                    await mutateTasks(); // Restaurer la liste en cas d'erreur
                  }
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
                        backgroundColor: 'var(--color-danger)',
                        color: 'var(--color-surface)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-h3)',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s ease, background-color 0.2s ease',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = 'var(--color-danger-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'var(--color-danger)';
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

                    <div style={{ marginTop: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-body-small)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
        // Deux notions distinctes se ressemblent ici :
        //   closeModalShowing → animation du panneau (sémantique inversée)
        //   isClosing         → clôture de l'incident en cours (soumission)
        <OffcanvasModal
          onClose={closeCloseModal}
          isClosing={!closeModalShowing}
          title="Résoudre l'incident"
          ariaLabel="Résoudre l'incident"
          closeVariant="plain"
          closeDisabled={isClosing}
          footer={
            <>
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
            </>
          }
        >
            <div className="am-offcanvas-body" ref={closeModalBodyRef}>
              {closeAlert && (
                <div className={`am-alert am-alert--${closeAlert.type === 'success' ? 'success' : 'danger'}`} role="alert" style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {closeAlert.type === 'success' ? (
                    <TickCircle size={18} variant="Bold" color="var(--color-success)" style={{ flexShrink: 0 }} />
                  ) : (
                    <CloseCircle size={18} variant="Bold" color="var(--color-danger)" style={{ flexShrink: 0 }} />
                  )}
                  <span className="am-alert__message" style={{ margin: 0 }}>{closeAlert.message}</span>
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
                <p style={{ margin: 0, color: 'var(--color-info-text)', fontSize: 'var(--font-size-body)', lineHeight: '1.5' }}>
                  <strong>Attention :</strong> Cette action est irréversible. Une fois l'incident résolu, il ne pourra plus être modifié.
                </p>
              </div>
            </div>
        </OffcanvasModal>
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
