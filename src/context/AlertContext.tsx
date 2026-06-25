import React, { createContext, useContext, useState, useCallback } from 'react';
import StyledAlert from '../components/StyledAlert';
import type { AlertButton } from '../components/StyledAlert';

interface ShowAlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertOptions, setAlertOptions] = useState<ShowAlertOptions | null>(null);

  const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertOptions({ title, message, buttons });
  }, []);

  const handleDismiss = useCallback(() => {
    setAlertOptions(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertOptions && (
        <StyledAlert
          visible
          title={alertOptions.title}
          message={alertOptions.message}
          buttons={alertOptions.buttons}
          onDismiss={handleDismiss}
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextType {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
}
