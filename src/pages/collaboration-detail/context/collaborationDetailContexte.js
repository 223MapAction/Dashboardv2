import { createContext, useContext } from 'react';

// Le contexte et son hook vivent hors du fichier du Provider : un module qui
// exporte a la fois un composant et autre chose casse le rafraichissement a
// chaud de Vite, qui remonte alors tout l'arbre a chaque sauvegarde.
export const CollaborationDetailContext = createContext(null);

export const useCollaborationDetail = () => {
  const context = useContext(CollaborationDetailContext);
  if (!context) {
    throw new Error('useCollaborationDetail must be used within a CollaborationDetailProvider');
  }
  return context;
};
