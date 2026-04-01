'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { IssueType } from '@/types/issue';

interface IssueModalContextValue {
  isOpen: boolean;
  defaultType: IssueType;
  openCreateIssue: (type?: IssueType) => void;
  closeModal: () => void;
}

const IssueModalContext = createContext<IssueModalContextValue | null>(null);

export function IssueModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<IssueType>('TASK');

  const openCreateIssue = useCallback((type: IssueType = 'TASK') => {
    setDefaultType(type);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <IssueModalContext.Provider value={{ isOpen, defaultType, openCreateIssue, closeModal }}>
      {children}
    </IssueModalContext.Provider>
  );
}

export function useIssueModal(): IssueModalContextValue {
  const ctx = useContext(IssueModalContext);
  if (!ctx) {
    throw new Error('useIssueModal must be used inside <IssueModalProvider>');
  }
  return ctx;
}
