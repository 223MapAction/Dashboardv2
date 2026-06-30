export const collaborationRequests = [
  {
    id: 'r1',
    direction: 'sent',
    projectTitle: 'Reforestation des berges',
    projectImage:
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=180&fit=crop',
    organisation: 'WWF Mali',
    organisationInitials: 'WW',
    organisationColor: '#22C55E',
    role: 'Bénévole terrain',
    motif:
      "Je suis ingénieure environnementale avec 4 ans d'expérience en reforestation. Je peux contribuer à la sélection des essences et au suivi de la croissance des plants.",
    status: 'pending',
    submittedAt: '2025-04-22T10:15:00',
    respondedAt: null,
    response: null,
    suggestedOrganisations: [
      {
        name: 'Agence de l\'Environnement',
        initials: 'AE',
        color: '#10B981',
        reason: 'Expertise en gestion des zones humides et suivi écologique'
      },
      {
        name: 'Association des Pêcheurs',
        initials: 'AP',
        color: '#0EA5E9',
        reason: 'Connaissance locale des berges et impact sur la pêche'
      }
    ]
  },
  {
    id: 'r2',
    direction: 'sent',
    projectTitle: 'Distribution de moustiquaires',
    projectImage:
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=300&h=180&fit=crop',
    organisation: 'OMS',
    organisationInitials: 'OM',
    organisationColor: '#3AA2DD',
    role: 'Animateur communautaire',
    motif:
      'Originaire de la région ciblée, je connais bien les réalités locales et parle bambara, peulh et français.',
    status: 'accepted',
    submittedAt: '2025-04-10T08:30:00',
    respondedAt: '2025-04-12T14:20:00',
    response:
      'Bienvenue dans le programme ! Vous serez contacté(e) par le coordinateur régional sous 48h.'
  },
  {
    id: 'r3',
    direction: 'received',
    applicantName: 'Awa Touré',
    applicantOrg: 'Architectes Sans Frontières',
    projectTitle: 'Construction école primaire',
    projectImage:
      'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=300&h=180&fit=crop',
    organisation: 'UNICEF',
    organisationInitials: 'UN',
    organisationColor: '#0EA5E9',
    role: 'Architecte bénévole',
    motif:
      "Architecte DPLG, je propose mes services pour la conception des plans et le suivi de chantier sur 3 mois.",
    status: 'rejected',
    submittedAt: '2025-03-28T16:45:00',
    respondedAt: '2025-04-02T09:10:00',
    response:
      "Merci pour votre candidature. Le poste a été pourvu mais nous gardons votre profil pour de futures opportunités."
  },
  {
    id: 'r4',
    direction: 'received',
    applicantName: 'Ibrahima Sow',
    applicantOrg: 'Logistique Humanitaire Mali',
    projectTitle: 'Forage Eau Potable Sanankoroba',
    projectImage:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&h=180&fit=crop',
    organisation: 'Eau Vive',
    organisationInitials: 'EV',
    organisationColor: '#06B6D4',
    role: 'Coordinateur logistique',
    motif:
      'Expert en logistique humanitaire avec 6 ans en zone rurale, je peux organiser les approvisionnements et le transport du matériel.',
    status: 'accepted',
    submittedAt: '2025-03-18T11:00:00',
    respondedAt: '2025-03-20T17:30:00',
    response:
      "Profil parfait pour la mission. Réunion d'intégration prévue le 25 mars."
  },
  {
    id: 'r5',
    direction: 'sent',
    projectTitle: 'Sensibilisation paludisme',
    projectImage:
      'https://images.unsplash.com/photo-1584516150909-c43483ee7932?w=300&h=180&fit=crop',
    organisation: 'Croix-Rouge Malienne',
    organisationInitials: 'CR',
    organisationColor: '#EF4444',
    role: 'Formateur santé',
    motif:
      'Infirmier diplômé, je souhaite former les relais communautaires aux gestes de prévention et au repérage des symptômes.',
    status: 'pending',
    submittedAt: '2025-04-23T09:00:00',
    respondedAt: null,
    response: null,
    suggestedOrganisations: [
      {
        name: 'Ministère de la Santé',
        initials: 'MS',
        color: '#8B5CF6',
        reason: 'Coordination nationale et fourniture de supports pédagogiques'
      }
    ]
  },
  {
    id: 'r6',
    direction: 'received',
    applicantName: 'Salif Keïta',
    applicantOrg: 'Action Logistique Sahel',
    projectTitle: 'Assistance déplacés Mopti',
    projectImage:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=180&fit=crop',
    organisation: 'PAM',
    organisationInitials: 'PA',
    organisationColor: '#F59E0B',
    role: 'Logisticien terrain',
    motif:
      "Disponible pour 2 mois, je peux gérer la chaîne d'approvisionnement et les distributions sur site.",
    status: 'rejected',
    submittedAt: '2025-02-15T13:20:00',
    respondedAt: '2025-02-18T10:00:00',
    response:
      'Mission complète au moment de votre demande. Restez à l\'affût des prochains appels.'
  },
  {
    id: 's1',
    type: 'suggestion',
    direction: 'received',
    projectTitle: 'Projet de nettoyage Commune IV',
    projectImage:
      'https://images.unsplash.com/photo-1519455953755-af066f52f1a6?w=300&h=180&fit=crop',
    // Organisation leader qui fait la suggestion
    organisation: 'UNICEF',
    organisationInitials: 'UN',
    organisationColor: '#1E40AF',
    suggestedBy: 'Aïssata Diarra',
    suggestedByRole: 'Leader UNICEF',
    suggestionMessage:
      "Pour maximiser l'impact de ce nettoyage, je vous suggère d'inviter ces organisations qui ont l'expertise et les ressources nécessaires.",
    // Liste d'organisations proposées
    proposedCollaborators: [
      {
        name: 'Croix-Rouge Malienne',
        initials: 'CR',
        color: '#EF4444',
        role: 'contributeur',
        comment:
          'Équipe médicale de premiers soins disponible pour les bénévoles sur le terrain.'
      },
      {
        name: 'Mairie de Bamako',
        initials: 'MB',
        color: '#22C55E',
        role: 'contributeur',
        comment:
          'Mise à disposition de camions-bennes et de personnel de voirie.'
      },
      {
        name: 'Association des Pêcheurs',
        initials: 'AP',
        color: '#0EA5E9',
        role: 'observateur',
        comment:
          'Connaissance locale des berges et impact direct du projet sur leur activité.'
      }
    ],
    status: 'pending',
    submittedAt: '2025-04-25T14:30:00',
    respondedAt: null,
    response: null
  },
  {
    id: 's2',
    type: 'suggestion',
    direction: 'received',
    projectTitle: 'Forage Eau Potable Sanankoroba',
    projectImage:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&h=180&fit=crop',
    organisation: 'Eau Vive',
    organisationInitials: 'EV',
    organisationColor: '#06B6D4',
    suggestedBy: 'Mamadou Coulibaly',
    suggestedByRole: 'Leader Eau Vive',
    suggestionMessage:
      "Pour assurer la pérennité du projet, je propose d'inviter ces deux acteurs clés.",
    proposedCollaborators: [
      {
        name: 'Ministère de l\'Hydraulique',
        initials: 'MH',
        color: '#8B5CF6',
        role: 'leader',
        comment:
          'Validation technique et pérennisation du forage à long terme.'
      },
      {
        name: 'OXFAM',
        initials: 'OX',
        color: '#10B981',
        role: 'contributeur',
        comment:
          'Financement complémentaire et formation des comités de gestion.'
      }
    ],
    status: 'pending',
    submittedAt: '2025-04-24T09:15:00',
    respondedAt: null,
    response: null
  },
  {
    id: 's3',
    type: 'suggestion',
    direction: 'sent',
    projectTitle: 'Distribution alimentaire Mopti',
    projectImage:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=180&fit=crop',
    organisation: 'PAM',
    organisationInitials: 'PA',
    organisationColor: '#F59E0B',
    suggestedBy: 'Fatou Diallo',
    suggestedByRole: 'Leader PAM',
    suggestionMessage:
      'Suggestion de collaborateurs pour optimiser la logistique de distribution.',
    proposedCollaborators: [
      {
        name: 'Save the Children',
        initials: 'SC',
        color: '#F97316',
        role: 'contributeur',
        comment: 'Volet enfance et nutrition infantile.'
      }
    ],
    status: 'accepted',
    submittedAt: '2025-04-15T11:00:00',
    respondedAt: '2025-04-16T08:30:00',
    response: 'Excellente suggestion, invitations envoyées.'
  },
  {
    id: 'r7',
    direction: 'sent',
    projectTitle: 'Cantine scolaire Kayes',
    projectImage:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=180&fit=crop',
    organisation: 'Action Contre la Faim',
    organisationInitials: 'AF',
    organisationColor: '#DC2626',
    role: 'Nutritionniste',
    motif:
      "Diététicienne avec expérience en programmes scolaires, je peux concevoir des menus équilibrés adaptés au contexte local.",
    status: 'pending',
    submittedAt: '2025-04-24T08:00:00',
    respondedAt: null,
    response: null
  },
  {
    id: 'r8',
    direction: 'sent',
    projectTitle: 'Centre santé maternelle Ségou',
    projectImage:
      'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300&h=180&fit=crop',
    organisation: 'Médecins du Monde',
    organisationInitials: 'MM',
    organisationColor: '#0891B2',
    role: 'Sage-femme',
    motif:
      "Sage-femme diplômée d'État, 8 ans d'expérience dans les zones rurales. Disponible pour 6 mois.",
    status: 'accepted',
    submittedAt: '2025-04-08T10:30:00',
    respondedAt: '2025-04-11T15:00:00',
    response:
      'Profil très recherché. Bienvenue ! Démarrage prévu début mai.'
  },
  {
    id: 's4',
    type: 'suggestion',
    direction: 'sent',
    projectTitle: 'Reforestation des berges',
    projectImage:
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=180&fit=crop',
    organisation: 'WWF Mali',
    organisationInitials: 'WW',
    organisationColor: '#22C55E',
    suggestedBy: 'Vous',
    suggestedByRole: 'Leader',
    suggestionMessage:
      "Je propose ces partenaires pour renforcer le volet écologique et l'ancrage communautaire.",
    proposedCollaborators: [
      {
        name: 'GIZ Mali',
        initials: 'GZ',
        color: '#10B981',
        role: 'contributeur',
        comment: 'Financement et expertise reforestation tropicale.'
      },
      {
        name: 'Mairie de Ségou',
        initials: 'MS',
        color: '#3AA2DD',
        role: 'observateur',
        comment: 'Coordination locale et mobilisation des riverains.'
      }
    ],
    status: 'pending',
    submittedAt: '2025-04-23T16:00:00',
    respondedAt: null,
    response: null
  },
  {
    id: 's5',
    type: 'suggestion',
    direction: 'sent',
    projectTitle: 'Sensibilisation paludisme',
    projectImage:
      'https://images.unsplash.com/photo-1584516150909-c43483ee7932?w=300&h=180&fit=crop',
    organisation: 'Croix-Rouge Malienne',
    organisationInitials: 'CR',
    organisationColor: '#EF4444',
    suggestedBy: 'Vous',
    suggestedByRole: 'Leader',
    suggestionMessage:
      "Pour amplifier la portée, ces deux organisations apportent un complément clé.",
    proposedCollaborators: [
      {
        name: 'OMS',
        initials: 'OM',
        color: '#3AA2DD',
        role: 'leader',
        comment: 'Coordination technique et fourniture des supports OMS.'
      },
      {
        name: 'Plan International',
        initials: 'PI',
        color: '#8B5CF6',
        role: 'contributeur',
        comment: 'Mobilisation communautaire et formation des jeunes relais.'
      }
    ],
    status: 'rejected',
    submittedAt: '2025-03-30T09:00:00',
    respondedAt: '2025-04-02T11:20:00',
    response: 'Merci, mais notre programme privilégie déjà ces partenaires.'
  },
  {
    id: 'r9',
    direction: 'sent',
    projectTitle: 'Alphabétisation femmes Tombouctou',
    projectImage:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=180&fit=crop',
    organisation: 'UNESCO',
    organisationInitials: 'UE',
    organisationColor: '#1E40AF',
    role: 'Formatrice',
    motif:
      "Enseignante avec 7 ans d'expérience en alphabétisation pour adultes, parlant songhaï et tamasheq.",
    status: 'pending',
    submittedAt: '2025-04-25T09:45:00',
    respondedAt: null,
    response: null
  },
  {
    id: 'r10',
    direction: 'sent',
    projectTitle: 'Énergie solaire villages Sikasso',
    projectImage:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=300&h=180&fit=crop',
    organisation: 'GIZ Mali',
    organisationInitials: 'GZ',
    organisationColor: '#10B981',
    role: 'Technicien solaire',
    motif:
      "Technicien certifié photovoltaïque, je peux superviser l'installation et former les techniciens locaux à la maintenance.",
    status: 'pending',
    submittedAt: '2025-04-21T14:00:00',
    respondedAt: null,
    response: null
  },
  {
    id: 'r11',
    direction: 'sent',
    projectTitle: 'Programme nutrition infantile',
    projectImage:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=180&fit=crop',
    organisation: 'Save the Children',
    organisationInitials: 'SC',
    organisationColor: '#F97316',
    role: 'Coordinatrice nutrition',
    motif:
      "Nutritionniste avec spécialisation pédiatrique, je peux piloter le suivi anthropométrique et la prise en charge des cas de malnutrition aiguë.",
    status: 'rejected',
    submittedAt: '2025-03-12T08:00:00',
    respondedAt: '2025-03-18T16:30:00',
    response:
      "Profil intéressant mais la mission requiert 2 ans d'expérience humanitaire minimum."
  },
  {
    id: 'r12',
    direction: 'sent',
    projectTitle: 'Reconstruction post-inondations',
    projectImage:
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=300&h=180&fit=crop',
    organisation: 'OXFAM',
    organisationInitials: 'OX',
    organisationColor: '#10B981',
    role: 'Ingénieur génie civil',
    motif:
      "Ingénieur BTP avec expertise en zones inondables, je propose un appui technique pour la reconstruction d'habitats résilients.",
    status: 'accepted',
    submittedAt: '2025-04-02T11:00:00',
    respondedAt: '2025-04-05T09:15:00',
    response:
      'Excellent profil. Réunion de cadrage prévue le 12 avril à Bamako.'
  },
  {
    id: 's6',
    type: 'suggestion',
    direction: 'sent',
    projectTitle: 'Construction école primaire',
    projectImage:
      'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=300&h=180&fit=crop',
    organisation: 'UNICEF',
    organisationInitials: 'UN',
    organisationColor: '#0EA5E9',
    suggestedBy: 'Vous',
    suggestedByRole: 'Leader',
    suggestionMessage:
      "Pour garantir la qualité du chantier et l'ancrage local, je propose ces deux acteurs complémentaires.",
    proposedCollaborators: [
      {
        name: 'Architectes Sans Frontières',
        initials: 'AS',
        color: '#3AA2DD',
        role: 'contributeur',
        comment: 'Conception architecturale adaptée et suivi de chantier.'
      },
      {
        name: 'Mairie de Bamako',
        initials: 'MB',
        color: '#22C55E',
        role: 'observateur',
        comment: 'Validation administrative et mise à disposition du terrain.'
      }
    ],
    status: 'pending',
    submittedAt: '2025-04-22T10:00:00',
    respondedAt: null,
    response: null
  },
  {
    id: 's7',
    type: 'suggestion',
    direction: 'sent',
    projectTitle: 'Forage Eau Potable Sanankoroba',
    projectImage:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&h=180&fit=crop',
    organisation: 'Eau Vive',
    organisationInitials: 'EV',
    organisationColor: '#06B6D4',
    suggestedBy: 'Vous',
    suggestedByRole: 'Leader',
    suggestionMessage:
      "Je recommande d'associer ces partenaires pour sécuriser le financement et la maintenance long terme.",
    proposedCollaborators: [
      {
        name: 'AFD',
        initials: 'AF',
        color: '#1E40AF',
        role: 'contributeur',
        comment: 'Cofinancement et suivi technique sur 3 ans.'
      }
    ],
    status: 'accepted',
    submittedAt: '2025-04-10T15:30:00',
    respondedAt: '2025-04-12T09:00:00',
    response: 'Suggestion validée, invitation envoyée à l\'AFD.'
  },
  {
    id: 's8',
    type: 'suggestion',
    direction: 'sent',
    projectTitle: 'Cantine scolaire Kayes',
    projectImage:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=180&fit=crop',
    organisation: 'Action Contre la Faim',
    organisationInitials: 'AF',
    organisationColor: '#DC2626',
    suggestedBy: 'Vous',
    suggestedByRole: 'Leader',
    suggestionMessage:
      "Pour assurer un approvisionnement local et durable, ces deux organisations sont essentielles.",
    proposedCollaborators: [
      {
        name: 'Coopérative Agricole de Kita',
        initials: 'CK',
        color: '#22C55E',
        role: 'contributeur',
        comment: 'Fourniture de céréales locales à prix coûtant.'
      },
      {
        name: 'PAM',
        initials: 'PA',
        color: '#F59E0B',
        role: 'leader',
        comment: 'Coordination logistique et complément alimentaire.'
      },
      {
        name: 'Direction Régionale de l\'Éducation',
        initials: 'DR',
        color: '#8B5CF6',
        role: 'observateur',
        comment: 'Suivi institutionnel et identification des écoles cibles.'
      }
    ],
    status: 'pending',
    submittedAt: '2025-04-26T08:30:00',
    respondedAt: null,
    response: null
  }
];
