import React, { createContext, useContext } from 'react';

interface WebDrawerContextType {
  toggleDrawer: () => void;
  isDrawerOpen: boolean;
}

export const WebDrawerContext = createContext<WebDrawerContextType | null>(null);

export const useWebDrawer = () => {
  const ctx = useContext(WebDrawerContext);
  return {
    toggleDrawer: ctx?.toggleDrawer,
    isDrawerOpen: ctx?.isDrawerOpen ?? false,
    hasProvider: !!ctx,
  };
};
