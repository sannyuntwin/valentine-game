'use client';

import { useState } from 'react';

export function useSimpleAlert() {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>>([]);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    const newAlert = { id, message, type };
    
    setAlerts(prev => [...prev, newAlert]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 3000);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return { alerts, showAlert, removeAlert };
}
