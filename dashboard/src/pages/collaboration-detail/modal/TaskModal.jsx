import React from 'react';
import { useCollaborationDetail } from '../context/CollaborationDetailContext';
import {
  CloseSquare,
  Add,
  Trash,
  TaskSquare,
  Calendar,
  TickCircle,
  Danger,
  Clock,
  Edit2
} from 'iconsax-react';

export const TaskModal = () => {
  const {
    collaboration,
    showTaskModal,
    taskModalClosing,
    taskModalShowing,
    closeTaskModal,
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
  } = useCollaborationDetail();

  const getTodayLocalStr = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayString = getTodayLocalStr();

  const getMinDeadlineString = (startDate) => {
    if (!startDate) return todayString;
    const [year, month, day] = startDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  if (!showTaskModal) return null;

  const panelClass = [
    'am-offcanvas-panel',
    taskModalClosing ? 'am-offcanvas-panel--closing' : '',
    taskModalShowing && !taskModalClosing ? 'am-offcanvas-panel--opening' : '',
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    taskModalClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={closeTaskModal} />
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label="Gérer mes tâches"
      >
        <div className="am-offcanvas-header">
          <div className="d-flex flex-column" style={{ minWidth: 0, flex: 1 }}>
            <h5 className="am-offcanvas-title">Gérer mes tâches</h5>
            <small style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{collaboration?.title}</small>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={closeTaskModal}
            aria-label="Fermer"
          />
        </div>

        <div className="am-offcanvas-body">
          {taskSubmitAlert && (
            <div className={`am-alert am-alert--${taskSubmitAlert.type === 'success' ? 'success' : 'danger'}`} role="alert" style={{ marginBottom: 'var(--spacing-4)' }}>
              <span className="am-alert__message">{taskSubmitAlert.message}</span>
            </div>
          )}

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
              disabled={taskSubmitSaving}
            />

            <label className="tasks-add-label">
              Description (optionnel)
            </label>
            <textarea
              className="tasks-add-input"
              style={{ minHeight: '80px', resize: 'vertical', paddingTop: '8px' }}
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Ex : Description détaillée des activités..."
              disabled={taskSubmitSaving}
            />

            <div className='d-flex justify-content-between flex-wrap gap-2'>
              <div className='w-100'>
                <label className="tasks-add-label">
                  Date de début <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="tasks-add-input"
                  value={newTaskStartDate}
                  onChange={(e) => setNewTaskStartDate(e.target.value)}
                  disabled={taskSubmitSaving}
                  min={todayString}
                />
              </div>
              <div className='w-100'>
                <label className="tasks-add-label">
                  Date de fin  <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="tasks-add-input"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  disabled={taskSubmitSaving}
                  min={getMinDeadlineString(newTaskStartDate)}
                />
              </div>
            </div>

            <div className="tasks-add-form-actions" style={{ marginTop: 'var(--spacing-4)' }}>
              <button
                type="button"
                className="tasks-add-confirm"
                onClick={addDraftTask}
                disabled={!newTaskTitle.trim() || taskSubmitSaving}
              >
                <Add size={16} color="#FFFFFF" />
                Ajouter à la liste
              </button>
            </div>
          </div>

          {/* Liste des tâches en cours de création (draft) */}
          {draftTasks.length > 0 && (
            <div className="draft-tasks-section" style={{ marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-3)', backgroundColor: 'rgba(58, 162, 221, 0.05)', border: '1.5px dashed var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
              <h4 className="draft-tasks-title" style={{ fontSize: 'var(--font-size-body-large)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)', marginBottom: 'var(--spacing-3)' }}>
                Tâches à ajouter ({draftTasks.length})
              </h4>
              <div className="draft-tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {draftTasks.map((t, idx) => (
                  <div key={idx} className="draft-task-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-3)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 'var(--font-size-body-small)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{t.description}</div>}
                      <div style={{ fontSize: 'var(--font-size-body-small)', color: 'var(--color-text-muted)', display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                        {t.start_date && <span>Début: {new Date(t.start_date).toLocaleDateString('fr-FR')}</span>}
                        {t.end_date && <span>Fin: {new Date(t.end_date).toLocaleDateString('fr-FR')}</span>}

                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDraftTasks(draftTasks.filter((_, i) => i !== idx))}
                      style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash size={18} variant="Linear" color="var(--color-danger)" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste de mes tâches */}
          <div className="my-tasks-section">
            <div className="my-tasks-header">
              <h4 className="my-tasks-title">
                Mes tâches ({currentTasks.filter(t => t.createdBy === 'me').length})
              </h4>
            </div>

            {currentTasks.filter(t => t.createdBy === 'me').length === 0 ? (
              <div className="my-tasks-empty">
                <TaskSquare size={32} variant="Linear" color="#9CA3AF" />
                <p>Vous n'avez encore ajouté aucune tâche.</p>
              </div>
            ) : (
              <div className="my-tasks-list">
                {currentTasks.filter(t => t.createdBy === 'me').map((task) => (
                  <div
                    key={task.id}
                    className={`my-task-item ${task.completed ? 'is-completed' : ''} ${task.failed ? 'is-failed' : ''}`}
                  >
                    {editingTaskId === task.id ? (
                      <div className="my-task-edit" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', width: '100%', padding: 'var(--spacing-3)', backgroundColor: 'rgba(58, 162, 221, 0.03)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-primary)' }}>
                        {taskAlert && (
                          <div className={`alert alert-${taskAlert.type} d-flex align-items-center`} role="alert" style={{ margin: 0, padding: '8px 12px', fontSize: 'var(--font-size-body-small)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ flex: 1 }}>{taskAlert.message}</div>
                          </div>
                        )}

                        <div>
                          <label className="tasks-add-label" style={{ fontSize: 'var(--font-size-body-small)', marginBottom: '4px', fontWeight: 'var(--font-weight-semibold)' }}>Titre <span className="required">*</span></label>
                          <input
                            type="text"
                            className="tasks-add-input"
                            value={editTaskTitle}
                            onChange={(e) => setEditTaskTitle(e.target.value)}
                            placeholder="Titre"
                            autoFocus
                            disabled={editTaskSaving}
                          />
                        </div>

                        <div>
                          <label className="tasks-add-label" style={{ fontSize: 'var(--font-size-body-small)', marginBottom: '4px', fontWeight: 'var(--font-weight-semibold)' }}>Description</label>
                          <textarea
                            className="tasks-add-input"
                            style={{ minHeight: '60px', resize: 'vertical', paddingTop: '8px' }}
                            value={editTaskDescription}
                            onChange={(e) => setEditTaskDescription(e.target.value)}
                            placeholder="Description (optionnel)"
                            disabled={editTaskSaving}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                          <div>
                            <label className="tasks-add-label" style={{ fontSize: 'var(--font-size-body-small)', marginBottom: '4px', fontWeight: 'var(--font-weight-semibold)' }}>Date de début</label>
                            <input
                              type="date"
                              className="tasks-add-input"
                              value={editTaskStartDate}
                              onChange={(e) => setEditTaskStartDate(e.target.value)}
                              disabled={editTaskSaving}
                              min={todayString}
                            />
                          </div>
                          <div>
                            <label className="tasks-add-label" style={{ fontSize: 'var(--font-size-body-small)', marginBottom: '4px', fontWeight: 'var(--font-weight-semibold)' }}>Date de fin</label>
                            <input
                              type="date"
                              className="tasks-add-input"
                              value={editTaskDeadline}
                              onChange={(e) => setEditTaskDeadline(e.target.value)}
                              disabled={editTaskSaving}
                              min={getMinDeadlineString(editTaskStartDate)}
                            />
                          </div>
                        </div>

                        <div className="my-task-edit-actions" style={{ marginTop: 'var(--spacing-2)' }}>
                          <button
                            type="button"
                            className="my-task-btn-cancel"
                            onClick={cancelEditTask}
                            disabled={editTaskSaving}
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            className="my-task-btn-save"
                            onClick={() => saveEditTask(task.id)}
                            disabled={!editTaskTitle.trim() || editTaskSaving}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            {editTaskSaving ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: '#ffffff', borderRightColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.75s linear infinite', marginRight: '4px' }}></span>
                                <span>Enregistrement...</span>
                              </>
                            ) : (
                              <>
                                <TickCircle size={14} variant="Bold" color="#FFFFFF" />
                                <span>Enregistrer</span>
                              </>
                            )}
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
                                <Calendar size={12} variant="Linear" color="#6C7278" />
                                {task.deadline}
                              </span>
                            )}
                            {task.completed && (
                              <span className="my-task-status completed">
                                <TickCircle size={12} variant="Bold" color="#22C55E" />
                                Terminée
                              </span>
                            )}
                            {task.failed && (
                              <span className="my-task-status failed">
                                <Danger size={12} variant="Bold" color="#EF4444" />
                                Échouée
                              </span>
                            )}
                            {!task.completed && !task.failed && (
                              <span className="my-task-status pending">
                                <Clock size={12} variant="Bold" color="#F59E0B" />
                                En cours
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="my-task-actions">
                          {!task.completed && !task.failed && (
                            <button
                              type="button"
                              className="my-task-action-btn edit"
                              onClick={() => startEditTask(task)}
                              title="Modifier"
                              disabled={deletingTaskIds.includes(task.id)}
                            >
                              <Edit2 size={16} variant="Linear" color="#3AA2DD" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="my-task-action-btn delete"
                            onClick={() => setTaskToDelete(task)}
                            title="Supprimer"
                            disabled={deletingTaskIds.includes(task.id)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {deletingTaskIds.includes(task.id) ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: 'var(--color-danger)', borderRightColor: 'var(--color-danger)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}></span>
                            ) : (
                              <Trash size={16} variant="Linear" color="#EF4444" />
                            )}
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

        <div className="am-offcanvas-footer">
          <button
            type="button"
            className="am-btn am-btn--secondary"
            onClick={closeTaskModal}
            disabled={taskSubmitSaving}
          >
            <CloseSquare size={16} variant="Linear" color="currentColor" className="me-2" />
            Annuler
          </button>
          <button
            type="button"
            className="am-btn am-btn--primary"
            onClick={submitNewTask}
            disabled={draftTasks.length === 0 || taskSubmitSaving}
          >
            {taskSubmitSaving ? (
              <>
                <span className="am-spinner" aria-hidden="true" />
                Confirmation...
              </>
            ) : (
              <>
                <TickCircle size={16} variant="Bold" color="#FFFFFF" className="me-2" />
                Confirmer
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
