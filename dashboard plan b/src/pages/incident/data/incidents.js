export const incidents = [
  {
    id: 'p1',
    title: 'Projet de nettoyage Commune IV',
    image: 'https://images.unsplash.com/photo-1519455953755-af066f52f1a6?w=400&h=250&fit=crop',
    badges: [
      { label: 'EN COURS', variant: 'in-progress' },
      { label: 'CRITIQUE', variant: 'critical' }
    ],
    description:
      "Opération d'urgence pour le nettoyage des berges du fleuve Niger suite aux récentes inondations affectant la commune.",
    fullDescription:
      "Suite aux inondations majeures qui ont frappé la Commune IV de Bamako, ce projet vise à coordonner une opération d'urgence pour nettoyer les berges du fleuve Niger. L'accumulation de déchets représente un risque sanitaire important pour les populations riveraines.\n\nNous avons besoin de bénévoles, de matériel de nettoyage et d'expertise environnementale pour mener cette mission à bien dans les meilleurs délais.",
    type: 'Environnement',
    location: 'Commune IV, Bamako',
    coordinates: { lng: -8.0029, lat: 12.6392 },
    video: 'https://www.youtube.com/embed/B-WMGHghFcE',
    startDate: '15 Mars 2025',
    endDate: '30 Avril 2025',
    participantsCount: 24,
    incidentStatus: 'analysis', // declared | analysis | taken | resolved
    aiAnalysis: {
      text: "Déployer une équipe d'assainissement en Zone B4 sous 24h. Risque élevé de transmission du paludisme et prévisions climatiques annonçant de fortes précipitations.",
      audio: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav'
    },
    objectives: [
      'Nettoyer 5 km de berges du fleuve',
      'Sensibiliser 200 familles riveraines',
      'Mettre en place un système de tri'
    ],
    participants: [
      { name: 'UNICEF', initials: 'UN', color: '#3AA2DD' },
      { name: 'Croix Rouge', initials: 'CR', color: '#EF4444' },
      { name: 'Mairie', initials: 'MA', color: '#22C55E' }
    ],
    extraParticipants: 2,
    activeOrgs: 3,
    messages: [
      {
        id: 1,
        author: 'Aïssata Diarra',
        role: 'UNICEF',
        roleColor: 'info',
        time: 'Il y a 12 min',
        text: 'Nous mobilisons 50 bénévoles supplémentaires pour ce week-end. Du matériel de protection sera distribué sur place.'
      },
      {
        id: 2,
        author: 'Moussa Traoré',
        role: 'Croix Rouge',
        roleColor: 'danger',
        time: 'Il y a 28 min',
        text: 'Une équipe médicale sera présente toute la journée samedi pour assurer les premiers soins.'
      },
      {
        id: 3,
        author: 'Mairie de Bamako',
        role: 'Mairie',
        roleColor: 'success',
        time: 'Il y a 1 h',
        text: 'Nous mettons à disposition 2 camions-bennes et un local de stockage temporaire dans la commune.'
      }
    ]
  },
  {
    id: 'p2',
    title: 'Reboisement Zone Périurbaine',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=250&fit=crop',
    badges: [{ label: 'PLANIFIÉ', variant: 'planned' }],
    description:
      "Initiative conjointe pour la plantation de 5000 arbres adaptés au climat aride afin de lutter contre l'avancée du désert.",
    fullDescription:
      "Face à la désertification croissante, ce projet ambitieux vise à reboiser les zones périurbaines de Bamako avec des essences locales résilientes. La sélection des espèces a été faite avec l'aide d'experts en agroforesterie.\n\nLe projet inclut la création de pépinières communautaires, la formation de gardiens forestiers et un suivi écologique sur 3 ans pour garantir la pérennité des plantations.",
    type: 'Reforestation',
    location: 'Périphérie de Bamako',
    coordinates: { lng: -7.9522, lat: 12.6500 },
    video: 'https://www.youtube.com/embed/iIw3-evLrPs',
    startDate: '1er Mai 2025',
    endDate: '31 Octobre 2025',
    participantsCount: 8,
    objectives: [
      'Planter 5 000 arbres',
      'Former 50 gardiens forestiers',
      'Créer 3 pépinières communautaires'
    ],
    participants: [
      { name: 'ONG Verte', initials: 'NGO', color: '#22C55E' }
    ],
    extraParticipants: 0,
    isOwner: true
  },
  {
    id: 'p3',
    title: 'Électrification Centre de Santé',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop',
    badges: [
      { label: 'EN COURS', variant: 'in-progress' },
      { label: 'BESOIN EXPERT', variant: 'expert-needed' }
    ],
    description:
      "Installation de panneaux solaires pour garantir l'autonomie énergétique d'un centre de santé rural.",
    fullDescription:
      "Le centre de santé de Kati dessert plus de 15 000 personnes mais souffre de coupures électriques fréquentes qui mettent en péril les soins d'urgence et la conservation des vaccins. Ce projet vise à installer un système solaire complet avec batteries de stockage.\n\nNous recherchons activement un expert en énergies renouvelables pour valider le dimensionnement technique et superviser l'installation.",
    type: 'Énergie',
    location: 'Kati, Région de Koulikoro',
    coordinates: { lng: -8.0708, lat: 12.7458 },
    video: 'https://www.youtube.com/embed/xKxrkht7CpY',
    startDate: '10 Avril 2025',
    endDate: '15 Juin 2025',
    participantsCount: 12,
    objectives: [
      'Installer 30 kWc de panneaux solaires',
      'Garantir 24h/24 d\'électricité',
      'Former 2 techniciens locaux'
    ],
    participants: [
      { name: 'Solidarité Énergie', initials: 'SE', color: '#F59E0B' },
      { name: 'Médecins du Monde', initials: 'MM', color: '#3AA2DD' }
    ],
    extraParticipants: 0
  },
  {
    id: 'p4',
    title: 'Forage Eau Potable Village',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=250&fit=crop',
    badges: [{ label: 'EN COURS', variant: 'in-progress' }],
    description:
      "Réalisation de 3 forages équipés de pompes manuelles pour desservir un village de 1200 habitants.",
    fullDescription:
      "Le village de Sanankoroba n'a pas accès à l'eau potable, obligeant les femmes et enfants à parcourir plus de 5 km par jour. Ce projet vise à creuser 3 forages stratégiquement placés et à installer des pompes manuelles fiables.",
    type: 'Eau & Assainissement',
    location: 'Sanankoroba',
    coordinates: { lng: -7.8833, lat: 12.4333 },
    video: 'https://www.youtube.com/embed/G3pz9F2vCSc',
    startDate: '20 Mars 2025',
    endDate: '20 Juillet 2025',
    participantsCount: 15,
    objectives: [
      'Creuser 3 forages opérationnels',
      'Former 6 gestionnaires locaux',
      'Garantir l\'eau potable à 1200 habitants'
    ],
    participants: [
      { name: 'Eau Vive', initials: 'EV', color: '#3AA2DD' }
    ],
    extraParticipants: 1,
    isOwner: true
  },
  {
    id: 'p5',
    title: 'École Mobile Zone Nomade',
    image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400&h=250&fit=crop',
    badges: [
      { label: 'PLANIFIÉ', variant: 'planned' },
      { label: 'BESOIN EXPERT', variant: 'expert-needed' }
    ],
    description:
      "Création d'une école itinérante adaptée aux populations nomades du Nord pour scolariser 200 enfants.",
    fullDescription:
      "Les populations nomades du Nord-Mali rencontrent d'énormes difficultés pour scolariser leurs enfants. Ce projet propose une école mobile équipée de matériel pédagogique adapté et de panneaux solaires pour fonctionner en autonomie.",
    type: 'Éducation',
    location: 'Région de Tombouctou',
    coordinates: { lng: -3.0094, lat: 16.7666 },
    video: 'https://www.youtube.com/embed/TJSPEsj3Fw0',
    startDate: '1er Septembre 2025',
    endDate: '30 Juin 2026',
    participantsCount: 6,
    objectives: [
      'Scolariser 200 enfants nomades',
      'Former 8 enseignants itinérants',
      'Équiper 2 écoles mobiles'
    ],
    participants: [
      { name: 'UNICEF', initials: 'UN', color: '#3AA2DD' }
    ],
    extraParticipants: 0
  },
  {
    id: 'p6',
    title: 'Cantine Scolaire Communautaire',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=250&fit=crop',
    badges: [{ label: 'EN COURS', variant: 'in-progress' }],
    description:
      "Mise en place de cantines scolaires alimentées par des jardins potagers gérés par les parents d'élèves.",
    fullDescription:
      "Pour lutter contre la malnutrition et l'absentéisme scolaire, ce projet crée des cantines auto-gérées avec jardins potagers attenants. Les parents s'impliquent dans la production et la préparation des repas.",
    type: 'Nutrition',
    location: 'Cercle de Ségou',
    coordinates: { lng: -6.2622, lat: 13.4317 },
    video: 'https://www.youtube.com/embed/qYzF6oWYIeI',
    startDate: '15 Janvier 2025',
    endDate: 'Permanent',
    participantsCount: 32,
    objectives: [
      'Nourrir 800 élèves quotidiennement',
      'Créer 4 jardins potagers',
      'Former 20 cuisinières'
    ],
    participants: [
      { name: 'PAM', initials: 'PAM', color: '#22C55E' },
      { name: 'Mairie', initials: 'MA', color: '#3AA2DD' }
    ],
    extraParticipants: 3,
    isOwner: true
  }
];
