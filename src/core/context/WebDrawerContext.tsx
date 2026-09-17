import React, { createContext, useContext } from 'react';

interface WebDrawerContextType {
  toggleDrawer: () => void;
  isDrawerOpen: boolean;
}

export const WebDrawerContext = createContext<WebDrawerContextType>({
  toggleDrawer: () => {},
  isDrawerOpen: false,
});

export const useWebDrawer = () => useContext(WebDrawerContext);
