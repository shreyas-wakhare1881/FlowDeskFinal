'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import ProjectIdentity from '@/components/create/ProjectIdentity';
import PrioritySelector from '@/components/create/PrioritySelector';
import ClientInfo from '@/components/create/ClientInfo';
import FileUpload from '@/components/create/FileUpload';
import LiveSummary from '@/components/create/LiveSummary';
import TeamAssignment from '@/components/create/TeamAssignment';
import type { MemberWithRole, AssignableRole } from '@/components/create/TeamAssignment';
import { projectsService } from '@/lib/projects.service';
import type { CreateProjectDto } from '@/types/project';
import { useProjects } from '@/lib/ProjectsContext';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useRbac } from '@/lib/RbacContext';
import AccessDenied from '@/components/shared/AccessDenied';
import { usersService, type SystemUser } from '@/lib/users.service';


type Priority = 'critical' | 'medium' | 'low' | '';

interface FileUploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

const MEMBER_COLORS: Record<string, string> = {
  'Rahul Kumar': '#4361ee', 'Sneha Patel': '#06d6a0',
  'Arjun Mehta': '#7209b7', 'Priya Das': '#f9a825',
  'Vishal Tiwari': '#3a86ff',
};

export default function CreateProjectPage() {
  const router = useRouter();
  const { addProject } = useProjects();
  const currentUser = useCurrentUser();
  const { canManage, noProjects, loading: rbacLoading } = useRbac();
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('');
  const [deadline, setDeadline] = useState('');
  const [files, setFiles] = useState<FileUploadedFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newProjectId, setNewProjectId] = useState('');
  
  // Client Info State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientTimezone, setClientTimezone] = useState('');
  const [isInternalProject, setIsInternalProject] = useState(false);

  // Team assignment state
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [membersWithRoles, setMembersWithRoles] = useState<MemberWithRole[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, roles] = await Promise.all([
          usersService.getAll(),
          projectsService.getRoles(),
        ]);
        setSystemUsers(users);
        // Only expose Manager and Developer (not SuperAdmin, not Client)
        setAssignableRoles(
          roles.filter((r) => r.name === 'Manager' || r.name === 'Developer'),
        );
      } catch {
        // non-critical — form still works without pre-loaded users
      }
    };
    load();
  }, []);


  const validateForm = () => {
    if (!projectName.trim()) {
      alert('⚠️ Please enter a Project Name!');
      return false;
    }
    if (!priority) {
      alert('⚠️ Please select a Priority!');
      return false;
    }
    return true;
  };

  const handleLaunchProject = async () => {
    if (!validateForm()) return;

    try {
      // Call backend API first — project must exist in DB before context update
      const createdProject = await projectsService.create({
        projectName,
        projectDescription: projectDescription || 'No description provided',
        status: 'todo',
        statusLabel: 'To Do',
        priority,
        category: 'General',
        assignedDate: new Date().toISOString(),
        dueDate: deadline ? new Date(deadline).toISOString() : undefined,
        teamID: '',
        teamName: 'Unassigned',
        assigneeID: currentUser.id || 'USER-001',
        assigneeName: currentUser.name,
        assigneeAvatar: currentUser.initials,
        assigneeAvatarColor: '#4361ee',
        tags: priority ? [priority.charAt(0).toUpperCase() + priority.slice(1)] : [],
        teamLead: { leadId: currentUser.id || 'USER-001', name: currentUser.name, avatar: currentUser.initials, avatarColor: '#4361ee' },
        teamMembers: [],
        metrics: { completionPercentage: 0, tasksTotal: 0, tasksCompleted: 0, tasksInProgress: 0, tasksOverdue: 0 },
      });

      console.log('✅ Project Created:', createdProject);

      // ⚡ Add to context from API response (DB-backed, correct projectID from server)
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dueDateFormatted = deadline 
        ? new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'No deadline';
      addProject({
        id:           createdProject.id,
        projectID:    createdProject.projectID,
        projectName:  createdProject.projectName,
        projectDescription: createdProject.projectDescription,
        status:       'todo',
        statusLabel:  'Pending',
        teamName:     'Unassigned',
        assigneeName: currentUser.name,
        assigneeAvatar: currentUser.initials,
        assigneeColor: '#4361ee',
        assignedDate: today,
        dueDate:      dueDateFormatted,
        priority:     priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium',
        progress:     0,
        tasksTotal:   0,
        tasksCompleted: 0,
        tags:         priority ? [priority.charAt(0).toUpperCase() + priority.slice(1)] : [],
      });

      // Assign selected members with their chosen roles
      if (membersWithRoles.length > 0) {
        await Promise.allSettled(
          membersWithRoles.map((m) =>
            projectsService.addMember(createdProject.id, m.userId, m.roleId),
          ),
        );
      }

      // Show success modal
      setNewProjectId(createdProject.projectID);
      setShowSuccessModal(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleSaveDraft = () => {
    alert('💾 Project saved as draft!');
  };

  const handleReset = () => {
    setShowSuccessModal(false);
    setProjectName('');
    setProjectDescription('');
    setPriority('');
    setDeadline('');
    setFiles([]);
    setSelectedTemplate('');
    setClientName('');
    setClientEmail('');
    setClientContact('');
    setClientTimezone('');
    setIsInternalProject(false);
    setMembersWithRoles([]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Topbar 
        title="" 
        subtitle="" 
        breadcrumb={
          <div className="text-sm text-slate-500">
            <button onClick={() => router.push('/dashboard')} className="hover:text-blue-600 transition-colors bg-transparent border-0 p-0 cursor-pointer text-sm text-slate-500">
              Dashboard
            </button>
            <span className="mx-2">/</span>
            <span>Create Project</span>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 overflow-auto">

        {/* ── RBAC gate: only Manager / SuperAdmin reach here ───────────────── */}
        {rbacLoading ? (
          <div className="flex h-[60vh] items-center justify-center text-slate-500 text-sm">
            Checking permissions…
          </div>
        ) : !canManage && !noProjects ? (
          <AccessDenied
            requiredPermission="Create Project (Manager / SuperAdmin only)"
            role={undefined}
          />
        ) : (

        <main className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
              <span>🚀</span> Launch a New Project
            </h2>
            <p className="text-lg text-slate-600 ml-[52px] pl-2">
              Fill in the details below — quick and straightforward.
            </p>
          </div>

          {/* Critical Bar */}
          {priority === 'critical' && (
            <div className="mb-8 p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl text-white font-semibold text-center animate-pulse">
              🔴 CRITICAL PRIORITY — This project will be highlighted across all boards
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <ProjectIdentity
                projectName={projectName}
                projectDescription={projectDescription}
                deadline={deadline}
                onProjectNameChange={setProjectName}
                onProjectDescriptionChange={setProjectDescription}
                onDeadlineChange={setDeadline}
              />

              <PrioritySelector priority={priority} onPriorityChange={setPriority} />

              <ClientInfo
                clientName={clientName}
                clientEmail={clientEmail}
                clientContact={clientContact}
                clientTimezone={clientTimezone}
                isInternalProject={isInternalProject}
                onClientNameChange={setClientName}
                onClientEmailChange={setClientEmail}
                onClientContactChange={setClientContact}
                onClientTimezoneChange={setClientTimezone}
                onIsInternalProjectChange={setIsInternalProject}
              />

              <FileUpload files={files} onFilesChange={setFiles} />

              <TeamAssignment
                selectedMembers={membersWithRoles.map((m) => m.name)}
                teamName={projectName || 'New Project'}
                teamID=''
                onMembersChange={() => {}}
                onTeamNameChange={() => {}}
                teamTemplates={[]}
                selectedTemplate=''
                onTemplateSelect={() => {}}
                systemUsers={systemUsers}
                assignableRoles={assignableRoles}
                membersWithRoles={membersWithRoles}
                onMembersWithRolesChange={setMembersWithRoles}
              />
            </div>

            {/* Right Column - Sticky Sidebar */}
            <div className="space-y-6 sticky top-24 self-start">
              <LiveSummary
                projectName={projectName}
                priority={priority}
                selectedMembers={[]}
                deadline={deadline}
                fileCount={files.length}
                clientName={clientName}
                clientEmail={clientEmail}
                clientTimezone={clientTimezone}
                isInternalProject={isInternalProject}
              />

              {/* Launch Buttons */}
              <button
                onClick={handleLaunchProject}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <span>🚀</span> Launch Project
              </button>
            </div>
          </div>
        </main>
        )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-slideIn">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-3xl font-bold text-slate-900 mb-3">Project Launched!</h3>
              <p className="text-slate-600 mb-6">
                Your project has been created and the team has been notified. It&apos;s now live on
                the board.
              </p>
              <div className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl mb-6 text-xl">
                {newProjectId}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}