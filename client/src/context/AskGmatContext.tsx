import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AskGmatContextValue = {
  open: boolean;
  openDialog: () => void;
  closeDialog: () => void;
};

const AskGmatContext = createContext<AskGmatContextValue | undefined>(undefined);

export const AskGmatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);

  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);

  const value = useMemo<AskGmatContextValue>(() => ({ open, openDialog, closeDialog }), [open, openDialog, closeDialog]);

  return (
    <AskGmatContext.Provider value={value}>
      {children}
    </AskGmatContext.Provider>
  );
};

export const useAskGmatDialog = (): AskGmatContextValue => {
  const ctx = useContext(AskGmatContext);
  if (!ctx) throw new Error('useAskGmatDialog must be used within AskGmatProvider');
  return ctx;
};
