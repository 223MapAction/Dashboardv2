import React, { createContext, useContext } from 'react';

export const IncidentDetailContext = createContext(null);

export const useIncidentDetail = () => {
  const context = useContext(IncidentDetailContext);
  if (!context) {
    throw new Error('useIncidentDetail must be used within an IncidentDetailProvider');
  }
  return context;
};
