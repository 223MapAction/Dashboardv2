// Catégories d'impact
export const IMPACT_CATEGORIES = {
  people: {
    id: 'people',
    label: 'Personnes',
    color: '#3AA2DD',
    bgColor: 'rgba(58, 162, 221, 0.12)'
  },
  resources: {
    id: 'resources',
    label: 'Ressources',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)'
  },
  infrastructure: {
    id: 'infrastructure',
    label: 'Infrastructures',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.12)'
  },
  environment: {
    id: 'environment',
    label: 'Environnement',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.12)'
  },
  health: {
    id: 'health',
    label: 'Santé',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)'
  }
};

export const SEVERITY_META = {
  critical: { label: 'Critique', color: '#EF4444' },
  high: { label: 'Élevée', color: '#F59E0B' },
  medium: { label: 'Modérée', color: '#3AA2DD' },
  low: { label: 'Faible', color: '#22C55E' }
};

// Incidents résolus avec métriques d'impact
export const resolvedIncidents = [
  {
    id: 'i1',
    title: 'Inondation quartier Niamakoro',
    type: 'Inondation',
    location: 'Bamako, Commune VI',
    region: 'Bamako',
    severity: 'critical',
    image:
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&h=240&fit=crop',
    reportedAt: '2025-03-12T07:30:00',
    resolvedAt: '2025-03-18T15:00:00',
    durationDays: 6,
    organisations: ['Croix-Rouge Malienne', 'Protection Civile', 'Mairie'],
    impacts: {
      people: {
        rescued: 234,
        relocated: 87,
        treated: 56,
        total: 234
      },
      resources: {
        foodKits: 180,
        waterLiters: 12000,
        blankets: 320,
        total: 320
      },
      infrastructure: {
        homesAssessed: 145,
        homesRepaired: 23,
        roadsCleared: 4,
        total: 23
      },
      environment: {
        debrisRemovedTons: 18,
        zonesCleanedHa: 3.5,
        total: 18
      },
      health: {
        consultations: 78,
        vaccinations: 0,
        emergencyEvacs: 12,
        total: 78
      }
    },
    summary:
      "Intervention rapide ayant permis l'évacuation de plus de 230 habitants et la distribution de kits alimentaires d'urgence."
  },
  {
    id: 'i2',
    title: 'Épidémie de choléra Mopti',
    type: 'Sanitaire',
    location: 'Mopti, Sévaré',
    region: 'Mopti',
    severity: 'high',
    image:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=240&fit=crop',
    reportedAt: '2025-02-20T09:00:00',
    resolvedAt: '2025-03-10T18:00:00',
    durationDays: 18,
    organisations: ['OMS', 'Ministère Santé', 'MSF'],
    impacts: {
      people: { treated: 412, screened: 1850, total: 412 },
      health: {
        consultations: 1850,
        vaccinations: 980,
        emergencyEvacs: 34,
        total: 980
      },
      resources: {
        medicalKits: 250,
        waterLiters: 45000,
        total: 295
      }
    },
    summary:
      "Campagne de vaccination de masse et traitement des cas confirmés. Épidémie contenue en moins de 3 semaines."
  },
  {
    id: 'i3',
    title: 'Feu de brousse Sikasso',
    type: 'Incendie',
    location: 'Sikasso, Kadiolo',
    region: 'Sikasso',
    severity: 'high',
    image:
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=240&fit=crop',
    reportedAt: '2025-01-28T14:00:00',
    resolvedAt: '2025-02-02T10:00:00',
    durationDays: 5,
    organisations: ['Eaux et Forêts', 'Pompiers', 'Communautés locales'],
    impacts: {
      environment: {
        debrisRemovedTons: 45,
        zonesCleanedHa: 120,
        treesPlanted: 800,
        total: 120
      },
      people: { rescued: 45, relocated: 12, total: 45 },
      infrastructure: { homesAssessed: 18, homesRepaired: 9, total: 9 }
    },
    summary:
      "120 hectares préservés, programme de reforestation lancé. Intervention coordonnée avec les communautés locales."
  },
  {
    id: 'i4',
    title: 'Effondrement bâtiment Kayes',
    type: 'Infrastructure',
    location: 'Kayes, Centre-ville',
    region: 'Kayes',
    severity: 'critical',
    image:
      'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=400&h=240&fit=crop',
    reportedAt: '2025-04-05T22:30:00',
    resolvedAt: '2025-04-09T16:00:00',
    durationDays: 4,
    organisations: ['Protection Civile', 'Croix-Rouge', 'Génie Civil'],
    impacts: {
      people: { rescued: 18, treated: 11, total: 18 },
      infrastructure: {
        homesAssessed: 32,
        homesRepaired: 0,
        buildingsSecured: 6,
        total: 6
      },
      health: { consultations: 11, emergencyEvacs: 7, total: 11 }
    },
    summary:
      "Sauvetage de 18 personnes dont 4 enfants. Sécurisation rapide des bâtiments mitoyens."
  },
  {
    id: 'i5',
    title: 'Sécheresse cheptel Gao',
    type: 'Environnemental',
    location: 'Gao, Ansongo',
    region: 'Gao',
    severity: 'medium',
    image:
      'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=400&h=240&fit=crop',
    reportedAt: '2025-01-10T08:00:00',
    resolvedAt: '2025-03-25T12:00:00',
    durationDays: 74,
    organisations: ['FAO', 'PAM', 'Coopératives locales'],
    impacts: {
      people: { rescued: 0, relocated: 0, total: 1240 },
      resources: {
        foodKits: 620,
        waterLiters: 280000,
        total: 620
      },
      environment: {
        zonesCleanedHa: 45,
        treesPlanted: 1500,
        total: 45
      }
    },
    summary:
      "Distribution d'aliments pour bétail et fourniture d'eau pendant 2 mois. 1240 familles soutenues."
  },
  {
    id: 'i6',
    title: 'Glissement de terrain Koulikoro',
    type: 'Géologique',
    location: 'Koulikoro, Banamba',
    region: 'Koulikoro',
    severity: 'medium',
    image:
      'https://images.unsplash.com/photo-1587502537745-84b86da1204f?w=400&h=240&fit=crop',
    reportedAt: '2025-04-12T11:00:00',
    resolvedAt: '2025-04-16T17:00:00',
    durationDays: 4,
    organisations: ['Protection Civile', 'Mairie'],
    impacts: {
      people: { rescued: 8, relocated: 24, total: 32 },
      infrastructure: {
        homesAssessed: 15,
        homesRepaired: 5,
        roadsCleared: 2,
        total: 7
      },
      resources: {
        foodKits: 30,
        blankets: 50,
        total: 80
      }
    },
    summary:
      'Aucune perte humaine. 24 familles relogées temporairement, axe routier rouvert en 4 jours.'
  }
];

// Calcul d'agrégats globaux
export const computeGlobalImpact = (incidents) => {
  const totals = {
    incidentsResolved: incidents.length,
    peopleHelped: 0,
    resourcesDelivered: 0,
    infrastructureRestored: 0,
    environmentHectares: 0,
    healthConsultations: 0,
    regions: new Set(),
    organisations: new Set(),
    avgDurationDays: 0
  };

  let totalDays = 0;

  incidents.forEach((inc) => {
    totals.peopleHelped += inc.impacts.people?.total || 0;
    totals.resourcesDelivered += inc.impacts.resources?.total || 0;
    totals.infrastructureRestored += inc.impacts.infrastructure?.total || 0;
    totals.environmentHectares += inc.impacts.environment?.total || 0;
    totals.healthConsultations += inc.impacts.health?.total || 0;
    totals.regions.add(inc.region);
    inc.organisations.forEach((org) => totals.organisations.add(org));
    totalDays += inc.durationDays || 0;
  });

  totals.avgDurationDays = incidents.length
    ? Math.round((totalDays / incidents.length) * 10) / 10
    : 0;
  totals.regionsCount = totals.regions.size;
  totals.organisationsCount = totals.organisations.size;

  return totals;
};
