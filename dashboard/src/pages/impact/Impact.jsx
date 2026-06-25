import React, { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import {
  People,
  Building,
  Tree,
  Heart,
  Calendar,
  Location,
  TickCircle,
  SearchNormal1,
  ArrowRight2,
  Award,
  Chart2,
  Profile2User,
  Clock,
  Briefcase,
  Activity
} from 'iconsax-react';
import { Header, Sidebar } from '../../components/layout';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText } from 'react-shimmer-effects';
import {
  getIncidentsService,
  getIncidentPredictionService,
  getIncidentAssignmentsService,
  getResolvedIncidentsService
} from '../incident/service/incident_service';
import { getTasksService } from '../incident/service/task_service';
import { getGlobalImpactService } from './service/impact_service';
import './impact.css';

const STRUCTURE_LABELS = {
  schools: 'Écoles',
  markets: 'Marchés',
  water_points: 'Sources d\'eau',
  main_roads_bridges: 'Routes / Ponts',
  residential_buildings: 'Bâtiments',
  maternities: 'Maternités',
  health_centers: 'Centres de santé',
  nurseries: 'Crèches'
};

const SEVERITY_META = {
  critical: { label: 'Critique', color: 'var(--color-danger)' },
  high: { label: 'Élevée', color: 'var(--color-warning)' },
  medium: { label: 'Modérée', color: 'var(--color-primary)' },
  low: { label: 'Faible', color: 'var(--color-success)' }
};

const getSeverity = (incident, prediction) => {
  const baseSeverity = incident.base_severity ?? prediction?.base_severity;
  if (baseSeverity !== undefined && baseSeverity !== null) {
    const val = parseFloat(baseSeverity);
    if (val >= 7) return 'critical';
    if (val >= 5) return 'high';
    if (val >= 3) return 'medium';
    return 'low';
  }
  return 'medium';
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// ===================================
// DÉFINITION DE LA BASE DE DONNÉES DE SIMULATION
// ===================================
const MOCK_INCIDENTS = [
  {
    id: 1,
    title: "Inondation majeure - Quartier Niamakoro",
    zone: "Bamako, Commune VI",
    description: "Montée subite des eaux du fleuve Niger inondant les habitations basses de Niamakoro. Évacuation en cours.",
    etat: "resolved",
    created_at: "2026-05-10T07:30:00Z",
    resolution_end_date: "2026-05-15T18:00:00Z",
    photo: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&h=400&fit=crop",
    reported_by_agent: false,
    take_in_charge_mode: "collaborative",
    user_id: { id: 101, first_name: "Moussa", last_name: "Diarra", organisation_name: "Citoyen" },
    user_full_name: "Moussa Diarra",
    user_email: "moussa.diarra@gmail.com",
    organisation_name: "Croix-Rouge Malienne",
    lattitude: 12.5850,
    longitude: -7.9600,
    participants: [
      { name: "Protection Civile", color: "#EF4444", initials: "PC" },
      { name: "Mairie de Bamako", color: "#3AA2DD", initials: "MB" }
    ]
  },
  {
    id: 2,
    title: "Foyer épidémique de choléra - Mopti Sévaré",
    zone: "Mopti, Sévaré",
    description: "Apparition de cas groupés de diarrhée aqueuse aiguë suspects de choléra près du port de Mopti. Intervention sanitaire d'urgence.",
    etat: "taken_into_account",
    created_at: "2026-06-02T09:00:00Z",
    resolution_end_date: null,
    photo: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop",
    reported_by_agent: true,
    take_in_charge_mode: "collaborative",
    user_id: { id: 10, first_name: "Dr. Alou", last_name: "Sangare", organisation_name: "OMS" },
    user_full_name: "Dr. Alou Sangare",
    user_email: "alou.sangare@who.int",
    organisation_name: "OMS",
    lattitude: 14.5300,
    longitude: -4.1000,
    participants: [
      { name: "Ministère de la Santé", color: "#22C55E", initials: "MS" },
      { name: "Médecins Sans Frontières", color: "#EF4444", initials: "MSF" }
    ]
  },
  {
    id: 3,
    title: "Feu de brousse hors contrôle - Kadiolo",
    zone: "Sikasso, Kadiolo",
    description: "Incendie de forêt menaçant les zones agricoles et habitations proches à la frontière de Kadiolo. Mobilisation locale.",
    etat: "in_progress",
    created_at: "2026-06-12T14:00:00Z",
    resolution_end_date: null,
    photo: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600&h=400&fit=crop",
    reported_by_agent: false,
    take_in_charge_mode: "internal",
    user_id: { id: 102, first_name: "Ousmane", last_name: "Coulibaly", organisation_name: "Citoyen" },
    user_full_name: "Ousmane Coulibaly",
    user_email: "ousmane.coul@outlook.com",
    organisation_name: "Eaux et Forêts",
    lattitude: 10.9500,
    longitude: -5.7500,
    participants: []
  },
  {
    id: 4,
    title: "Effondrement d'un immeuble résidentiel - Kayes",
    zone: "Kayes, Centre-ville",
    description: "Écroulement d'un bâtiment R+2 vétuste habité dans le quartier commercial de Kayes. Opérations de sauvetage activées.",
    etat: "resolved",
    created_at: "2026-04-15T22:30:00Z",
    resolution_end_date: "2026-04-18T16:00:00Z",
    photo: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=600&h=400&fit=crop",
    reported_by_agent: false,
    take_in_charge_mode: "collaborative",
    user_id: { id: 103, first_name: "Bintu", last_name: "Dembele", organisation_name: "Citoyen" },
    user_full_name: "Bintu Dembele",
    user_email: "bintu.demb@yahoo.fr",
    organisation_name: "Protection Civile",
    lattitude: 14.4500,
    longitude: -11.4400,
    participants: [
      { name: "Croix-Rouge Malienne", color: "#3AA2DD", initials: "CR" }
    ]
  },
  {
    id: 5,
    title: "Éboulement rocheux sur voie publique - Banamba",
    zone: "Koulikoro, Banamba",
    description: "Glissement de terrain obstruant totalement la route principale reliant Banamba, empêchant l'accès des véhicules.",
    etat: "declared",
    created_at: "2026-06-15T11:00:00Z",
    resolution_end_date: null,
    photo: "https://images.unsplash.com/photo-1587502537745-84b86da1204f?w=600&h=400&fit=crop",
    reported_by_agent: false,
    take_in_charge_mode: "internal",
    user_id: { id: 104, first_name: "Adama", last_name: "Sangare", organisation_name: "Citoyen" },
    user_full_name: "Adama Sangare",
    user_email: "adama.sangare@gmail.com",
    organisation_name: "Mairie de Banamba",
    lattitude: 13.5500,
    longitude: -7.4500,
    participants: []
  }
];

const MOCK_PREDICTIONS = {
  1: {
    base_severity: 8,
    total_population_exposed: 450,
    adult_men_exposed: 120,
    adult_women_exposed: 180,
    children_exposed: 150,
    impact_radius_meters: 1200,
    potential_risk: {
      message: "Risque accru de propagation de maladies hydriques le long du fleuve Niger.",
      stats: { total_pop: 1800, infrastructures: 12 },
      vector: "Eau / Courant fluvial"
    },
    schools: 2,
    markets: 1,
    water_points: 4,
    main_roads_bridges: 1,
    residential_buildings: 85,
    maternities_count: 1,
    health_centers: 1,
    nurseries_count: 2
  },
  2: {
    base_severity: 9,
    total_population_exposed: 920,
    adult_men_exposed: 300,
    adult_women_exposed: 320,
    children_exposed: 300,
    impact_radius_meters: 3000,
    potential_risk: {
      message: "Propagation rapide de l'épidémie par contamination des puits ouverts.",
      stats: { total_pop: 4500, infrastructures: 48 },
      vector: "Contact humain / Eau contaminée"
    },
    schools: 8,
    markets: 3,
    water_points: 12,
    main_roads_bridges: 0,
    residential_buildings: 320,
    maternities_count: 3,
    health_centers: 2,
    nurseries_count: 5
  },
  3: {
    base_severity: 6,
    total_population_exposed: 150,
    adult_men_exposed: 60,
    adult_women_exposed: 50,
    children_exposed: 40,
    impact_radius_meters: 2500,
    potential_risk: {
      message: "Propagation rapide favorisée par des vents forts d'Harmattan.",
      stats: { total_pop: 980, infrastructures: 4 },
      vector: "Vent / Végétations sèches"
    },
    schools: 1,
    markets: 0,
    water_points: 2,
    main_roads_bridges: 1,
    residential_buildings: 12,
    maternities_count: 0,
    health_centers: 0,
    nurseries_count: 0
  },
  4: {
    base_severity: 8,
    total_population_exposed: 80,
    adult_men_exposed: 30,
    adult_women_exposed: 30,
    children_exposed: 20,
    impact_radius_meters: 200,
    potential_risk: {
      message: "Fragilisation structurelle des bâtiments mitoyens.",
      stats: { total_pop: 250, infrastructures: 3 },
      vector: "Secousse de l'impact / Vibration"
    },
    schools: 0,
    markets: 1,
    water_points: 1,
    main_roads_bridges: 1,
    residential_buildings: 8,
    maternities_count: 1,
    health_centers: 0,
    nurseries_count: 1
  },
  5: {
    base_severity: 4,
    total_population_exposed: 30,
    adult_men_exposed: 10,
    adult_women_exposed: 12,
    children_exposed: 8,
    impact_radius_meters: 150,
    potential_risk: {
      message: "Risque de sur-éboulement en cas de nouvelles pluies.",
      stats: { total_pop: 120, infrastructures: 1 },
      vector: "Gravité / Ruissellement de pluie"
    },
    schools: 0,
    markets: 0,
    water_points: 0,
    main_roads_bridges: 1,
    residential_buildings: 3,
    maternities_count: 0,
    health_centers: 0,
    nurseries_count: 0
  }
};

const MOCK_TASKS = {
  1: [
    { id: 1001, title: "Évacuation des zones basses", description: "Mettre en sécurité les populations piégées par les eaux.", state: "done", end_date: "2026-05-11" },
    { id: 1002, title: "Distribution de kits de potabilisation", description: "Fournir de l'eau saine aux sinistrés.", state: "done", end_date: "2026-05-12" },
    { id: 1003, title: "Sécurisation des digues temporaires", description: "Renforcer les berges avec des sacs de sable.", state: "done", end_date: "2026-05-13" }
  ],
  2: [
    { id: 2001, title: "Mise en place de centres de traitement (CTC)", description: "Isoler et soigner d'urgence les patients atteints de choléra.", state: "done", end_date: "2026-06-04" },
    { id: 2002, title: "Campagne de vaccination d'urgence", description: "Vacciner les populations dans un rayon de 3km.", state: "in_progress", end_date: "2026-06-25" },
    { id: 2003, title: "Désinfection des points d'eau communautaires", description: "Chloration des puits et sources.", state: "pending", end_date: "2026-06-20" }
  ],
  3: [
    { id: 3001, title: "Création de pare-feux", description: "Dégager la végétation pour stopper la propagation.", state: "done", end_date: "2026-06-13" },
    { id: 3002, title: "Évacuation des hameaux isolés", description: "Éloigner les populations menacées par la fumée.", state: "in_progress", end_date: "2026-06-18" }
  ],
  4: [
    { id: 4001, title: "Recherche de survivants sous les décombres", description: "Recherche active avec les équipes de secours.", state: "done", end_date: "2026-04-16" },
    { id: 4002, title: "Étayage des structures attenantes", description: "Sécuriser les façades menaçant de s'effondrer.", state: "done", end_date: "2026-04-17" }
  ],
  5: [
    { id: 5001, title: "Déblaiement de la chaussée", description: "Retrait des rochers et de la terre avec engins lourds.", state: "pending", end_date: "2026-06-22" }
  ]
};

const MOCK_ASSIGNMENTS = {
  1: [
    { user_id: 1, agent_name: "Amadou Diallo", role: "Coordinateur terrain" },
    { user_id: 2, agent_name: "Fatoumata Traoré", role: "Secouriste principal" }
  ],
  2: [
    { user_id: 3, agent_name: "Ibrahim Keïta", role: "Médecin épidémiologiste" },
    { user_id: 4, agent_name: "Awa Touré", role: "Infirmière de terrain" }
  ],
  3: [
    { user_id: 5, agent_name: "Modibo Kone", role: "Chef de brigade incendie" }
  ],
  4: [
    { user_id: 2, agent_name: "Fatoumata Traoré", role: "Secouriste principal" },
    { user_id: 6, agent_name: "Bakary Sidibe", role: "Ingénieur Génie Civil" }
  ],
  5: []
};

export const Impact = () => {
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();

  // Filters State
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all'); // all | 30d | 90d | year
  const [statusFilter, setStatusFilter] = useState('both'); // both | resolved | taken_with_action
  const [structureFilter, setStructureFilter] = useState('all'); // all | schools | markets | water_points | etc.
  const [expanded, setExpanded] = useState(null);

  // Appel API pour récupérer les données globales d'impact
  const { data: globalImpactData, error: apiError, isLoading: isLoadingImpact } = useSWR(
    '/MapApi/impact/global',
    () => getGlobalImpactService(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  );

  // Appel API pour récupérer les incidents résolus
  const { data: resolvedIncidentsData, error: incidentsError, isLoading: isLoadingIncidents } = useSWR(
    '/MapApi/resolved-incidents',
    () => getResolvedIncidentsService(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Logger les données pour analyse
  useEffect(() => {
    if (globalImpactData) {
      console.log('========================================');
      console.log('📊 DONNÉES IMPACT GLOBAL REÇUES:');
      console.log('========================================');
      console.log('Structure complète:', JSON.stringify(globalImpactData, null, 2));
      console.log('========================================');
      console.log('Type de données:', typeof globalImpactData);
      console.log('Est un tableau?', Array.isArray(globalImpactData));
      console.log('Clés disponibles:', Object.keys(globalImpactData));
      console.log('========================================');
    }
    if (apiError) {
      console.error('❌ ERREUR API IMPACT:', apiError);
    }
  }, [globalImpactData, apiError]);

  // Logger les incidents résolus
  useEffect(() => {
    if (resolvedIncidentsData) {
      console.log('========================================');
      console.log('📋 INCIDENTS RÉSOLUS REÇUS:');
      console.log('========================================');
      console.log('Nombre d\'incidents:', resolvedIncidentsData.results?.length || resolvedIncidentsData.length || 0);
      console.log('Structure:', JSON.stringify(resolvedIncidentsData, null, 2));
      console.log('========================================');
    }
    if (incidentsError) {
      console.error('❌ ERREUR API INCIDENTS:', incidentsError);
    }
  }, [resolvedIncidentsData, incidentsError]);

  // Utiliser les vraies données ou fallback sur MOCK
  const loadingIncidents = isLoadingImpact || isLoadingIncidents;
  const loadingDetails = false;
  const error = apiError || incidentsError;
  
  // Normaliser les incidents (gérer pagination API)
  const incidentsList = resolvedIncidentsData 
    ? (Array.isArray(resolvedIncidentsData) 
        ? resolvedIncidentsData 
        : (resolvedIncidentsData.results || MOCK_INCIDENTS))
    : MOCK_INCIDENTS;
  
  // Extraire les prédictions depuis les incidents
  const predictions = useMemo(() => {
    if (!incidentsList || incidentsList.length === 0) return MOCK_PREDICTIONS;
    
    const preds = {};
    incidentsList.forEach(incident => {
      if (incident.prediction) {
        preds[incident.id] = incident.prediction;
      }
    });
    
    return Object.keys(preds).length > 0 ? preds : MOCK_PREDICTIONS;
  }, [incidentsList]);
  
  // Extraire les tâches depuis les incidents (tasks_by_organisation)
  const tasks = useMemo(() => {
    if (!incidentsList || incidentsList.length === 0) return MOCK_TASKS;
    
    const tasksMap = {};
    incidentsList.forEach(incident => {
      if (incident.tasks_by_organisation && Array.isArray(incident.tasks_by_organisation)) {
        // Aplatir toutes les tâches de toutes les organisations
        const allTasks = incident.tasks_by_organisation.flatMap(org => org.tasks || []);
        if (allTasks.length > 0) {
          tasksMap[incident.id] = allTasks;
        }
      }
    });
    
    return Object.keys(tasksMap).length > 0 ? tasksMap : MOCK_TASKS;
  }, [incidentsList]);
  
  // Assignments - garder MOCK pour l'instant (pas dans la structure API)
  const assignments = MOCK_ASSIGNMENTS;

  // Period filtering logic
  const isWithinPeriod = (incident, filter) => {
    if (filter === 'all') return true;
    if (!incident.created_at) return false;

    const incDate = new Date(incident.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - incDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (filter === '30d') return diffDays <= 30;
    if (filter === '90d') return diffDays <= 90;
    if (filter === 'year') return incDate.getFullYear() === now.getFullYear();
    return true;
  };

  // Status filtering logic
  const matchStatus = (incident, filter) => {
    const isResolved = incident.etat === 'resolved';
    const incTasks = tasks[incident.id] || [];
    const hasCompletedTask = incTasks.some((t) => t.state === 'done');
    const isTakenWithAction =
      (incident.etat === 'taken_into_account' || incident.etat === 'in_progress') &&
      hasCompletedTask;

    if (filter === 'resolved') return isResolved;
    if (filter === 'taken_with_action') return isTakenWithAction;
    if (filter === 'both') return isResolved || isTakenWithAction;
    return false;
  };

  // Structure type filtering logic
  const matchesStructureType = (incId, typeFilter) => {
    if (typeFilter === 'all') return true;
    const pred = predictions[incId];
    if (!pred) return false;

    let count = 0;
    if (typeFilter === 'schools') count = pred.schools ?? pred.social_data?.schools ?? 0;
    else if (typeFilter === 'markets') count = pred.markets ?? pred.social_data?.markets ?? 0;
    else if (typeFilter === 'water_points') count = pred.water_points ?? pred.social_data?.water_points ?? 0;
    else if (typeFilter === 'main_roads_bridges') count = pred.main_roads_bridges ?? pred.social_data?.main_roads_bridges ?? 0;
    else if (typeFilter === 'residential_buildings') count = pred.residential_buildings ?? pred.social_data?.residential_buildings ?? 0;
    else if (typeFilter === 'maternities') count = pred.maternities_count ?? pred.maternities ?? 0;
    else if (typeFilter === 'health_centers') count = pred.health_centers ?? 0;
    else if (typeFilter === 'nurseries') count = pred.nurseries_count ?? pred.nurseries ?? 0;

    return parseInt(count) > 0;
  };

  // Filtered dataset for statistics & final list display
  const filteredIncidents = useMemo(() => {
    const q = search.trim().toLowerCase();

    return incidentsList.filter((inc) => {
      // 1. Period filter
      if (!isWithinPeriod(inc, periodFilter)) return false;

      // 2. Status filter
      if (!matchStatus(inc, statusFilter)) return false;

      // 3. Structure type filter
      if (!matchesStructureType(inc.id, structureFilter)) return false;

      // 4. Search query
      if (!q) return true;
      const titleMatch = (inc.title || '').toLowerCase().includes(q);
      const zoneMatch = (inc.zone || inc.location || '').toLowerCase().includes(q);
      const descMatch = (inc.description || '').toLowerCase().includes(q);
      return titleMatch || zoneMatch || descMatch;
    });
  }, [incidentsList, search, periodFilter, statusFilter, structureFilter, tasks, predictions]);

  // Compute all global KPIs dynamically - Utilise les données de l'API si disponibles
  const globals = useMemo(() => {
    // Si on a les données de l'API, on les utilise directement
    if (globalImpactData) {
      return {
        direct: {
          total: globalImpactData.beneficiaires_directs?.total || 0,
          men: globalImpactData.beneficiaires_directs?.hommes || 0,
          women: globalImpactData.beneficiaires_directs?.femmes || 0,
          children: globalImpactData.beneficiaires_directs?.enfants || 0,
        },
        indirect: {
          total: globalImpactData.beneficiaires_indirects?.total || 0,
          men: Math.round((globalImpactData.beneficiaires_indirects?.total || 0) * 0.33),
          women: Math.round((globalImpactData.beneficiaires_indirects?.total || 0) * 0.34),
          children: Math.round((globalImpactData.beneficiaires_indirects?.total || 0) * 0.33),
        },
        structures: globalImpactData.infrastructures_detail || {
          schools: 0,
          markets: 0,
          water_points: 0,
          main_roads_bridges: 0,
          residential_buildings: 0,
          maternities: 0,
          health_centers: 0,
          nurseries: 0,
        },
        totalStructures: globalImpactData.infrastructures_total || 0,
        cumulativeAreaHa: globalImpactData.superficie_ha || 0,
        avgResolutionTimeDays: globalImpactData.temps_moyen_resolution || 0,
        resolutionRate: globalImpactData.taux_resolution || 0,
        incidentsWithoutAnalysis: globalImpactData.incidents_sans_analyse || 0,
        mobilization: {
          organisationsCount: globalImpactData.mobilisation?.organisations_distinctes || 0,
          agentsCount: globalImpactData.mobilisation?.agents_terrain || 0,
          collaborationsCount: globalImpactData.mobilisation?.collaborations || 0,
          collaborativeCount: 0, // Non disponible dans l'API
          individualCount: 0, // Non disponible dans l'API
        },
        citizen: {
          received: globalImpactData.contribution_citoyenne?.signalements_recus || 0,
          verified: globalImpactData.contribution_citoyenne?.signalements_verifies || 0,
          withAction: globalImpactData.contribution_citoyenne?.transformes_actions || 0,
          contributorsCount: 0, // Non disponible dans l'API
        },
      };
    }

    // Sinon, on calcule à partir des données MOCK (code existant)
    let directMen = 0;
    let directWomen = 0;
    let directChildren = 0;
    let directTotal = 0;

    let indirectTotal = 0;

    const structures = {
      schools: 0,
      markets: 0,
      water_points: 0,
      main_roads_bridges: 0,
      residential_buildings: 0,
      maternities: 0,
      health_centers: 0,
      nurseries: 0,
    };

    let totalResolutionTimeMs = 0;
    let resolvedIncidentsCount = 0;

    const uniqueOrganisations = new Set();
    const uniqueAgents = new Set();
    let totalCollaborations = 0;
    let collaborativeIncidentsCount = 0;
    let individualIncidentsCount = 0;

    let citizenReportsReceived = 0;
    let citizenReportsVerified = 0;
    let citizenReportsWithAction = 0;
    const uniqueCitizenContributors = new Set();

    let cumulativeAreaHa = 0;

    // We compute Resolution Rate over the selected period, regardless of the status filter
    let totalPeriodIncidents = 0;
    let resolvedPeriodIncidents = 0;

    incidentsList.forEach((inc) => {
      // Period filter check
      if (!isWithinPeriod(inc, periodFilter)) return;

      totalPeriodIncidents++;
      if (inc.etat === 'resolved') {
        resolvedPeriodIncidents++;
      }

      // Check if it matches the current status filter + structure filter
      if (!matchStatus(inc, statusFilter)) return;
      if (!matchesStructureType(inc.id, structureFilter)) return;

      const isResolved = inc.etat === 'resolved';
      const pred = predictions[inc.id] || null;
      const incTasks = tasks[inc.id] || [];
      const incAssignments = assignments[inc.id] || [];

      // Check if taken into account with action
      const hasCompletedTask = incTasks.some((t) => t.state === 'done');
      const isTakenWithAction =
        (inc.etat === 'taken_into_account' || inc.etat === 'in_progress') &&
        hasCompletedTask;

      // 1. Direct Beneficiaries
      if (pred) {
        const men = parseInt(pred.adult_men_exposed || pred.human_impact?.adult_men_exposed || 0);
        const women = parseInt(pred.adult_women_exposed || pred.human_impact?.adult_women_exposed || 0);
        const children = parseInt(pred.children_exposed || pred.human_impact?.children_exposed || 0);
        const total = parseInt(
          pred.total_population_exposed ||
          pred.human_impact?.total_population_exposed ||
          men + women + children
        );

        directMen += men;
        directWomen += women;
        directChildren += children;
        directTotal += total;

        // 2. Indirect Beneficiaries
        const indirectPop = parseInt(pred.potential_risk?.stats?.total_pop || 0);
        indirectTotal += indirectPop;

        // 3. Sensitive structures protected
        structures.schools += parseInt(pred.schools ?? pred.social_data?.schools ?? 0);
        structures.markets += parseInt(pred.markets ?? pred.social_data?.markets ?? 0);
        structures.water_points += parseInt(pred.water_points ?? pred.social_data?.water_points ?? 0);
        structures.main_roads_bridges += parseInt(pred.main_roads_bridges ?? pred.social_data?.main_roads_bridges ?? 0);
        structures.residential_buildings += parseInt(pred.residential_buildings ?? pred.social_data?.residential_buildings ?? 0);
        structures.maternities += parseInt(pred.maternities_count ?? pred.maternities ?? 0);
        structures.health_centers += parseInt(pred.health_centers ?? 0);
        structures.nurseries += parseInt(pred.nurseries_count ?? pred.nurseries ?? 0);

        // 4. Cumulative Area (only for resolved incidents)
        if (isResolved) {
          const radius = parseFloat(pred.impact_radius_meters || 0);
          const areaHa = (Math.PI * Math.pow(radius, 2)) / 10000;
          cumulativeAreaHa += areaHa;
        }
      }

      // 5. Average Resolution Time (resolution_end_date to created_at)
      if (isResolved && inc.resolution_end_date && inc.created_at) {
        const durationMs = new Date(inc.resolution_end_date) - new Date(inc.created_at);
        if (durationMs > 0) {
          totalResolutionTimeMs += durationMs;
          resolvedIncidentsCount++;
        }
      }

      // 6. Mobilization of actors
      const leaderOrg = inc.organisation_name || inc.organisation || inc.user_id?.organisation_name;
      if (leaderOrg && leaderOrg !== 'Non spécifié') {
        uniqueOrganisations.add(leaderOrg);
      }
      if (inc.participants && Array.isArray(inc.participants)) {
        inc.participants.forEach((p) => {
          if (p.name) uniqueOrganisations.add(p.name);
        });
        totalCollaborations += inc.participants.length;
      }

      // Field agents assigned
      incAssignments.forEach((a) => {
        const agentId = a.user_id || a.assigned_to?.id;
        if (agentId) uniqueAgents.add(agentId);
      });

      // Treated in collaboration vs individually
      const isCollabMode =
        inc.take_in_charge_mode === 'collaborative' ||
        (inc.participants && inc.participants.length > 0);
      if (isCollabMode) {
        collaborativeIncidentsCount++;
      } else if (inc.take_in_charge_mode === 'internal' || (inc.taken_by && !isCollabMode)) {
        individualIncidentsCount++;
      }

      // 7. Citizen contribution
      const isCitizenReport = !inc.reported_by_agent;
      if (isCitizenReport) {
        citizenReportsReceived++;
        if (inc.etat !== 'declared') {
          citizenReportsVerified++;
        }
        if (isResolved || isTakenWithAction) {
          citizenReportsWithAction++;
        }
        const citizenId =
          inc.user_id?.id || inc.user_id || inc.user_full_name || inc.user_email;
        if (citizenId) {
          uniqueCitizenContributors.add(citizenId);
        }
      }
    });

    // Distribute indirect cohort population proportionally based on direct cohort ratios
    let indirectMen = 0;
    let indirectWomen = 0;
    let indirectChildren = 0;

    if (indirectTotal > 0) {
      if (directTotal > 0) {
        const menRatio = directMen / directTotal;
        const womenRatio = directWomen / directTotal;
        indirectMen = Math.round(indirectTotal * menRatio);
        indirectWomen = Math.round(indirectTotal * womenRatio);
        indirectChildren = Math.max(0, indirectTotal - indirectMen - indirectWomen);
      } else {
        indirectMen = Math.round(indirectTotal * 0.33);
        indirectWomen = Math.round(indirectTotal * 0.34);
        indirectChildren = Math.max(0, indirectTotal - indirectMen - indirectWomen);
      }
    }

    const avgResolutionTimeDays =
      resolvedIncidentsCount > 0
        ? Math.round((totalResolutionTimeMs / (1000 * 60 * 60 * 24) / resolvedIncidentsCount) * 10) / 10
        : 0;

    const resolutionRate =
      totalPeriodIncidents > 0 ? (resolvedPeriodIncidents / totalPeriodIncidents) * 100 : 0;

    return {
      direct: {
        total: directTotal,
        men: directMen,
        women: directWomen,
        children: directChildren,
      },
      indirect: {
        total: indirectTotal,
        men: indirectMen,
        women: indirectWomen,
        children: indirectChildren,
      },
      structures,
      totalStructures: Object.values(structures).reduce((a, b) => a + b, 0),
      avgResolutionTimeDays,
      resolutionRate,
      mobilization: {
        organisationsCount: uniqueOrganisations.size,
        agentsCount: uniqueAgents.size,
        collaborationsCount: totalCollaborations,
        collaborativeCount: collaborativeIncidentsCount,
        individualCount: individualIncidentsCount,
      },
      citizen: {
        received: citizenReportsReceived,
        verified: citizenReportsVerified,
        withAction: citizenReportsWithAction,
        contributorsCount: uniqueCitizenContributors.size,
      },
      cumulativeAreaHa,
    };
  }, [globalImpactData, incidentsList, periodFilter, statusFilter, structureFilter, predictions, tasks, assignments]);

  // Main isLoading flag combining SWR loading and details loading
  const isDataLoading = loadingIncidents || (incidentsList.length > 0 && loadingDetails);

  return (
    <div className="impact-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div className={`impact-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="impact-content">
          <div className="impact-page">
            {/* Page Header */}
            <div className="impact-page-header">
              <div className="impact-header-left">

                <div>
                  <h1 className="impact-title">Impact</h1>
                  <p className="impact-subtitle">
                    Mesure et consolidation de l'impact des interventions de Map Action sur le terrain.
                  </p>
                </div>
              </div>
            </div>

            {/* Global Filters bar */}
            <div className="impact-filters-section">
              <div className="impact-filters-group">
                <div className="impact-filter-col">
                  <label className="impact-filter-label">Période</label>
                  <div className="impact-period-filters">
                    <button
                      type="button"
                      className={`impact-period-btn ${periodFilter === 'all' ? 'is-active' : ''}`}
                      onClick={() => setPeriodFilter('all')}
                    >
                      Toute la période
                    </button>
                    <button
                      type="button"
                      className={`impact-period-btn ${periodFilter === '30d' ? 'is-active' : ''}`}
                      onClick={() => setPeriodFilter('30d')}
                    >
                      30 derniers jours
                    </button>
                    <button
                      type="button"
                      className={`impact-period-btn ${periodFilter === '90d' ? 'is-active' : ''}`}
                      onClick={() => setPeriodFilter('90d')}
                    >
                      90 derniers jours
                    </button>
                    <button
                      type="button"
                      className={`impact-period-btn ${periodFilter === 'year' ? 'is-active' : ''}`}
                      onClick={() => setPeriodFilter('year')}
                    >
                      Cette année
                    </button>
                  </div>
                </div>

                <div className="impact-filter-col">
                  <label className="impact-filter-label">Statut des Incidents</label>
                  <div className="impact-period-filters">
                    <button
                      type="button"
                      className={`impact-period-btn ${statusFilter === 'both' ? 'is-active' : ''}`}
                      onClick={() => setStatusFilter('both')}
                    >
                      Les 2 ensembles
                    </button>
                    <button
                      type="button"
                      className={`impact-period-btn ${statusFilter === 'resolved' ? 'is-active' : ''}`}
                      onClick={() => setStatusFilter('resolved')}
                    >
                      Incidents résolus
                    </button>
                    <button
                      type="button"
                      className={`impact-period-btn ${statusFilter === 'taken_with_action' ? 'is-active' : ''}`}
                      onClick={() => setStatusFilter('taken_with_action')}
                    >
                      Pris en compte avec action
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isDataLoading ? (
              // Shimmer Loading Skeleton
              <div className="impact-skeleton-container">
                <div className="impact-skeleton-grid">
                  <ShimmerThumbnail height={160} rounded />
                  <ShimmerThumbnail height={160} rounded />
                  <ShimmerThumbnail height={160} rounded />
                  <ShimmerThumbnail height={160} rounded />
                </div>
                <div className="impact-skeleton-subgrid">
                  <ShimmerThumbnail height={200} rounded />
                  <ShimmerThumbnail height={200} rounded />
                </div>
                <ShimmerTitle line={1} gap={10} variant="secondary" />
                <ShimmerText line={4} gap={10} />
              </div>
            ) : error ? (
              <div className="impact-empty">
                <Award size={48} variant="Linear" color="#EF4444" />
                <p>Une erreur est survenue lors de la récupération des statistiques d'impact.</p>
              </div>
            ) : (
              <>
                {/* Section 1: Performance & Mobilization */}
                <div className="impact-grid-performance">
                  {/* Resolution speed & rate */}
                  <div className="performance-card">
                    <h3 className="section-subtitle-impact">Performance des interventions</h3>
                    <div className="performance-row-inner">
                      <div className="perf-item-value">
                        <div className="perf-circle">
                          <Clock size={28} variant="Bold" color="#3AA2DD" />
                        </div>
                        <div className="perf-stats">
                          <span className="perf-val">
                            {globals.avgResolutionTimeDays > 0
                              ? `${globals.avgResolutionTimeDays} jours`
                              : '—'}
                          </span>
                          <span className="perf-lbl">Temps moyen de résolution</span>
                        </div>
                      </div>

                      <div className="perf-item-value">
                        <div className="perf-circle">
                          <Chart2 size={28} variant="Bold" color="#22C55E" />
                        </div>
                        <div className="perf-stats">
                          <span className="perf-val">
                            {globals.resolutionRate.toFixed(1)}%
                          </span>
                          <span className="perf-lbl">Taux de résolution</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobilisation Card */}
                  <div className="performance-card">
                    <h3 className="section-subtitle-impact">Mobilisation des acteurs</h3>
                    <div className="actor-stats-grid">
                      <div className="actor-badge">
                        <Briefcase size={20} variant="Bold" color="#8B5CF6" />
                        <span className="actor-num">{globals.mobilization.organisationsCount}</span>
                        <span className="actor-lbl">Organisations impliquées</span>
                      </div>

                      <div className="actor-badge">
                        <Profile2User size={20} variant="Bold" color="#F59E0B" />
                        <span className="actor-num">{globals.mobilization.agentsCount}</span>
                        <span className="actor-lbl">Agents de terrain</span>
                      </div>

                      <div className="actor-badge">
                        <People size={20} variant="Bold" color="#3AA2DD" />
                        <span className="actor-num">{globals.mobilization.collaborationsCount}</span>
                        <span className="actor-lbl">Collaborations créées</span>
                      </div>
                    </div>

                    <div className="collab-split-bar">
                      <div className="collab-split-item">
                        <span>Traités en collaboration :</span>
                        <strong>{globals.mobilization.collaborativeCount}</strong>
                      </div>
                      <div className="collab-split-item">
                        <span>Traités individuellement :</span>
                        <strong>{globals.mobilization.individualCount}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Citizen Contribution */}
                <div className="citizen-contribution-section">
                  <h3 className="section-subtitle-impact">Contribution citoyenne</h3>
                  <div className="citizen-grid">
                    <div className="citizen-card">
                      <Activity size={24} variant="Bold" color="#3AA2DD" />
                      <span className="citizen-number">{globals.citizen.received}</span>
                      <span className="citizen-lbl">Signalements reçus</span>
                    </div>

                    <div className="citizen-card">
                      <TickCircle size={24} variant="Bold" color="#22C55E" />
                      <span className="citizen-number">{globals.citizen.verified}</span>
                      <span className="citizen-lbl">Signalements vérifiés</span>
                    </div>

                    <div className="citizen-card">
                      <Award size={24} variant="Bold" color="#F59E0B" />
                      <span className="citizen-number">{globals.citizen.withAction}</span>
                      <span className="citizen-lbl">Ayant conduit à une action</span>
                    </div>

                    <div className="citizen-card">
                      <Profile2User size={24} variant="Bold" color="#8B5CF6" />
                      <span className="citizen-number">{globals.citizen.contributorsCount}</span>
                      <span className="citizen-lbl">Citoyens contributeurs actifs</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Filtered Incidents List */}
                <div className="impact-section">
                  <div className="impact-section-header">
                    <SearchNormal1 size={22} variant="Bold" color="#3AA2DD" />
                    <h2 className="impact-section-title">
                      Incidents filtrés ({filteredIncidents.length})
                    </h2>
                  </div>

                  {/* Search incident input */}
                  <div className="impact-toolbar">
                    <div className="impact-search">
                      <SearchNormal1 size={18} variant="Linear" color="#6C7278" />
                      <input
                        type="text"
                        placeholder="Rechercher un incident par titre, description, zone…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredIncidents.length === 0 ? (
                    <div className="impact-empty">
                      <Award size={48} variant="Linear" color="#9CA3AF" />
                      <p>Aucun incident ne correspond à vos critères et filtres actuels.</p>
                    </div>
                  ) : (
                    <div className="impact-list">
                      {filteredIncidents.map((inc) => {
                        const pred = predictions[inc.id];
                        const incTasks = tasks[inc.id] || [];
                        const incAssignments = assignments[inc.id] || [];
                        const severity = getSeverity(inc, pred);
                        const sev = SEVERITY_META[severity];
                        const isOpen = expanded === inc.id;

                        // Calculate impact area for this card
                        const radius = parseFloat(pred?.impact_radius_meters || 0);
                        const areaHa = (Math.PI * Math.pow(radius, 2)) / 10000;

                        return (
                          <article
                            key={inc.id}
                            className={`impact-incident-card ${isOpen ? 'is-open' : ''}`}
                          >
                            <div
                              className="impact-card-main"
                              onClick={() => setExpanded(isOpen ? null : inc.id)}
                            >
                              <div
                                className="impact-card-thumb"
                                style={
                                  inc.photo || inc.photo_url || inc.image || inc.incident_details?.photo
                                    ? { backgroundImage: `url(${inc.photo || inc.photo_url || inc.image || inc.incident_details?.photo})` }
                                    : undefined
                                }
                              >
                                <span
                                  className="impact-severity-tag"
                                  style={{ backgroundColor: sev.color }}
                                >
                                  {sev.label}
                                </span>
                              </div>

                              <div className="impact-card-info">
                                <div className="impact-card-top">
                                  <span className="impact-card-type">{inc.zone || 'Zone non spécifiée'}</span>
                                  <span className="impact-card-dot">•</span>
                                  <span className="impact-card-region">
                                    <Location size={12} variant="Bold" color="#6C7278" />
                                    {inc.lattitude && inc.longitude
                                      ? `${parseFloat(inc.lattitude).toFixed(4)}°N, ${parseFloat(
                                        inc.longitude
                                      ).toFixed(4)}°E`
                                      : 'Coordonnées non spécifiées'}
                                  </span>
                                </div>

                                <h3 className="impact-card-title">{inc.title || 'Incident sans titre'}</h3>
                                <p className="impact-card-summary">
                                  {inc.description || 'Aucune description disponible pour cet incident.'}
                                </p>

                                {/* Inline metadata badges */}
                                <div className="impact-incident-meta-inline">
                                  {pred && (
                                    <>
                                      <div className="impact-card-metric text-primary">
                                        <People size={13} variant="Bold" color="#3AA2DD" />
                                        <strong>
                                          {(pred.total_population_exposed || 0).toLocaleString('fr-FR')}
                                        </strong>
                                        <span>directs</span>
                                      </div>

                                      <div className="impact-card-metric text-purple">
                                        <Profile2User size={13} variant="Bold" color="#8B5CF6" />
                                        <strong>
                                          {(pred.potential_risk?.stats?.total_pop || 0).toLocaleString('fr-FR')}
                                        </strong>
                                        <span>indirects</span>
                                      </div>

                                      {areaHa > 0 && (
                                        <div className="impact-card-metric text-success">
                                          <Tree size={13} variant="Bold" color="#22C55E" />
                                          <strong>{areaHa.toFixed(1)}</strong>
                                          <span>ha impactés</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>

                                <div className="impact-card-meta">
                                  <div className="impact-meta-row">
                                    <Calendar size={13} variant="Bold" color="#6C7278" />
                                    <span>
                                      Créé le {formatDate(inc.created_at)}
                                      {inc.resolution_end_date &&
                                        ` · Résolu le ${formatDate(inc.resolution_end_date)}`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className={`impact-toggle ${isOpen ? 'is-open' : ''}`}
                                aria-label={isOpen ? 'Réduire' : 'Voir le détail'}
                              >
                                <ArrowRight2 size={18} variant="Linear" color="#6C7278" />
                              </button>
                            </div>

                            {isOpen && (
                              <div className="impact-card-body">
                                {/* Details Grid */}
                                <div className="impact-detail-grid">
                                  {/* Direct human exposure details */}
                                  <div className="impact-detail-card is-direct">
                                    <div className="impact-detail-header">
                                      <People size={16} variant="Bold" color="currentColor" />
                                      <span>Bénéficiaires Directs</span>
                                    </div>
                                    <ul className="impact-detail-list">
                                      <li>
                                        <span className="impact-detail-key">Total exposés</span>
                                        <span className="impact-detail-val">
                                          {(pred?.total_population_exposed || 0).toLocaleString('fr-FR')}
                                        </span>
                                      </li>
                                      <li>
                                        <span className="impact-detail-key">Hommes adultes</span>
                                        <span className="impact-detail-val">
                                          {(pred?.adult_men_exposed || 0).toLocaleString('fr-FR')}
                                        </span>
                                      </li>
                                      <li>
                                        <span className="impact-detail-key">Femmes adultes</span>
                                        <span className="impact-detail-val">
                                          {(pred?.adult_women_exposed || 0).toLocaleString('fr-FR')}
                                        </span>
                                      </li>
                                      <li>
                                        <span className="impact-detail-key">Enfants</span>
                                        <span className="impact-detail-val">
                                          {(pred?.children_exposed || 0).toLocaleString('fr-FR')}
                                        </span>
                                      </li>
                                    </ul>
                                  </div>

                                  {/* Indirect human exposure details */}
                                  <div className="impact-detail-card is-indirect">
                                    <div className="impact-detail-header">
                                      <Profile2User size={16} variant="Bold" color="currentColor" />
                                      <span>Bénéficiaires Indirects</span>
                                    </div>
                                    <ul className="impact-detail-list">
                                      <li>
                                        <span className="impact-detail-key">Zone à risque</span>
                                        <span className="impact-detail-val">
                                          {(pred?.potential_risk?.stats?.total_pop || 0).toLocaleString('fr-FR')}
                                        </span>
                                      </li>
                                      <li>
                                        <span className="impact-detail-key">Rayon d'impact</span>
                                        <span className="impact-detail-val">
                                          {pred?.impact_radius_meters ? `${pred.impact_radius_meters} m` : 'N/A'}
                                        </span>
                                      </li>
                                      <li>
                                        <span className="impact-detail-key">Vecteur</span>
                                        <span className="impact-detail-val">
                                          {pred?.potential_risk?.vector || 'N/A'}
                                        </span>
                                      </li>
                                      <li>
                                        <span className="impact-detail-key">Bâtiments à risque</span>
                                        <span className="impact-detail-val">
                                          {pred?.potential_risk?.stats?.infrastructures || 0} sites
                                        </span>
                                      </li>
                                    </ul>
                                  </div>

                                  {/* Protected sensitive structures */}
                                  <div className="impact-detail-card is-structures">
                                    <div className="impact-detail-header">
                                      <Building size={16} variant="Bold" color="currentColor" />
                                      <span>Structures Sensibles</span>
                                    </div>
                                    <ul className="impact-detail-list scrollable-list">
                                      {Object.entries(STRUCTURE_LABELS).map(([key, label]) => {
                                        let val = 0;
                                        if (pred) {
                                          if (key === 'schools') val = pred.schools ?? pred.social_data?.schools ?? 0;
                                          else if (key === 'markets') val = pred.markets ?? pred.social_data?.markets ?? 0;
                                          else if (key === 'water_points') val = pred.water_points ?? pred.social_data?.water_points ?? 0;
                                          else if (key === 'main_roads_bridges') val = pred.main_roads_bridges ?? pred.social_data?.main_roads_bridges ?? 0;
                                          else if (key === 'residential_buildings') val = pred.residential_buildings ?? pred.social_data?.residential_buildings ?? 0;
                                          else if (key === 'maternities') val = pred.maternities_count ?? pred.maternities ?? 0;
                                          else if (key === 'health_centers') val = pred.health_centers ?? 0;
                                          else if (key === 'nurseries') val = pred.nurseries_count ?? pred.nurseries ?? 0;
                                        }
                                        return (
                                          <li key={key}>
                                            <span className="impact-detail-key">{label}</span>
                                            <span className="impact-detail-val">{val}</span>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                </div>

                                {/* Mobilization list */}
                                <div className="impact-orgs">
                                  <h4 className="impact-orgs-label">Mobilisation des Acteurs</h4>
                                  <div className="impact-orgs-details">
                                    <div className="impact-orgs-chips-row">
                                      <span className="details-sublabel">Organisations :</span>
                                      <div className="impact-orgs-list">
                                        {(() => {
                                          const orgs = [];
                                          const leader = inc.organisation_name || inc.organisation || inc.user_id?.organisation_name;
                                          if (leader && leader !== 'Non spécifié') orgs.push(leader);
                                          if (inc.participants && Array.isArray(inc.participants)) {
                                            inc.participants.forEach((p) => {
                                              if (p.name && !orgs.includes(p.name)) orgs.push(p.name);
                                            });
                                          }
                                          if (orgs.length === 0) return <span className="text-muted">Aucune organisation spécifiée</span>;
                                          return orgs.map((org, idx) => (
                                            <span key={idx} className="impact-org-chip">
                                              {org}
                                            </span>
                                          ));
                                        })()}
                                      </div>
                                    </div>

                                    {incAssignments.length > 0 && (
                                      <div className="impact-orgs-chips-row">
                                        <span className="details-sublabel">Agents assignés :</span>
                                        <div className="impact-orgs-list">
                                          {incAssignments.map((a, idx) => {
                                            const name = a.agent_name || (a.assigned_to ? `${a.assigned_to.first_name} ${a.assigned_to.last_name}` : `Agent #${a.user_id}`);
                                            return (
                                              <span key={idx} className="impact-org-chip bg-blue">
                                                {name} {a.role ? `(${a.role})` : ''}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action Tasks List */}
                                <div className="impact-orgs">
                                  <h4 className="impact-orgs-label">Actions & Tâches effectives ({incTasks.length})</h4>
                                  {incTasks.length === 0 ? (
                                    <span className="text-muted">Aucune tâche assignée à cet incident.</span>
                                  ) : (
                                    <div className="tasks-grid">
                                      {incTasks.map((t) => {
                                        const isDone = t.state === 'done';
                                        return (
                                          <div key={t.id} className={`task-impact-card ${isDone ? 'done' : ''}`}>
                                            <div className="task-impact-header">
                                              <span className="task-title-text">{t.title}</span>
                                              <span className={`task-badge ${t.state}`}>
                                                {t.state === 'done' ? 'Terminée' : t.state === 'failed' ? 'Échouée' : t.state === 'in_progress' ? 'En cours' : 'En attente'}
                                              </span>
                                            </div>
                                            {t.description && <p className="task-desc-text">{t.description}</p>}
                                            {t.end_date && (
                                              <span className="task-date-text">
                                                Échéance : {formatDate(t.end_date)}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Impact;
