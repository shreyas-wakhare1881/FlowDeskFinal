'use client';

import { ProjectsProvider } from '@/lib/ProjectsContext';
import { SearchProvider } from '@/lib/search/SearchContext';
import GlobalSearch from '@/components/search/GlobalSearch';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProjectsProvider>
      <SearchProvider>
        {children}
        <GlobalSearch />
      </SearchProvider>
    </ProjectsProvider>
  );
}
