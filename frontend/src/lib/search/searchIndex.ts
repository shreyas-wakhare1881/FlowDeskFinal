/**
 * Search Index Builder
 * Builds searchable index from projects, teams, and tasks
 */

import type { MockProject } from '../ProjectsContext';
import type { SearchResult } from './types';

/**
 * Build search index from projects data
 */
export function buildSearchIndex(projects: MockProject[]): SearchResult[] {
  const searchResults: SearchResult[] = [];

  // Add projects to search index
  projects.forEach(project => {
    searchResults.push({
      id: project.projectID,
      category: 'project',
      title: project.projectName,
      subtitle: project.teamName,
      description: project.projectDescription || '',
      badge: project.priority,
      icon: getPriorityIcon(project.priority),
      url: `/workspace/${project.projectID}/ws-dashboard`,
      status: project.status,
      priority: project.priority,
      progress: project.progress,
      team: project.teamName,
      dueDate: project.dueDate,
      metadata: {
        assignee: project.assigneeName,
        tasksTotal: project.tasksTotal,
        tasksCompleted: project.tasksCompleted,
      },
    });

    // Add team as searchable entity
    if (project.teamID && project.teamName) {
      // Check if team already exists
      const existingTeam = searchResults.find(
        r => r.category === 'team' && r.id === project.teamID
      );
      
      if (!existingTeam) {
        searchResults.push({
          id: project.teamID,
          category: 'team',
          title: project.teamName,
          subtitle: `${project.teamMembers?.length || 0} members`,
          icon: '👥',
          url: `/teams/${project.teamID}`,
          memberCount: project.teamMembers?.length || 0,
          projectCount: 1,
        });
      } else if ('projectCount' in existingTeam) {
        existingTeam.projectCount = (existingTeam.projectCount || 0) + 1;
      }
    }

    // Add assignee as searchable person
    if (project.assigneeName) {
      const existingPerson = searchResults.find(
        r => r.category === 'person' && r.title === project.assigneeName
      );
      
      if (!existingPerson) {
        searchResults.push({
          id: `person-${project.assigneeName.toLowerCase().replace(/\s+/g, '-')}`,
          category: 'person',
          title: project.assigneeName,
          subtitle: project.teamName,
          icon: project.assigneeAvatar,
          url: `/people/${project.assigneeName}`,
          avatar: project.assigneeAvatar,
          color: project.assigneeColor,
          team: project.teamName,
        });
      }
    }
  });

  return searchResults;
}

/**
 * Get icon for priority
 */
function getPriorityIcon(priority: string): string {
  const icons: Record<string, string> = {
    'Critical': '🔴',
    'High': '🟠',
    'Medium': '🟡',
    'Low': '🟢',
  };
  return icons[priority] || '⚪';
}

/**
 * Get category display name
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    project: 'Projects',
    team: 'Teams',
    task: 'Tasks',
    person: 'People',
  };
  return labels[category] || category;
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    project: '🏗️',
    team: '👥',
    task: '📋',
    person: '👤',
  };
  return icons[category] || '📄';
}
