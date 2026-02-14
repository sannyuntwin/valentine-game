'use client';

import React, { useState, createContext, useContext, ReactNode } from 'react';

interface AlertState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
}

interface AlertContextType {
  showAlert: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideAlert: () => void;
  alert: AlertState;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Global alert state
let globalAlertState: AlertState = {
  message: '',
  type: 'info',
  isVisible: false
};

let globalSetAlert: React.Dispatch<React.SetStateAction<AlertState>> | null = null;

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>(globalAlertState);
  
  // Update global state when local state changes
  React.useEffect(() => {
    globalAlertState = alert;
    globalSetAlert = setAlert;
  }, [alert]);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const newAlert = { message, type, isVisible: true };
    setAlert(newAlert);
    globalAlertState = newAlert;
    
    if (globalSetAlert && globalSetAlert !== setAlert) {
      globalSetAlert(newAlert);
    }

    setTimeout(() => {
      hideAlert();
    }, 3000);
  };

  const hideAlert = () => {
    const newAlert = { ...globalAlertState, isVisible: false };
    setAlert(newAlert);
    globalAlertState = newAlert;
    
    if (globalSetAlert && globalSetAlert !== setAlert) {
      globalSetAlert(newAlert);
    }
  };

  return { showAlert, hideAlert, alert };
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const { alert } = useAlert();
  return React.createElement(React.Fragment, null, children);
}
