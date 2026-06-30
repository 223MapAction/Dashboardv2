import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_OPEN = 'mapaction_sidebar_open';
const STORAGE_KEY_COLLAPSED = 'mapaction_sidebar_collapsed';

function getStoredBoolean(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredBoolean(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/**
 * Hook qui synchronise l'état de la sidebar via localStorage.
 * Permet que l'état (ouverte/fermée, collapsed) soit partagé entre toutes les pages.
 */
export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(() =>
    getStoredBoolean(STORAGE_KEY_OPEN, false)
  );
  const [isCollapsed, setIsCollapsed] = useState(() =>
    getStoredBoolean(STORAGE_KEY_COLLAPSED, false)
  );

  // Écoute les changements depuis d'autres onglets/pages
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY_OPEN) {
        setIsOpen(getStoredBoolean(STORAGE_KEY_OPEN, false));
      }
      if (e.key === STORAGE_KEY_COLLAPSED) {
        setIsCollapsed(getStoredBoolean(STORAGE_KEY_COLLAPSED, false));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      setStoredBoolean(STORAGE_KEY_OPEN, next);
      return next;
    });
  }, []);

  const setOpen = useCallback((value) => {
    setStoredBoolean(STORAGE_KEY_OPEN, value);
    setIsOpen(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      setStoredBoolean(STORAGE_KEY_COLLAPSED, next);
      return next;
    });
  }, []);

  const setCollapsed = useCallback((value) => {
    setStoredBoolean(STORAGE_KEY_COLLAPSED, value);
    setIsCollapsed(value);
  }, []);

  return {
    isOpen,
    isCollapsed,
    toggleOpen,
    setOpen,
    toggleCollapsed,
    setCollapsed,
  };
}
