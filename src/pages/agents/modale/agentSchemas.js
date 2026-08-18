import * as yup from 'yup';

// ── Helpers de validation conditionnelle ──────────────────────────

// Création : mot de passe obligatoire (généré automatiquement mais requis)
// → terrain = 4 chiffres min, autres = 4 chars min
export const createAgentSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères.')
    .required('Le prénom est requis.'),

  lastName: yup
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .required('Le nom est requis.'),

  email: yup
    .string()
    .trim()
    .email('Adresse e-mail invalide.')
    .required("L'adresse e-mail est requise."),

  phone: yup
    .string()
    .trim()
    .matches(/^\d{8}$/, 'Le numéro de téléphone doit contenir exactement 8 chiffres.')
    .required("Le numéro de téléphone est requis."),

  address: yup.string().trim().optional(),

  password: yup
    .string()
    .when('role', {
      is: 'terrain',
      then: (schema) =>
        schema
          .matches(/^\d{4}$/, 'Le code terrain doit être exactement 4 chiffres.')
          .required('Le code est requis.'),
      otherwise: (schema) =>
        schema
          .min(6, 'Le mot de passe doit contenir au moins 6 caractères.')
          .required('Le mot de passe est requis.'),
    }),

  role: yup
    .string()
    .oneOf(['admin', 'bureau', 'terrain'], 'Veuillez sélectionner un rôle valide.')
    .required('Le rôle est requis.'),

  organisationId: yup.string().required("L'organisation est requise."),

  status: yup.string().oneOf(['active', 'inactive']).default('active'),

  avatarColor: yup.string().default('#3AA2DD'),
});

// Édition : tous les champs visibles, email non modifiable (désactivé côté UI)
export const editAgentSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères.')
    .required('Le prénom est requis.'),

  lastName: yup
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .required('Le nom est requis.'),

  email: yup.string().trim().email().optional(),   // désactivé en UI, on valide sans bloquer

  phone: yup
    .string()
    .trim()
    .matches(/^\d{8}$/, 'Le numéro de téléphone doit contenir exactement 8 chiffres.')
    .required("Le numéro de téléphone est requis."),

  address: yup.string().trim().optional(),

  role: yup
    .string()
    .oneOf(['admin', 'bureau', 'terrain'], 'Veuillez sélectionner un rôle valide.')
    .required('Le rôle est requis.'),

  organisationId: yup.string().required("L'organisation est requise."),

  status: yup.string().oneOf(['active', 'inactive']).default('active'),

  password: yup
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .when('role', {
      is: 'terrain',
      then: (schema) =>
        schema
          .matches(/^\d{4}$/, 'Le code terrain doit être exactement 4 chiffres.')
          .optional(),
      otherwise: (schema) =>
        schema
          .min(6, 'Le mot de passe doit contenir au moins 6 caractères.')
          .optional(),
    }),

  avatarColor: yup.string().default('#3AA2DD'),
});


// ── Générateurs de mot de passe ───────────────────────────────────

/**
 * Agent de terrain → PIN 4 chiffres aléatoires (ex: "3847")
 */
export const generateTerrainPin = () => {
  return String(Math.floor(Math.random() * 9000) + 1000);
};

/**
 * Autres rôles → 6 caractères camelCase alphanumérique
 * Format : première lettre minuscule, au moins 1 majuscule, au moins 1 chiffre
 * Exemple : "kArt2z", "bRx8Yq", "mPo5Nw"
 */
export const generateCamelCasePassword = () => {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';

  // Garantit la structure camelCase : [lower][upper][digit][any][any][any]
  const pool = lower + upper + digits;

  const pick = (src) => src[Math.floor(Math.random() * src.length)];

  let chars = [
    pick(lower),   // 1re lettre minuscule (camelCase)
    pick(upper),   // majuscule garantie
    pick(digits),  // chiffre garanti
    pick(pool),
    pick(pool),
    pick(pool),
  ];

  // Mélange les positions 1-5 (on garde la 1re lettre minuscule en index 0)
  for (let i = chars.length - 1; i > 1; i--) {
    const j = Math.floor(Math.random() * (i - 1)) + 1;
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};

/**
 * Génère le bon mot de passe selon le rôle
 */
export const generatePasswordForRole = (role) => {
  return role === 'terrain' ? generateTerrainPin() : generateCamelCasePassword();
};
