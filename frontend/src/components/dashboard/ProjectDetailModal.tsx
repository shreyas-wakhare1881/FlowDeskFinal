'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TeamMember {
  avatar: string;
  color: string;
  name: string;
  role?: string;
  status?: string;
}

interface ProjectDetailModalProps {
  project: {
    projectID: string;
    projectName: string;
    projectDescription?: string;
    status: string;
    statusLabel: string;
    teamName: string;
    assigneeName: string;
    assigneeAvatar: string;
    assigneeColor: string;
    assignedDate: string;
    dueDate: string;
    priority: string;
    progress?: number;
    tasksTotal?: number;
    tasksCompleted?: number;
    teamMembers?: TeamMember[];
    tags?: string[];
    teams?: { teamID: string; teamName: string; members: { name: string; avatar: string; color: string }[] }[];
  };
  onClose: () => void;
}

const STATUS_CLASS: Record<string, string> = {
  'Pending':     'bg-[#fff0f2] text-[#ef233c]',
  'In Progress': 'bg-[#eff5ff] text-[#3a86ff]',
  'Completed':   'bg-[#e8fdf6] text-[#06b47e]',
  'Overdue':     'bg-[#fff8e1] text-[#b45309]',
};

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const router = useRouter();

  const progress      = project.progress ?? 0;
  const tasksTotal    = project.tasksTotal ?? 0;
  const tasksCompleted = project.tasksCompleted ?? 0;
  const tasksInProgress = Math.max(0, Math.round(tasksTotal * 0.25));
  const tasksOverdue   = Math.max(0, tasksTotal - tasksCompleted - tasksInProgress);

  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleEnterWorkspace() {
    onClose();
    router.push(`/workspace/${project.projectID}/ws-dashboard`);
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
      }}
      onClick={onClose}
    >
      <div
        className="bg-white relative"
        style={{
          borderRadius: '16px',
          maxWidth: '1000px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          fontFamily: 'Inter, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-[#f1f3f5] hover:bg-[#e9ecef] hover:rotate-90 transition-all duration-200"
          style={{ fontSize: '28px', lineHeight: 1, color: '#1a1a2e', border: 'none', cursor: 'pointer', zIndex: 10 }}
        >
          ×
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', padding: '40px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '16px', borderBottom: '2px solid #e8ecf0' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', margin: 0, lineHeight: 1.3 }}>
                  {project.projectName}
                </h2>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#4361ee', background: '#eff5ff', padding: '2px 10px', borderRadius: '6px', fontFamily: 'monospace', display: 'inline-block', width: 'fit-content' }}>
                  ID: {project.projectID}
                </span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${STATUS_CLASS[project.statusLabel] ?? 'bg-[#eff5ff] text-[#3a86ff]'}`}>
                {project.statusLabel}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#7a828c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Category</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>{project.tags?.[0] || 'General'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#7a828c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎯 Priority</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>{project.priority}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#7a828c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 Assigned</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>{project.assignedDate}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#7a828c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⏰ Due Date</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>{project.dueDate}</span>
              </div>
            </div>

            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '14px', borderLeft: '4px solid #4361ee' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 12px 0' }}>📝 Description</h4>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#1a1a2e', margin: 0 }}>
                {project.projectDescription || 'No description provided.'}
              </p>
            </div>

            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '14px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 14px 0' }}>👥 Assigned Teams</h4>
              {(project.teams && project.teams.length > 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {project.teams.map((team) => (
                    <div key={team.teamID} style={{
                      background: 'white', border: '1.5px solid #e8ecf0',
                      borderRadius: '12px', padding: '12px 14px',
                      display: 'flex', flexDirection: 'column', gap: '8px',
                    }}>
                      {/* Team Name + ID */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e' }}>{team.teamName}</span>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, color: '#4361ee',
                          background: '#eff5ff', padding: '2px 8px',
                          borderRadius: '6px', fontFamily: 'monospace', flexShrink: 0,
                        }}>{team.teamID}</span>
                      </div>
                      {/* Member overlapping avatars */}
                      {team.members.length > 0 && (
                        <div style={{ display: 'flex' }}>
                          {team.members.slice(0, 6).map((m, i) => (
                            <div key={i} title={m.name} style={{
                              width: '26px', height: '26px', borderRadius: '50%',
                              background: m.color, border: '2px solid white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 700, color: 'white',
                              marginLeft: i === 0 ? '0' : '-6px',
                              zIndex: team.members.length - i, position: 'relative',
                            }}>{m.avatar}</div>
                          ))}
                          {team.members.length > 6 && (
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '50%',
                              background: '#e2e8f0', border: '2px solid white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 700, color: '#64748b',
                              marginLeft: '-6px', position: 'relative',
                            }}>+{team.members.length - 6}</div>
                          )}
                          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#7a828c', alignSelf: 'center' }}>
                            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#7a828c', padding: '8px 0' }}>
                  No teams assigned yet.{' '}
                  <button
                    onClick={() => router.push(`/create-team?projectID=${project.projectID}`)}
                    style={{ color: '#4361ee', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                  >Create a team →</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 20px 0' }}>📊 Project Progress</h4>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="70" fill="none" stroke="#e9ecef" strokeWidth="12"/>
                  <circle
                    cx="90" cy="90" r="70"
                    fill="none"
                    stroke="#4361ee"
                    strokeWidth="12"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 90 90)"
                  />
                  <text x="90" y="85" textAnchor="middle" fontSize="32" fontWeight="700" fill="#2d3748">{progress}%</text>
                  <text x="90" y="105" textAnchor="middle" fontSize="12" fill="#718096">Complete</text>
                </svg>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px 0' }}>📌 Tasks Overview</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                {[
                  { label: 'Total', value: tasksTotal, color: '#1a1a2e' },
                  { label: 'Completed', value: tasksCompleted, color: '#06b47e' },
                  { label: 'In Progress', value: tasksInProgress, color: '#3a86ff' },
                  { label: 'Overdue', value: tasksOverdue, color: '#ef233c' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'white', border: '1.5px solid #e8ecf0', borderRadius: '14px',
                    padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px'
                  }}>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#7a828c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {project.teamMembers && project.teamMembers.length > 0 && (
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px 0' }}>👤 Team Members</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {project.teamMembers.map((member, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px', background: 'white', border: '1.5px solid #e8ecf0',
                      borderRadius: '14px', transition: 'all 0.2s'
                    }}>
                      <div
                        style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', fontWeight: 700, color: 'white',
                          background: member.color, position: 'relative'
                        }}
                      >
                        {member.avatar}
                        <span style={{
                          position: 'absolute', bottom: 0, right: 0,
                          width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white',
                          background: member.status === 'offline' ? '#bbb' : member.status === 'idle' ? '#f9a825' : '#06b47e'
                        }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 2px 0' }}>{member.name}</div>
                        {member.role && <div style={{ fontSize: '12px', color: '#7a828c' }}>{member.role}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '24px 40px', borderTop: '2px solid #e8ecf0', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleEnterWorkspace}
            style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #4361ee, #7209b7)',
              color: 'white',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(67,97,238,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(67,97,238,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(67,97,238,0.3)';
            }}
          >
            <span>🚀 View Project Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
