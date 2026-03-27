'use client';

/**
 * Global Search Context
 * Manages global search state and keyboard shortcuts
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useProjects } from '../ProjectsContext';
import { searchEngine } from './searchEngine';
import { buildSearchIndex } from './searchIndex';
import type { SearchResult, SearchFilters, RecentSearch } from './types';

interface SearchContextType {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  recentSearches: RecentSearch[];
  isLoading: boolean;
  filters: SearchFilters;
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  performSearch: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const RECENT_SEARCHES_KEY = 'flowdesk_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const { projects } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  // Initialize search engine when projects change
  useEffect(() => {
    if (projects.length > 0) {
      const searchIndex = buildSearchIndex(projects);
      searchEngine.initialize(searchIndex);
    }
  }, [projects]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Esc to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  const performSearch = useCallback((searchQuery: string) => {
    setIsLoading(true);
    setQuery(searchQuery);

    // Simulate async search with slight delay for better UX
    setTimeout(() => {
      const searchResults = searchEngine.search(searchQuery, filters);
      setResults(searchResults);
      setIsLoading(false);
    }, 100);
  }, [filters]);

  const addRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query: searchQuery.trim(),
      timestamp: Date.now(),
    };

    setRecentSearches(prev => {
      // Remove duplicates and add to beginning
      const filtered = prev.filter(s => s.query !== newSearch.query);
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }
      
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  const value: SearchContextType = {
    isOpen,
    query,
    results,
    recentSearches,
    isLoading,
    filters,
    openSearch,
    closeSearch,
    setQuery,
    performSearch,
    setFilters,
    addRecentSearch,
    clearRecentSearches,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}
