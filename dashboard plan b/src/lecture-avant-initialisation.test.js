import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseAst } from 'vite';
import { transformSync } from 'esbuild';

/**
 * Garde-fou contre la « zone morte temporelle » : lire une variable `const`
 * avant la ligne qui la declare.
 *
 * Ce defaut est invisible partout ailleurs. ESLint ne le signale pas — le nom
 * EST dans la portee, simplement pas encore initialise, donc no-undef passe.
 * Le build non plus : c'est une erreur d'execution. Et les regles de hooks ne
 * modelisent pas l'ordre d'initialisation.
 *
 * Il est apparu deux fois en sortant des blocs des gros composants : les
 * declarations partent dans un hook place plus bas, mais un effet reste en
 * haut. Son tableau de dependances, lui, est evalue PENDANT le rendu — et la
 * page entiere refuse alors de s'afficher, avec un message que rien dans
 * l'outillage n'annoncait.
 *
 * On ne descend volontairement pas dans le CORPS des fonctions imbriquees :
 * une fonction declaree tot peut parfaitement lire une constante definie plus
 * bas, puisqu'elle ne s'execute qu'apres. Ce qui compte, c'est ce qui est
 * evalue immediatement.
 */

const FONCTIONS = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

const fichiersSources = (racine, trouves = []) => {
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) fichiersSources(chemin, trouves);
    else if (/\.jsx?$/.test(entree) && !/\.test\.jsx?$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
};

const enfants = (noeud) => {
  const sortie = [];
  for (const cle of Object.keys(noeud)) {
    if (cle === 'type' || cle === 'start' || cle === 'end' || cle === 'loc') continue;
    const valeur = noeud[cle];
    if (Array.isArray(valeur)) {
      for (const x of valeur) if (x && x.type) sortie.push([cle, x]);
    } else if (valeur && valeur.type) sortie.push([cle, valeur]);
  }
  return sortie;
};

/** Noms introduits par un motif de declaration ou de destructuration. */
const nomsLies = (motif, dans) => {
  if (!motif) return;
  if (motif.type === 'Identifier') dans.push(motif.name);
  else if (motif.type === 'ObjectPattern') motif.properties.forEach((p) => nomsLies(p.value || p.argument, dans));
  else if (motif.type === 'ArrayPattern') motif.elements.forEach((e) => nomsLies(e, dans));
  else if (motif.type === 'AssignmentPattern') nomsLies(motif.left, dans);
  else if (motif.type === 'RestElement') nomsLies(motif.argument, dans);
};

/** Identifiants evalues immediatement, hors corps des fonctions imbriquees. */
const referencesImmediates = (noeud, sortie = []) => {
  if (!noeud || !noeud.type) return sortie;
  if (noeud.type === 'Identifier') {
    sortie.push(noeud);
    return sortie;
  }
  for (const [cle, enfant] of enfants(noeud)) {
    if (FONCTIONS.has(noeud.type) && (cle === 'body' || cle === 'params')) continue;
    if (noeud.type === 'MemberExpression' && cle === 'property' && !noeud.computed) continue;
    if (noeud.type === 'Property' && cle === 'key' && !noeud.computed) continue;
    referencesImmediates(enfant, sortie);
  }
  return sortie;
};

const analyser = (fichier, code, signaler) => {
  const numeroLigne = (position) => code.slice(0, position).split('\n').length;

  const analyserBloc = (instructions) => {
    const declarees = new Map();
    instructions.forEach((instruction, rang) => {
      if (instruction.type !== 'VariableDeclaration') return;
      if (instruction.kind !== 'const' && instruction.kind !== 'let') return;
      for (const d of instruction.declarations) {
        const noms = [];
        nomsLies(d.id, noms);
        for (const nom of noms) if (!declarees.has(nom)) declarees.set(nom, rang);
      }
    });

    instructions.forEach((instruction, rang) => {
      for (const reference of referencesImmediates(instruction)) {
        const rangDeclaration = declarees.get(reference.name);
        if (rangDeclaration !== undefined && rangDeclaration > rang) {
          signaler(`${fichier}:${numeroLigne(reference.start)} — « ${reference.name} » est lu avant sa déclaration`);
        }
      }
    });
  };

  const parcourir = (noeud) => {
    if (!noeud || !noeud.type) return;
    if (FONCTIONS.has(noeud.type) && noeud.body?.type === 'BlockStatement') {
      analyserBloc(noeud.body.body);
    }
    for (const [, enfant] of enfants(noeud)) parcourir(enfant);
  };

  parcourir(parseAst(code));
};

describe('ordre d’initialisation', () => {
  it('ne lit aucune constante avant sa déclaration', () => {
    const soucis = new Set();

    for (const fichier of fichiersSources('src')) {
      const source = readFileSync(fichier, 'utf8');
      // esbuild retire le JSX ; acorn, derriere parseAst, ne le comprend pas.
      const code = transformSync(source, { loader: 'jsx' }).code;
      analyser(fichier, code, (message) => soucis.add(message));
    }

    expect([...soucis]).toEqual([]);
  });
});
