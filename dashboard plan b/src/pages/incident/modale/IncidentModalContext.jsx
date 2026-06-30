import { createContext, useContext } from 'react';

const IncidentModalContext = createContext();

export const useIncidentModalContext = () => {
  const context = useContext(IncidentModalContext);
  if (!context) {
    throw new Error('useIncidentModalContext must be used within an IncidentModalContext.Provider');
  }
  return context;
};

export default IncidentModalContext;
