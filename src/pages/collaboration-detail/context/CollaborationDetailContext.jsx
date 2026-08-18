import React from 'react';
import { CollaborationDetailContext } from './collaborationDetailContexte';

export const CollaborationDetailProvider = ({ children, value }) => {
  return (
    <CollaborationDetailContext.Provider value={value}>
      {children}
    </CollaborationDetailContext.Provider>
  );
};
