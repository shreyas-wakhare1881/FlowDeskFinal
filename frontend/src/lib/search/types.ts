/**
 * Search System Types
 * Types for global search functionality
 */

export type SearchCategory = 'project' | 'team' | 'task' | 'person';

export interface SearchResultBase {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  icon?: string;
  url: string;
  metadata?: Record<string, any>;
}

export interface ProjectSearchResult extends SearchResultBase {
  category: 'project';
  status: string;
  priority: string;
  progress: number;
  team?: string;
  dueDate?: string;
}

export interface TeamSearchResult extends SearchResultBase {
  category: 'team';
  memberCount: number;
  projectCount?: number;
}

export interface TaskSearchResult extends SearchResultBase {
  category: 'task';
  projectName: string;
  status: string;
  assignee?: string;
}

export interface PersonSearchResult extends SearchResultBase {
  category: 'person';
  role?: string;
  team?: string;
  avatar?: string;
  color?: string;
}

export type SearchResult = 
  | ProjectSearchResult 
  | TeamSearchResult 
  | TaskSearchResult 
  | PersonSearchResult;

export interface SearchFilters {
  categories?: SearchCategory[];
  status?: string[];
  priority?: string[];
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  recentSearches: RecentSearch[];
  isLoading: boolean;
  filters: SearchFilters;
}
