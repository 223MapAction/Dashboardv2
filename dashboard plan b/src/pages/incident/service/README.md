# Services Incident

Ce dossier contient tous les services pour gérer les incidents et leurs fonctionnalités associées.

## Structure des fichiers

- **incident_service.jsx** - Gestion des incidents (liste, détail, prise en charge, clôture)
- **task_service.jsx** - Gestion des tâches d'un incident
- **suggestion_service.jsx** - Gestion des suggestions de partenaires
- **collaboration_service.jsx** - Gestion des demandes de collaboration
- **discussion_service.jsx** - Gestion des messages de discussion
- **index.js** - Export centralisé de tous les services

## Utilisation

### Import des services

```javascript
// Import depuis le fichier index
import { 
  getIncidentsService, 
  takeInChargeIncidentService,
  getTasksService,
  createTaskService
} from './service';

// Ou import direct
import { getIncidentsService } from './service/incident_service';
```

## Services disponibles

### 📋 Incident Service

#### `getIncidentsService(filterType)`
Récupère la liste des incidents
- **Params**: `filterType` (string) - 'all', etc.
- **Returns**: Array d'incidents

#### `getIncidentService(id)`
Récupère un incident spécifique
- **Params**: `id` (number)
- **Returns**: Objet incident

#### `deleteIncidentService(id)`
Supprime un incident
- **Params**: `id` (number)
- **Returns**: Response data

#### `takeInChargeIncidentService(incidentId)`
Prendre en charge un incident (devenir leader)
- **Params**: `incidentId` (number)
- **Returns**: Incident mis à jour

#### `closeIncidentService(incidentId, data)`
Clôturer un incident (leader uniquement)
- **Params**: 
  - `incidentId` (number)
  - `data` (object): `{ resolution_start_date, resolution_end_date }`
- **Returns**: Incident clôturé

---

### ✅ Task Service

#### `getTasksService(incidentId)`
Liste des tâches d'un incident
- **Params**: `incidentId` (number)
- **Returns**: Array de tâches

#### `createTaskService(incidentId, data)`
Créer une tâche (leader uniquement)
- **Params**: 
  - `incidentId` (number)
  - `data` (object): `{ title, description, start_date, end_date, assigned_to }`
- **Returns**: Tâche créée

#### `getTaskService(incidentId, taskId)`
Détail d'une tâche
- **Params**: `incidentId`, `taskId` (numbers)
- **Returns**: Objet tâche

#### `updateTaskService(incidentId, taskId, data)`
Modifier une tâche (PUT - leader uniquement)
- **Params**: `incidentId`, `taskId`, `data`
- **Returns**: Tâche mise à jour

#### `patchTaskService(incidentId, taskId, data)`
Modifier partiellement une tâche (PATCH - leader uniquement)
- **Params**: `incidentId`, `taskId`, `data`
- **Returns**: Tâche mise à jour

#### `deleteTaskService(incidentId, taskId)`
Supprimer une tâche (leader uniquement)
- **Params**: `incidentId`, `taskId` (numbers)
- **Returns**: Response data

#### `completeTaskService(incidentId, taskId, formData)`
Marquer une tâche comme terminée avec preuve (leader uniquement)
- **Params**: 
  - `incidentId`, `taskId` (numbers)
  - `formData` (FormData): `{ proof_image, proof_video }`
- **Returns**: Tâche complétée

#### `failTaskService(incidentId, taskId, data)`
Marquer une tâche comme échouée (leader uniquement)
- **Params**: 
  - `incidentId`, `taskId` (numbers)
  - `data` (object): `{ failure_reason }`
- **Returns**: Tâche échouée

---

### 💡 Suggestion Service

#### `getSuggestionsService(incidentId)`
Liste des suggestions de partenaires
- **Params**: `incidentId` (number)
- **Returns**: Array de suggestions

#### `createSuggestionService(incidentId, data)`
Créer une suggestion (contributeur uniquement)
- **Params**: 
  - `incidentId` (number)
  - `data` (object): `{ suggested_partner, suggested_role, justification }`
- **Returns**: Suggestion créée

#### `getSuggestionService(incidentId, suggestionId)`
Détail d'une suggestion
- **Params**: `incidentId`, `suggestionId` (numbers)
- **Returns**: Objet suggestion

#### `acceptSuggestionService(incidentId, suggestionId)`
Accepter une suggestion (leader uniquement)
- **Params**: `incidentId`, `suggestionId` (numbers)
- **Returns**: Suggestion acceptée

#### `rejectSuggestionService(incidentId, suggestionId)`
Rejeter une suggestion (leader uniquement)
- **Params**: `incidentId`, `suggestionId` (numbers)
- **Returns**: Suggestion rejetée

---

### 🤝 Collaboration Service

#### `getCollaborationsService()`
Liste des collaborations de l'utilisateur
- **Returns**: Array de collaborations

#### `requestCollaborationService(data)`
Demander à rejoindre un incident
- **Params**: `data` (object): `{ incident, role, motivation, end_date }`
- **Returns**: Collaboration créée

#### `acceptCollaborationService(collaborationId)`
Accepter une demande (leader uniquement)
- **Params**: `collaborationId` (number)
- **Returns**: Collaboration acceptée

#### `declineCollaborationService(collaborationId)`
Refuser une demande (leader uniquement)
- **Params**: `collaborationId` (number)
- **Returns**: Collaboration refusée

#### `handleCollaborationService(collaborationId, action)`
Gérer une collaboration (méthode alternative)
- **Params**: 
  - `collaborationId` (number)
  - `action` (string): 'accept' ou 'reject'
- **Returns**: Collaboration gérée

---

### 💬 Discussion Service

#### `getDiscussionMessagesService(incidentId)`
Liste des messages de discussion
- **Params**: `incidentId` (number)
- **Returns**: Array de messages

#### `sendTextMessageService(incidentId, data)`
Envoyer un message texte
- **Params**: 
  - `incidentId` (number)
  - `data` (object): `{ message, recipient? }`
- **Returns**: Message créé

#### `sendAudioMessageService(incidentId, formData)`
Envoyer un message audio
- **Params**: 
  - `incidentId` (number)
  - `formData` (FormData): `{ audio, recipient? }`
- **Returns**: Message créé

#### `sendAttachmentMessageService(incidentId, formData)`
Envoyer un fichier
- **Params**: 
  - `incidentId` (number)
  - `formData` (FormData): `{ attachment, recipient? }`
- **Returns**: Message créé

#### `sendMessageService(incidentId, data)`
Envoyer un message (fonction générique)
- **Params**: 
  - `incidentId` (number)
  - `data` (object | FormData)
- **Returns**: Message créé

---

## Exemples d'utilisation

### Prendre en charge un incident
```javascript
const handleTakeCharge = async (incidentId) => {
  try {
    const result = await takeInChargeIncidentService(incidentId);
    console.log('Incident pris en charge:', result);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Créer une tâche
```javascript
const handleCreateTask = async (incidentId) => {
  try {
    const taskData = {
      title: 'Nettoyage de la zone',
      description: 'Nettoyer les débris',
      start_date: '2026-05-06',
      end_date: '2026-05-10',
      assigned_to: 5
    };
    const task = await createTaskService(incidentId, taskData);
    console.log('Tâche créée:', task);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Terminer une tâche avec preuve
```javascript
const handleCompleteTask = async (incidentId, taskId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('proof_image', imageFile);
    
    const result = await completeTaskService(incidentId, taskId, formData);
    console.log('Tâche terminée:', result);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Envoyer un message texte
```javascript
const handleSendMessage = async (incidentId, messageText) => {
  try {
    const result = await sendTextMessageService(incidentId, {
      message: messageText
    });
    console.log('Message envoyé:', result);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## Gestion des erreurs

Tous les services gèrent les erreurs et les loggent dans la console. Les erreurs sont propagées pour permettre une gestion personnalisée :

```javascript
try {
  await someService();
} catch (error) {
  if (error.response?.status === 403) {
    // Gérer l'erreur de permission
  } else if (error.response?.status === 400) {
    // Gérer l'erreur de validation
  }
}
```

## États et énumérations

### États d'incident
- `declared` - Déclaré
- `taken_into_account` - Pris en charge
- `in_progress` - En cours
- `resolved` - Résolu

### États de tâche
- `pending` - En attente
- `in_progress` - En cours
- `done` - Terminée
- `failed` - Échouée

### Rôles de collaboration
- `leader` - Leader (créé automatiquement lors de la prise en charge)
- `contributor` - Contributeur
- `observer` - Observateur

### Statuts de collaboration
- `pending` - En attente
- `accepted` - Acceptée
- `declined` - Refusée
