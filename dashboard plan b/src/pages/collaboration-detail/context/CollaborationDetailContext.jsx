import React, { createContext, useContext, useState, useMemo } from 'react';

const CollaborationDetailContext = createContext(null);

export const useCollaborationDetail = () => {
  const context = useContext(CollaborationDetailContext);
  if (!context) {
    throw new Error('useCollaborationDetail must be used within a CollaborationDetailProvider');
  }
  return context;
};

export const CollaborationDetailProvider = ({ children, value }) => {
  return (
    <CollaborationDetailContext.Provider value={value}>
      {children}
    </CollaborationDetailContext.Provider>
  );
};
