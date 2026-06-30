import React, { createContext, useContext } from 'react';

const OrganisationsContext = createContext();

export const useOrganisationsContext = () => {
  const context = useContext(OrganisationsContext);
  if (!context) {
    throw new Error('useOrganisationsContext must be used within an OrganisationsProvider');
  }
  return context;
};

export default OrganisationsContext;
