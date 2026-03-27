'use client';

/**
 * Search Result Item Component
 * Individual search result with highlighting
 */

import { useRouter } from 'next/navigation';
import type { SearchResult } from '@/lib/search/types';
import { getCategoryIcon } from '@/lib/search/searchIndex';

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function SearchResultItem({ result, query, isSelected, onClick }: SearchResultItemProps) {
  const router = useRouter();

  const handleClick = () => {
    onClick();
    router.push(result.url);
  };

  const highlightText = (text: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-slate-900 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      project: 'text-blue-600 bg-blue-50',
      team: 'text-purple-600 bg-purple-50',
      task: 'text-green-600 bg-green-50',
      person: 'text-orange-600 bg-orange-50',
    };
    return colors[result.category] || 'text-slate-600 bg-slate-50';
  };

  const getStatusBadge = () => {
    if ('status' in result && result.status) {
      const statusColors: Record<string, string> = {
        'In Progress': 'bg-blue-100 text-blue-700',
        'Completed': 'bg-green-100 text-green-700',
        'Overdue': 'bg-red-100 text-red-700',
        'To Do': 'bg-slate-100 text-slate-700',
      };
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[result.status] || 'bg-slate-100 text-slate-700'}`}>
          {result.status}
        </span>
      );
    }
    return null;
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 group ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-500'
          : 'hover:bg-slate-50 border-2 border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getCategoryColor()}`}>
          {result.icon || getCategoryIcon(result.category)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Badge */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {highlightText(result.title)}
            </h3>
            {result.badge && (
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                {result.badge}
              </span>
            )}
          </div>

          {/* Subtitle */}
          {result.subtitle && (
            <p className="text-xs text-slate-600 truncate mb-1">
              {highlightText(result.subtitle)}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge()}
            
            {'progress' in result && result.progress !== undefined && (
              <span className="text-xs text-slate-500">
                {result.progress}% complete
              </span>
            )}
            
            {'memberCount' in result && (
              <span className="text-xs text-slate-500">
                {result.memberCount} members
              </span>
            )}
            
            {result.metadata?.assignee && (
              <span className="text-xs text-slate-500">
                Assigned to {result.metadata.assignee}
              </span>
            )}
          </div>
        </div>

        {/* Arrow icon on hover/selected */}
        <div className={`flex-shrink-0 text-slate-400 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}
