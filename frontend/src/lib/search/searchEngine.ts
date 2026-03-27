/**
 * Search Engine
 * Fuzzy search implementation using Fuse.js
 */

import Fuse, { type IFuseOptions } from 'fuse.js';
import type { SearchResult, SearchResultBase, SearchFilters } from './types';

// Fuse.js configuration for optimal fuzzy matching
const FUSE_OPTIONS: IFuseOptions<SearchResultBase> = {
  keys: [
    { name: 'title', weight: 3 },        // Title most important
    { name: 'subtitle', weight: 2 },     // Subtitle second
    { name: 'description', weight: 1 },  // Description third
    { name: 'badge', weight: 1.5 },      // Badge (tags, status)
  ],
  threshold: 0.4,           // 0 = exact match, 1 = match anything
  distance: 100,            // How far to search in text
  minMatchCharLength: 2,    // Minimum character length for matching
  includeScore: true,       // Include match score
  includeMatches: true,     // Include match positions for highlighting
  ignoreLocation: true,     // Search entire string (not just beginning)
};

export class SearchEngine {
  private fuse: Fuse<SearchResult> | null = null;
  private allResults: SearchResult[] = [];

  /**
   * Initialize search engine with data
   */
  initialize(data: SearchResult[]) {
    this.allResults = data;
    this.fuse = new Fuse(data, FUSE_OPTIONS);
  }

  /**
   * Update search index with new data
   */
  updateIndex(data: SearchResult[]) {
    this.initialize(data);
  }

  /**
   * Perform fuzzy search
   */
  search(query: string, filters?: SearchFilters): SearchResult[] {
    if (!this.fuse || !query.trim()) {
      return this.applyFilters(this.allResults, filters);
    }

    const fuseResults = this.fuse.search(query);
    const results = fuseResults.map(result => result.item);
    
    return this.applyFilters(results, filters);
  }

  /**
   * Get all results without search query
   */
  getAll(filters?: SearchFilters): SearchResult[] {
    return this.applyFilters(this.allResults, filters);
  }

  /**
   * Get results by category
   */
  getByCategory(category: string, limit?: number): SearchResult[] {
    const filtered = this.allResults.filter(r => r.category === category);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Apply filters to results
   */
  private applyFilters(results: SearchResult[], filters?: SearchFilters): SearchResult[] {
    if (!filters) return results;

    let filtered = results;

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(r => filters.categories?.includes(r.category));
    }

    // Filter by status (for projects and tasks)
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(r => {
        if ('status' in r) {
          return filters.status?.includes(r.status);
        }
        return true;
      });
    }

    // Filter by priority (for projects)
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(r => {
        if ('priority' in r) {
          return filters.priority?.includes(r.priority);
        }
        return true;
      });
    }

    return filtered;
  }

  /**
   * Get match highlights for a search result
   */
  getHighlights(query: string, text: string): { start: number; end: number }[] {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();
    const highlights: { start: number; end: number }[] = [];
    
    let index = 0;
    while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
      highlights.push({ start: index, end: index + query.length });
      index += query.length;
    }
    
    return highlights;
  }
}

// Singleton instance
export const searchEngine = new SearchEngine();
