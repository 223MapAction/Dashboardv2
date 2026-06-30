import { createContext, useContext } from 'react';

const AgentsContext = createContext();

export const useAgentsContext = () => {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error('useAgentsContext must be used within an AgentsContext.Provider');
  }
  return context;
};

export default AgentsContext;
