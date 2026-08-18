import React, { createContext, useContext } from 'react';

export const SignalementDetailContext = createContext(null);

export const useSignalementDetail = () => {
  const context = useContext(SignalementDetailContext);
  if (!context) {
    throw new Error('useSignalementDetail must be used within an SignalementDetailProvider');
  }
  return context;
};
