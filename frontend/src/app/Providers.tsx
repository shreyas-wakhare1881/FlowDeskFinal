'use client';

import React from 'react';
import { ProjectsProvider } from '@/lib/ProjectsContext';
import { RbacProvider } from '@/lib/RbacContext';
import { SidebarProvider } from '@/lib/SidebarContext';
import { SearchProvider } from '@/lib/search/SearchContext';
import GlobalSearch from '@/components/search/GlobalSearch';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProjectsProvider>
      <RbacProvider>
        <SidebarProvider>
          <SearchProvider>
            {children}
            <GlobalSearch />
          </SearchProvider>
        </SidebarProvider>
      </RbacProvider>
    </ProjectsProvider>
  );
}
