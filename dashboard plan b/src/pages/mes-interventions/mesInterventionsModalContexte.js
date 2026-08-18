import { createContext, useContext } from 'react';

// Meme raison qu'ailleurs : le contexte et son hook sont sortis du fichier du
// Provider pour que le rafraichissement a chaud continue de fonctionner.
export const MesInterventionsModalContext = createContext();

export const useMesInterventionsModalContext = () => {
  const context = useContext(MesInterventionsModalContext);
  if (!context) {
    throw new Error('useMesInterventionsModalContext must be used within a MesInterventionsModalProvider');
  }
  return context;
};

export default MesInterventionsModalContext;
