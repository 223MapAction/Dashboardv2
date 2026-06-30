export const collaborations = [
  {
    id: 'c1',
    userRole: 'leader',
    title: 'Projet de nettoyage Commune IV',
    image:
      'https://images.unsplash.com/photo-1519455953755-af066f52f1a6?w=400&h=250&fit=crop',
    organisation: 'UNICEF',
    role: 'Bénévole environnement',
    status: 'in-progress',
    joinedAt: '20 Mars 2025',
    startDate: '15 Mars 2025',
    endDate: '30 Avril 2025',
    startAt: '2025-03-15',
    endAt: '2025-04-30',
    location: 'Commune IV, Bamako',
    description:
      "Opération d'urgence pour le nettoyage des berges du fleuve Niger.",
    progress: 65,
    tasks: [
      {
        id: 't1',
        title: 'Mobilisation des bénévoles',
        completed: true,
        createdBy: 'me',
        createdAt: '2025-03-15',
        completedAt: '2025-03-18',
        proof: {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=300&h=200&fit=crop'
        }
      },
      {
        id: 't2',
        title: 'Collecte des déchets zone A',
        completed: true,
        createdBy: 'UNICEF',
        createdAt: '2025-03-16',
        completedAt: '2025-03-22',
        proof: {
          type: 'video',
          url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        }
      },
      {
        id: 't3',
        title: 'Sensibilisation communautaire',
        completed: true,
        createdBy: 'me',
        createdAt: '2025-03-20',
        completedAt: '2025-04-05',
        proof: null
      },
      {
        id: 't4',
        title: 'Collecte des déchets zone B',
        completed: false,
        failed: true,
        createdBy: 'WWF Mali',
        createdAt: '2025-03-25',
        completedAt: null,
        failedAt: '2025-04-15',
        failureReason: 'Accès à la zone bloqué en raison des pluies torrentielles',
        proof: null
      },
      {
        id: 't5',
        title: 'Rapport final et bilan',
        completed: false,
        createdBy: 'UNICEF',
        createdAt: '2025-04-01',
        completedAt: null,
        proof: null
      }
    ]
  },
  {
    id: 'c2',
    userRole: 'contributeur',
    title: 'Forage Eau Potable Village',
    image:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=250&fit=crop',
    organisation: 'Eau Vive',
    role: 'Coordinateur logistique',
    status: 'in-progress',
    joinedAt: '22 Mars 2025',
    startDate: '20 Mars 2025',
    endDate: '20 Juillet 2025',
    startAt: '2025-03-20',
    endAt: '2025-07-20',
    location: 'Sanankoroba',
    description:
      'Réalisation de 3 forages équipés de pompes manuelles pour 1200 habitants.',
    progress: 40,
    tasks: [
      {
        id: 't6',
        title: 'Étude géologique du terrain',
        completed: true,
        createdBy: 'Eau Vive',
        createdAt: '2025-03-20',
        completedAt: '2025-03-28',
        proof: null
      },
      {
        id: 't7',
        title: 'Forage puits n°1',
        completed: true,
        createdBy: 'me',
        createdAt: '2025-04-01',
        completedAt: '2025-04-10',
        proof: {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&h=200&fit=crop'
        }
      },
      {
        id: 't8',
        title: 'Installation pompe manuelle n°1',
        completed: false,
        failed: true,
        createdBy: 'Eau Vive',
        createdAt: '2025-04-12',
        completedAt: null,
        failedAt: '2025-04-20',
        failureReason: 'Pompe défectueuse, en attente de remplacement',
        proof: null
      },
      {
        id: 't9',
        title: 'Forage puits n°2',
        completed: false,
        createdBy: 'me',
        createdAt: '2025-04-15',
        completedAt: null,
        proof: null
      },
      {
        id: 't10',
        title: 'Formation comité de gestion',
        completed: false,
        createdBy: 'Eau Vive',
        createdAt: '2025-05-01',
        completedAt: null,
        proof: null
      }
    ]
  },
  {
    id: 'c3',
    userRole: 'leader',
    title: 'Distribution alimentaire Mopti',
    image:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=250&fit=crop',
    organisation: 'PAM',
    role: 'Logisticien terrain',
    status: 'completed',
    joinedAt: '5 Janvier 2025',
    startDate: '10 Janvier 2025',
    endDate: '28 Février 2025',
    startAt: '2025-01-10',
    endAt: '2025-02-28',
    location: 'Mopti',
    description:
      'Distribution de vivres à 5000 familles déplacées suite aux inondations.',
    progress: 100
  },
  {
    id: 'c4',
    userRole: 'observateur',
    title: 'Campagne de vaccination polio',
    image:
      'https://images.unsplash.com/photo-1584516150909-c43483ee7932?w=400&h=250&fit=crop',
    organisation: 'OMS',
    role: 'Animateur communautaire',
    status: 'completed',
    joinedAt: '12 Octobre 2024',
    startDate: '15 Octobre 2024',
    endDate: '15 Décembre 2024',
    startAt: '2024-10-15',
    endAt: '2024-12-15',
    location: 'Région de Sikasso',
    description:
      'Sensibilisation et vaccination de 12 000 enfants contre la polio.',
    progress: 100
  },
  {
    id: 'c5',
    userRole: 'contributeur',
    title: 'Électrification Centre de Santé',
    image:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop',
    organisation: 'Solidarité Énergie',
    role: 'Expert solaire',
    status: 'in-progress',
    joinedAt: '12 Avril 2025',
    startDate: '10 Avril 2025',
    endDate: '15 Juin 2025',
    startAt: '2025-04-10',
    endAt: '2025-06-15',
    location: 'Kati, Région de Koulikoro',
    description:
      "Installation de panneaux solaires pour l'autonomie d'un centre de santé.",
    progress: 25
  },
  {
    id: 'c6',
    userRole: 'leader',
    title: 'École mobile zone nomade',
    image:
      'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400&h=250&fit=crop',
    organisation: 'UNICEF',
    role: 'Formateur enseignant',
    status: 'completed',
    joinedAt: '5 Septembre 2023',
    startDate: '10 Septembre 2023',
    endDate: '30 Juin 2024',
    startAt: '2023-09-10',
    endAt: '2024-06-30',
    location: 'Région de Tombouctou',
    description:
      'Scolarisation de 200 enfants nomades via une école itinérante.',
    progress: 100
  }
];
