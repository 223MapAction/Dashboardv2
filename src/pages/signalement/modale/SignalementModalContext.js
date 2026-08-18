import { createContext, useContext } from 'react';

const SignalementModalContext = createContext();

export const useSignalementModalContext = () => {
  const context = useContext(SignalementModalContext);
  if (!context) {
    throw new Error('useSignalementModalContext must be used within an SignalementModalContext.Provider');
  }
  return context;
};

export default SignalementModalContext;
