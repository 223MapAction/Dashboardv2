// Données fictives — incidents supprimés
export const trashedIncidents = [
  {
    id: 'tr1',
    title: 'Inondation Quartier Hippodrome',
    type: 'Catastrophe naturelle',
    location: 'Hippodrome, Bamako',
    description: 'Montée des eaux suite à des pluies torrentielles ayant causé des dégâts matériels importants dans le quartier résidentiel.',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=300&fit=crop',
    badgeLabel: 'DÉCLARÉ',
    badgeVariant: 'declared',
    deletedAt: '12 mai 2025',
    expiresIn: 18,
    participants: [
      { name: 'Protection Civile', initials: 'PC', color: '#3AA2DD' },
      { name: 'Croix Rouge', initials: 'CR', color: '#EF4444' }
    ],
    participantsCount: 14,
  },
  {
    id: 'tr2',
    title: 'Incendie Marché de Médine',
    type: 'Incendie',
    location: 'Médine, Bamako',
    description: 'Un incendie d\'origine électrique a ravagé une section du marché, détruisant une cinquantaine d\'étals et causant d\'importants préjudices économiques.',
    image: 'https://images.unsplash.com/photo-1587483166702-bf9aa66bd791?w=600&h=300&fit=crop',
    badgeLabel: 'RÉSOLU',
    badgeVariant: 'resolved',
    deletedAt: '8 mai 2025',
    expiresIn: 14,
    participants: [
      { name: 'Pompiers', initials: 'PM', color: '#F59E0B' }
    ],
    participantsCount: 8,
  },
  {
    id: 'tr3',
    title: 'Épidémie Diarrhéique Zone C',
    type: 'Santé publique',
    location: 'Commune III, Bamako',
    description: 'Flambée épidémique de maladies diarrhéiques liées à la contamination d\'un puits collectif desservant 400 familles.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=300&fit=crop',
    badgeLabel: 'PRIS EN COMPTE',
    badgeVariant: 'taken',
    deletedAt: '5 mai 2025',
    expiresIn: 11,
    participants: [
      { name: 'Médecins du Monde', initials: 'MM', color: '#3AA2DD' },
      { name: 'OMS', initials: 'OMS', color: '#22C55E' }
    ],
    participantsCount: 22,
  },
  {
    id: 'tr4',
    title: 'Effondrement Pont Rural Kati',
    type: 'Infrastructure',
    location: 'Kati, Région de Koulikoro',
    description: 'Un pont vétuste reliant deux villages a cédé, coupant l\'accès à l\'école et au centre de santé pour 600 habitants.',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=300&fit=crop',
    badgeLabel: 'EN COURS',
    badgeVariant: 'in-progress',
    deletedAt: '3 mai 2025',
    expiresIn: 9,
    participants: [
      { name: 'Mairie', initials: 'MA', color: '#22C55E' }
    ],
    participantsCount: 5,
  },
  {
    id: 'tr5',
    title: 'Sécheresse Cercle de Mopti',
    type: 'Catastrophe naturelle',
    location: 'Mopti',
    description: 'Une sécheresse prolongée menace les récoltes et les réserves d\'eau potable de plusieurs villages du cercle, affectant plus de 3 000 personnes.',
    image: 'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=600&h=300&fit=crop',
    badgeLabel: 'DÉCLARÉ',
    badgeVariant: 'declared',
    deletedAt: '1 mai 2025',
    expiresIn: 7,
    participants: [
      { name: 'PAM', initials: 'PAM', color: '#F59E0B' },
      { name: 'UNICEF', initials: 'UN', color: '#3AA2DD' }
    ],
    participantsCount: 18,
  },
  {
    id: 'tr6',
    title: 'Pollution Fleuve Niger Ségou',
    type: 'Environnement',
    location: 'Ségou',
    description: 'Rejet illégal de déchets industriels dans le fleuve Niger, entraînant la mort de poissons et une alerte sanitaire pour les populations riveraines.',
    image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=600&h=300&fit=crop',
    badgeLabel: 'EN COURS',
    badgeVariant: 'in-progress',
    deletedAt: '28 avr. 2025',
    expiresIn: 4,
    participants: [
      { name: 'Environnement Mali', initials: 'EM', color: '#22C55E' }
    ],
    participantsCount: 9,
  },
  {
    id: 'tr7',
    title: 'Glissement de Terrain Kangaba',
    type: 'Catastrophe naturelle',
    location: 'Kangaba, Région de Koulikoro',
    description: 'Un glissement de terrain dû aux pluies diluviennes a enseveli plusieurs habitations précaires, nécessitant une évacuation d\'urgence.',
    image: 'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?w=600&h=300&fit=crop',
    badgeLabel: 'RÉSOLU',
    badgeVariant: 'resolved',
    deletedAt: '25 avr. 2025',
    expiresIn: 1,
    participants: [
      { name: 'Protection Civile', initials: 'PC', color: '#3AA2DD' },
      { name: 'Croix Rouge', initials: 'CR', color: '#EF4444' },
      { name: 'Mairie', initials: 'MA', color: '#22C55E' }
    ],
    participantsCount: 31,
  },
  {
    id: 'tr8',
    title: 'Pénurie Médicaments Hôpital Gabriel Touré',
    type: 'Santé publique',
    location: 'Bamako Centre',
    description: 'Rupture critique de médicaments essentiels (antipaludéens, antibiotiques) à l\'hôpital Gabriel Touré, mettant en péril les soins de 200 patients.',
    image: 'https://images.unsplash.com/photo-1583912267550-d974936e8fa3?w=600&h=300&fit=crop',
    badgeLabel: 'PRIS EN COMPTE',
    badgeVariant: 'taken',
    deletedAt: '22 avr. 2025',
    expiresIn: 3,
    participants: [
      { name: 'OMS', initials: 'OMS', color: '#22C55E' },
      { name: 'Médecins du Monde', initials: 'MM', color: '#3AA2DD' }
    ],
    participantsCount: 12,
  },
];
