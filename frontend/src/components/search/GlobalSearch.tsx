'use client';

/**
 * Global Search Modal
 * Main search interface with keyboard shortcuts and fuzzy search
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/search/SearchContext';
import SearchResultItem from './SearchResultItem';
import { getCategoryLabel, getCategoryIcon } from '@/lib/search/searchIndex';
import type { SearchCategory } from '@/lib/search/types';

export default function GlobalSearch() {
  const router = useRouter();
  const {
    isOpen,
    query,
    results,
    recentSearches,
    isLoading,
    closeSearch,
    performSearch,
    addRecentSearch,
    clearRecentSearches,
  } = useSearch();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle result click with navigation
  const handleResultClick = useCallback((result: typeof results[0]) => {
    if (!result) return;
    addRecentSearch(query);
    closeSearch();
    // Navigate to result URL
    router.push(result.url);
  }, [router, query, addRecentSearch, closeSearch]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, handleResultClick]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<SearchCategory, typeof results> = {
      project: [],
      team: [],
      task: [],
      person: [],
    };

    results.forEach(result => {
      groups[result.category].push(result);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [results]);

  const handleInputChange = (value: string) => {
    performSearch(value);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    performSearch(recentQuery);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={closeSearch}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-slideDown"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="relative border-b border-slate-200">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="Search projects, teams, people..."
              className="w-full pl-12 pr-24 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="absolute inset-y-0 right-4 flex items-center gap-2">
              <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            className="max-h-[60vh] overflow-y-auto p-3"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : query && results.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No results found</h3>
                <p className="text-sm text-slate-500">Try a different search term</p>
              </div>
            ) : query && results.length > 0 ? (
              <div className="space-y-4">
                {groupedResults.map(([category, items]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {getCategoryLabel(category)} ({items.length})
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {items.map((result, index) => {
                        const globalIndex = results.indexOf(result);
                        return (
                          <SearchResultItem
                            key={result.id}
                            result={result}
                            query={query}
                            isSelected={globalIndex === selectedIndex}
                            onClick={() => handleResultClick(result)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Recent Searches
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map(recent => (
                        <button
                          key={recent.id}
                          onClick={() => handleRecentSearchClick(recent.query)}
                          className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-slate-700 group-hover:text-slate-900 flex-1">
                              {recent.query}
                            </span>
                            <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Tips */}
                <div className="px-4 py-3 bg-slate-50 rounded-lg">
                  <h3 className="text-xs font-bold text-slate-700 mb-2">💡 Quick Tips</h3>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• Search by project name, team, or person</li>
                    <li>• Use arrow keys to navigate results</li>
                    <li>• Press Enter to open selected result</li>
                    <li>• Press Esc to close search</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-4 py-2 bg-slate-50">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono">↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono">↵</kbd>
                  <span>Select</span>
                </span>
              </div>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono">⌘K</kbd> to open
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
