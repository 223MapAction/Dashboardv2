import React, { useState, useRef } from 'react';
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
  Buildings2
} from 'iconsax-react';
import { BlurryImage } from '../../../components/atoms/BlurryImage';
import './collaboration-detail.css';

export const CollaborationDetail = ({
  collaboration,
  onBack,
  collabTasks,
  setCollabTasks,
  savedProgress,
  setSavedProgress,
  closedCollabs,
  onOpenSuggestModal
}) => {
  const [activeSection, setActiveSection] = useState('details');
  const [expandedFailureTask, setExpandedFailureTask] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);

  // États pour les tâches
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDeadline, setEditTaskDeadline] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // États pour la discussion
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'UNICEF',
      senderInitials: 'UN',
      senderColor: '#1E40AF',
      message: 'Bonjour à tous, merci de votre engagement dans ce projet !',
      timestamp: '2025-03-15T10:30:00',
      isMe: false
    },
    {
      id: 2,
      sender: 'Moi',
      senderInitials: 'ME',
      senderColor: '#3AA2DD',
      message: 'Ravi de participer à cette initiative importante.',
      timestamp: '2025-03-15T11:00:00',
      isMe: true
    },
    {
      id: 3,
      sender: 'UNICEF',
      senderInitials: 'UN',
      senderColor: '#1E40AF',
      message: 'La première phase de mobilisation est terminée avec succès !',
      timestamp: '2025-03-18T14:20:00',
      isMe: false
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const isCollabClosed = (collabId) => closedCollabs[collabId] === true;

  const currentTasks = collabTasks[collaboration.id] || collaboration.tasks || [];

  const getCalculatedProgress = () => {
    if (!currentTasks.length) return 0;
    const completed = currentTasks.filter(t => t.completed).length;
    return Math.round((completed / currentTasks.length) * 100);
  };

  const getSavedProgress = () => {
    return savedProgress[collaboration.id] ?? collaboration.progress ?? 0;
  };

  const hasPendingChanges = () => {
    const calculated = getCalculatedProgress();
    const saved = getSavedProgress();
    return calculated !== saved;
  };

  const saveProgress = () => {
    setSavedProgress(prev => ({
      ...prev,
      [collaboration.id]: getCalculatedProgress()
    }));
  };

  const toggleTask = (taskId) => {
    setCollabTasks(prev => ({
      ...prev,
      [collaboration.id]: (prev[collaboration.id] || collaboration.tasks).map(task =>
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

  const markTaskFailed = (taskId, reason) => {
    setCollabTasks(prev => ({
      ...prev,
      [collaboration.id]: (prev[collaboration.id] || collaboration.tasks).map(task =>
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

  const resetTaskStatus = (taskId) => {
    setCollabTasks(prev => ({
      ...prev,
      [collaboration.id]: (prev[collaboration.id] || collaboration.tasks).map(task =>
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

  const handleProofUpload = (taskId, file) => {
    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
    const fakeUrl = URL.createObjectURL(file);

    setCollabTasks(prev => ({
      ...prev,
      [collaboration.id]: (prev[collaboration.id] || collaboration.tasks).map(task =>
        task.id === taskId
          ? {
            ...task,
            proof: { type: fileType, url: fakeUrl }
          }
          : task
      )
    }));
  };

  const submitNewTask = () => {
    if (!newTaskTitle.trim()) return;
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
      [collaboration.id]: [...(prev[collaboration.id] || collaboration.tasks || []), newTask]
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

  const saveEditTask = (taskId) => {
    if (!editTaskTitle.trim()) return;
    setCollabTasks(prev => ({
      ...prev,
      [collaboration.id]: (prev[collaboration.id] || collaboration.tasks).map(t =>
        t.id === taskId
          ? { ...t, title: editTaskTitle.trim(), deadline: editTaskDeadline || null }
          : t
      )
    }));
    cancelEditTask();
  };

  const deleteTask = (taskId) => {
    setCollabTasks(prev => ({
      ...prev,
      [collaboration.id]: (prev[collaboration.id] || collaboration.tasks).filter(t => t.id !== taskId)
    }));
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const message = {
      id: messages.length + 1,
      sender: 'Moi',
      senderInitials: 'ME',
      senderColor: '#3AA2DD',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isMe: true
    };
    setMessages([...messages, message]);
    setNewMessage('');
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

  return (
    <div className="collaboration-detail">
      {/* Header */}
      <header className="collab-detail-header">
        <button
          type="button"
          className="detail-back-btn"
          onClick={onBack}
          aria-label="Retour à la liste"
          style={{ display: 'flex', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
        >
          <ArrowLeft2 size={20} variant="Linear" color="var(--color-text-primary)" />
        </button>
        <div className="collab-detail-header-info">
          <h1 className="collab-detail-title">{collaboration.title}</h1>
          <p className="collab-detail-subtitle">
            {collaboration.organisation} • {collaboration.location}
          </p>
        </div>
        {isCollabClosed(collaboration.id) && (
          <div className="collab-detail-closed-badge">
            <Lock1 size={16} variant="Bold" color="#FFFFFF" />
            Clôturée
          </div>
        )}
      </header>

      {/* Content - 3 colonnes */}
      <div className="collab-detail-content">
        {/* Section 1: Détails de la collaboration */}
        <aside className="collab-detail-sidebar">
          <div className="collab-detail-section">
            <h3 className="collab-detail-section-title">Détails de la collaboration</h3>

            {/* Image */}
            {collaboration.image && (
              <div className="collab-detail-image">
                <BlurryImage src={collaboration.image} alt={collaboration.title} />
              </div>
            )}

            {/* Rôle */}
            {collaboration.userRole && (
              <div className={`collab-detail-role collab-role-${collaboration.userRole}`}>
                {collaboration.userRole === 'leader' && <Crown1 size={16} variant="Bold" color="#F59E0B" />}
                {collaboration.userRole === 'contributeur' && <People size={16} variant="Bold" color="#3AA2DD" />}
                {collaboration.userRole === 'observateur' && <Eye size={16} variant="Bold" color="#6C7278" />}
                <span>Votre rôle : {collaboration.userRole.charAt(0).toUpperCase() + collaboration.userRole.slice(1)}</span>
              </div>
            )}

            {/* Description */}
            <div className="collab-detail-info-block">
              <h4 className="collab-detail-info-label">Description</h4>
              <p className="collab-detail-description">{collaboration.description}</p>
            </div>

            {/* Informations */}
            <div className="collab-detail-info-block">
              <h4 className="collab-detail-info-label">Informations</h4>
              <div className="collab-detail-meta-list">
                <div className="collab-detail-meta-item">
                  <Location size={16} variant="Bold" color="var(--color-text-secondary)" />
                  <span>{collaboration.location}</span>
                </div>
                <div className="collab-detail-meta-item">
                  <Calendar size={16} variant="Bold" color="var(--color-text-secondary)" />
                  <span>{collaboration.startDate} → {collaboration.endDate}</span>
                </div>
                <div className="collab-detail-meta-item">
                  <People size={16} variant="Bold" color="var(--color-text-secondary)" />
                  <span>Organisation : {collaboration.organisation}</span>
                </div>
              </div>
            </div>

            {/* Progression */}
            <div className="collab-detail-info-block">
              <h4 className="collab-detail-info-label">Progression globale</h4>
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

            {/* Bouton Suggérer des organisations (leader uniquement) */}
            {collaboration.userRole === 'leader' && !isCollabClosed(collaboration.id) && onOpenSuggestModal && (
              <div className="collab-detail-info-block">
                <button
                  type="button"
                  className="collab-detail-suggest-btn"
                  onClick={() => onOpenSuggestModal(collaboration)}
                >
                  <Buildings2 size={18} variant="Bold" color="#F59E0B" />
                  Suggérer des organisations
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Section 2: Discussion */}
        <main className="collab-detail-main">
          <div className="collab-detail-section">
            <h3 className="collab-detail-section-title">Discussion</h3>

            <div className="collab-discussion">
              <div className="collab-discussion-messages">
                {messages.map((msg) => (
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
                      <div className="collab-message-bubble">
                        {msg.message}
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
                ))}
                <div ref={messagesEndRef} />
              </div>

              {!isCollabClosed(collaboration.id) && (
                <div className="collab-discussion-input">
                  <input
                    type="text"
                    className="collab-discussion-field"
                    placeholder="Écrivez un message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="collab-discussion-send"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send2 size={20} variant="Bold" color="#FFFFFF" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Section 3: Tâches */}
        <aside className="collab-detail-tasks">
          <div className="collab-detail-section">
            <h3 className="collab-detail-section-title">Tâches</h3>

            {/* Formulaire d'ajout de tâche */}
            {!isCollabClosed(collaboration.id) && (
              <div className="collab-task-add-form">
                <input
                  type="text"
                  className="collab-task-input"
                  placeholder="Nouvelle tâche..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitNewTask();
                    }
                  }}
                />
                <button
                  type="button"
                  className="collab-task-add-btn"
                  onClick={submitNewTask}
                  disabled={!newTaskTitle.trim()}
                  title="Ajouter la tâche"
                >
                  <Add size={18} variant="Bold" color="#FFFFFF" />
                </button>
              </div>
            )}

            {/* Liste des tâches */}
            <div className="collab-tasks-list">
              {currentTasks.map((task) => (
                <div
                  key={task.id}
                  className={`collab-task-item ${task.completed ? 'is-completed' : ''} ${task.failed ? 'is-failed' : ''}`}
                >
                  <div className="collab-task-main">
                    <label className="collab-task-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="collab-task-checkbox"
                        disabled={task.failed || isCollabClosed(collaboration.id)}
                      />
                      <span className="collab-task-checkmark">
                        <TickCircle size={18} variant="Bold" color="#FFFFFF" />
                      </span>
                    </label>

                    <div className="collab-task-content">
                      <div className="collab-task-title">{task.title}</div>
                      {task.failed && (
                        <span className="collab-task-failed-badge">
                          <Danger size={12} variant="Bold" color="#FFFFFF" />
                          Échouée
                        </span>
                      )}
                      <div className="collab-task-meta">
                        <span className={task.createdBy === 'me' ? 'is-me' : ''}>
                          {task.createdBy === 'me' ? 'Par moi' : task.createdBy}
                        </span>
                        {task.completedAt && (
                          <>
                            <span>•</span>
                            <span className="completed-date">
                              {new Date(task.completedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {!task.completed && !task.failed && !isCollabClosed(collaboration.id) && (
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
                          }
                        }}
                        title="Marquer comme échouée"
                      >
                        <CloseSquare size={16} variant="Bold" color="#EF4444" />
                      </button>
                    )}

                    {task.failed && !isCollabClosed(collaboration.id) && (
                      <button
                        type="button"
                        className="collab-task-reset-btn"
                        onClick={() => resetTaskStatus(task.id)}
                        title="Réinitialiser"
                      >
                        <Add size={16} variant="Bold" color="#6C7278" />
                      </button>
                    )}
                  </div>

                  {/* Raison de l'échec */}
                  {task.failed && task.failureReason && (
                    <div className="collab-task-failure-section">
                      <div className="collab-task-failure-label">Raison :</div>
                      <div className="collab-task-failure-reason">{task.failureReason}</div>
                    </div>
                  )}

                  {/* Formulaire inline pour marquer comme échouée */}
                  {!task.completed && !task.failed && expandedFailureTask === task.id && (
                    <div className="collab-task-failure-form">
                      <textarea
                        className="collab-task-failure-textarea"
                        rows={3}
                        value={failureReason}
                        onChange={(e) => setFailureReason(e.target.value)}
                        placeholder="Raison de l'échec..."
                        autoFocus
                      />
                      <div className="collab-task-failure-actions">
                        <button
                          type="button"
                          className="collab-task-failure-cancel"
                          onClick={() => {
                            setExpandedFailureTask(null);
                            setFailureReason('');
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
                              setExpandedFailureTask(null);
                              setFailureReason('');
                            }
                          }}
                          disabled={!failureReason.trim()}
                        >
                          <Danger size={14} variant="Bold" color="#FFFFFF" />
                          Confirmer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preuve */}
                  {task.completed && (
                    <div className="collab-task-proof-section">
                      {task.proof ? (
                        <div className="collab-task-proof-display">
                          {task.proof.type === 'image' ? (
                            <BlurryImage src={task.proof.url} alt="Preuve" className="collab-task-proof-image" />
                          ) : (
                            <iframe
                              src={task.proof.url}
                              title="Preuve vidéo"
                              className="collab-task-proof-video"
                              frameBorder="0"
                              allowFullScreen
                            />
                          )}
                        </div>
                      ) : !isCollabClosed(collaboration.id) && (
                        <label className="collab-task-proof-btn">
                          <DocumentUpload size={14} variant="Bold" color="#3AA2DD" />
                          Ajouter une preuve
                          <input
                            type="file"
                            accept="image/*,video/*"
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
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
