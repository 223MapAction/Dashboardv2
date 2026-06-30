import React, { createContext, useContext, useState } from 'react';

const MesInterventionsModalContext = createContext();

export const MesInterventionsModalProvider = ({ children }) => {
  const [assignModal, setAssignModal] = useState({ open: false, incident: null });
  const [assignClosing, setAssignClosing] = useState(false);
  const [agentsModal, setAgentsModal] = useState({ open: false, incident: null });
  const [agentsClosing, setAgentsClosing] = useState(false);
  const [reportsModal, setReportsModal] = useState({ open: false, incident: null, reports: [] });
  const [reportsClosing, setReportsClosing] = useState(false);

  // States required for the assignment form and feedback
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignAlert, setAssignAlert] = useState({ type: null, message: null });
  const [mutateIncidents, setMutateIncidents] = useState(null);

  const openAssignModal = (incident) => {
    setAssignModal({ open: true, incident });
    setAssignAlert({ type: null, message: null });
    setAssignClosing(false);
  };

  const closeAssignModal = () => {
    setAssignClosing(true);
    setTimeout(() => {
      setAssignModal({ open: false, incident: null });
      setAssignAlert({ type: null, message: null });
      setAssignClosing(false);
    }, 280);
  };

  const openAgentsModal = (incident) => {
    setAgentsModal({ open: true, incident });
    setAgentsClosing(false);
  };

  const closeAgentsModal = () => {
    setAgentsClosing(true);
    setTimeout(() => {
      setAgentsModal({ open: false, incident: null });
      setAgentsClosing(false);
    }, 280);
  };

  const openReportsModal = (incident, reports) => {
    setReportsModal({ open: true, incident, reports });
    setReportsClosing(false);
  };

  const closeReportsModal = () => {
    setReportsClosing(true);
    setTimeout(() => {
      setReportsModal({ open: false, incident: null, reports: [] });
      setReportsClosing(false);
    }, 280);
  };

  return (
    <MesInterventionsModalContext.Provider
      value={{
        assignModal,
        setAssignModal,
        assignClosing,
        openAssignModal,
        closeAssignModal,
        agentsModal,
        setAgentsModal,
        agentsClosing,
        openAgentsModal,
        closeAgentsModal,
        reportsModal,
        setReportsModal,
        reportsClosing,
        openReportsModal,
        closeReportsModal,
        isAssigning,
        setIsAssigning,
        assignAlert,
        setAssignAlert,
        mutateIncidents,
        setMutateIncidents
      }}
    >
      {children}
    </MesInterventionsModalContext.Provider>
  );
};

export const useMesInterventionsModalContext = () => {
  const context = useContext(MesInterventionsModalContext);
  if (!context) {
    throw new Error('useMesInterventionsModalContext must be used within a MesInterventionsModalProvider');
  }
  return context;
};

export default MesInterventionsModalContext;
