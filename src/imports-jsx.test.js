import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Garde-fou contre une classe de panne qui echappe a tout le reste.
 *
 * Un composant utilise en JSX sans avoir ete importe ne provoque ni erreur de
 * lint, ni echec de build : eslint ne resout pas les references JSX, et le
 * bundler se contente d'emettre un identifiant libre. Cela n'echoue qu'a
 * l'execution, et seulement si l'on atteint la branche concernee.
 *
 * Ce cas s'est produit deux fois en sortant des composants d'un gros fichier :
 * une icone oubliee dans le module des badges, une autre dans le squelette de
 * chargement — celle-la ne cassait que l'ecran d'attente, que personne ne
 * regarde assez longtemps pour le signaler.
 *
 * Le controle est volontairement statique et grossier ; il ne remplace pas un
 * test de rendu, il attrape ce que le rendu ne visite jamais.
 */

const GLOBAUX = new Set([
  'React', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Date', 'Promise',
  'Set', 'Map', 'Boolean', 'FormData', 'WebSocket', 'Audio', 'URL', 'NaN', 'Infinity',
  'Intl', 'RegExp', 'Error', 'Blob', 'File', 'FileReader', 'Image', 'Event',
  'MediaRecorder', 'AbortController', 'Fragment',
]);

const fichiersSources = (racine) => {
  const trouves = [];
  for (const entree of readdirSync(racine)) {
    if (entree === 'node_modules') continue;
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiersSources(chemin));
    else if (/\.jsx?$/.test(entree) && !/\.test\.jsx?$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
};

const nomsDisponibles = (source) => {
  const noms = new Set();

  // importations nommees, par defaut, et espaces de noms
  for (const m of source.matchAll(/import\s+(?:(\w+)\s*,\s*)?(?:\{([^}]*)\})?\s*from/g)) {
    if (m[1]) noms.add(m[1]);
    if (m[2]) for (const x of m[2].split(',')) {
      const n = x.trim().split(' as ').pop().trim();
      if (n) noms.add(n);
    }
  }
  for (const m of source.matchAll(/import\s+(\w+)\s+from/g)) noms.add(m[1]);
  for (const m of source.matchAll(/import\s*\*\s*as\s+(\w+)/g)) noms.add(m[1]);

  // declarations locales
  for (const m of source.matchAll(/(?:const|let|var|function|class)\s+([A-Z][\w$]*)/g)) noms.add(m[1]);
  // destructurations, y compris les proprietes recues en parametre
  for (const m of source.matchAll(/\{([^{}]*)\}\s*(?:=|\)\s*=>)/g)) {
    for (const x of m[1].split(',')) {
      const n = x.trim().split(':').pop().split('=')[0].trim();
      if (/^[A-Z][\w$]*$/.test(n)) noms.add(n);
    }
  }

  return noms;
};

describe('références JSX', () => {
  it('n’utilise aucun composant qui ne soit ni importé ni déclaré', () => {
    const manquants = [];

    for (const fichier of fichiersSources('src')) {
      const source = readFileSync(fichier, 'utf8');
      const disponibles = nomsDisponibles(source);
      const utilises = new Set(
        [...source.matchAll(/<([A-Z][\w$.]*)/g)].map((m) => m[1].split('.')[0]),
      );
      for (const nom of utilises) {
        if (!disponibles.has(nom) && !GLOBAUX.has(nom)) {
          manquants.push(`${fichier} → <${nom}>`);
        }
      }
    }

    expect(manquants).toEqual([]);
  });
});
