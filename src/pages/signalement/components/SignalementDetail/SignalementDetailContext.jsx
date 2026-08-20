import React, { createContext, useContext } from 'react';

export const SignalementDetailContext = createContext(null);

export const useIncidentDetail = () => {
  const context = useContext(SignalementDetailContext);
  if (!context) {
    throw new Error('useIncidentDetail must be used within an IncidentDetailProvider');
  }
  return context;
};
