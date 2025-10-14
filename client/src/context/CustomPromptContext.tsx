import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type PromptPayload = { id: string; text: string };

type CustomPromptContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  prompt: PromptPayload | null;
  setPrompt: (p: PromptPayload | null) => void;
  submit: (p: string) => void; // convenience: sets prompt and opens dialog
};

const CustomPromptContext = createContext<CustomPromptContextValue | undefined>(undefined);

export const CustomPromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState<PromptPayload | null>(null);

  const submit = useCallback((p: string) => {
    if (!p || !p.trim()) return;
    const payload: PromptPayload = { id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2), text: p.trim() };
    setPrompt(payload);
    setOpen(true);
  }, []);

  const value = useMemo<CustomPromptContextValue>(() => ({ open, setOpen, prompt, setPrompt, submit }), [open, prompt, submit]);

  return (
    <CustomPromptContext.Provider value={value}>
      {children}
    </CustomPromptContext.Provider>
  );
};

export const useCustomPrompt = (): CustomPromptContextValue => {
  const ctx = useContext(CustomPromptContext);
  if (!ctx) throw new Error('useCustomPrompt must be used within CustomPromptProvider');
  return ctx;
};
