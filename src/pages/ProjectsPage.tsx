import { useState, useMemo } from 'react';
import {
  Plus,
  FolderOpen,
  ExternalLink,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  CheckCircle2,
  Link2,
  ListTree,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import type { Project, ProjectStatus, Task, TaskPriority, LifeArea } from '../types';
import { nanoid } from '../utils/nanoid';
import { today } from '../utils/dates';
import TaskAssignmentModal from '../components/tasks/TaskAssignmentModal';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  idea:        { label: 'Idea',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  planned:     { label: 'Planned',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  'in-progress':{ label: 'In Progress', color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  paused:      { label: 'Paused',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  completed:   { label: 'Completed',   color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

const STATUSES: ProjectStatus[] = ['idea', 'planned', 'in-progress', 'paused', 'completed'];

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

export default function ProjectsPage() {
  const {
    projects,
    updateProject,
    removeProject,
    tasks,
    addTask,
    updateTask,
    completeTask,
    removeTask,
    assignTask,
    customLifeAreas,
  } = useApp();

  const [expanded, setExpanded] = useState<string | null>(projects[0]?.id ?? null);
  const [showEdit, setShowEdit] = useState<Project | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignExistingProjId, setAssignExistingProjId] = useState<string | null>(null);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);

  // New project state
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    status: 'planned' as ProjectStatus,
    priority: 'high' as TaskPriority,
    startDate: today(),
    targetDate: '',
    technologies: '',
    repoUrl: '',
    nextAction: '',
    notes: '',
  });

  // Filter and search
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [projects, filterStatus, searchQuery]);

  const handleStatusChange = async (project: Project, status: ProjectStatus) => {
    await updateProject({ ...project, status, updatedAt: new Date().toISOString() });
  };

  const handleAddProject = async () => {
    if (!newForm.name.trim()) return;
    const proj: Project = {
      id: nanoid(),
      name: newForm.name.trim(),
      description: newForm.description.trim(),
      status: newForm.status,
      priority: newForm.priority,
      startDate: newForm.startDate || undefined,
      targetDate: newForm.targetDate || undefined,
      goals: [],
      tasks: [],
      milestones: [],
      technologies: newForm.technologies ? newForm.technologies.split(',').map((t) => t.trim()).filter(Boolean) : [],
      repoUrl: newForm.repoUrl.trim() || undefined,
      nextAction: newForm.nextAction.trim() || undefined,
      notes: newForm.notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await updateProject(proj);
    setShowAdd(false);
    setNewForm({
      name: '',
      description: '',
      status: 'planned',
      priority: 'high',
      startDate: today(),
      targetDate: '',
      technologies: '',
      repoUrl: '',
      nextAction: '',
      notes: '',
    });
  };

  return (
    <div className="page-container pb-safe">
      {/* Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            🚀 <span className="gradient-text">Portfolio & Project Management</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage unlimited projects, subtask hierarchies, target timelines, and repo links.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: '32px', fontSize: '0.84rem' }}
            placeholder="Search projects, technologies, or descriptions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({projects.length})
          </button>
          {STATUSES.map((s) => {
            const c = STATUS_CONFIG[s];
            const count = projects.filter((p) => p.status === s).length;
            return (
              <button
                key={s}
                className="btn btn-sm"
                style={{
                  background: filterStatus === s ? c.bg : 'var(--bg-surface-2)',
                  color: filterStatus === s ? c.color : 'var(--text-secondary)',
                  border: `1px solid ${filterStatus === s ? c.color + '50' : 'var(--border)'}`,
                  fontSize: '0.75rem',
                }}
                onClick={() => setFilterStatus(s)}
              >
                {c.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            allTasks={tasks}
            customLifeAreas={customLifeAreas}
            isExpanded={expanded === project.id}
            onToggle={() => setExpanded(expanded === project.id ? null : project.id)}
            onEdit={() => setShowEdit(project)}
            onDelete={() => removeProject(project.id)}
            onStatusChange={(s) => handleStatusChange(project, s)}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onCompleteTask={completeTask}
            onRemoveTask={removeTask}
            onAssignExisting={() => setAssignExistingProjId(project.id)}
            onMoveTask={setTaskToMove}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <FolderOpen size={40} style={{ margin: '0 auto 0.75rem auto', color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
            {projects.length === 0 ? 'No projects yet' : 'No matching projects found'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Plan, organize, and track your innovations, open source repos, and apps.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Create First Project
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <ProjectEditModal
          project={showEdit}
          onSave={async (p) => {
            await updateProject(p);
            setShowEdit(null);
          }}
          onClose={() => setShowEdit(null)}
        />
      )}

      {/* Add Project Modal */}
      {showAdd && (
        <Modal isOpen={true} onClose={() => setShowAdd(false)} title="Create New Project" maxWidth="600px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label>Project Name *</label>
              <input
                className="input"
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Distributed Cache & Job Queue"
                autoFocus
              />
            </div>
            <div>
              <label>Description</label>
              <textarea
                className="input"
                style={{ minHeight: '68px' }}
                value={newForm.description}
                onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What problem does this project solve?"
              />
            </div>
            <div className="form-grid-2">
              <div>
                <label>Status</label>
                <select
                  className="input select"
                  value={newForm.status}
                  onChange={(e) => setNewForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Priority</label>
                <select
                  className="input select"
                  value={newForm.priority}
                  onChange={(e) => setNewForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div>
                <label>Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={newForm.startDate}
                  onChange={(e) => setNewForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label>Target Date</label>
                <input
                  type="date"
                  className="input"
                  value={newForm.targetDate}
                  onChange={(e) => setNewForm((f) => ({ ...f, targetDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label>Technologies (comma separated)</label>
              <input
                className="input"
                value={newForm.technologies}
                onChange={(e) => setNewForm((f) => ({ ...f, technologies: e.target.value }))}
                placeholder="React, TypeScript, Spring Boot, PostgreSQL"
              />
            </div>
            <div>
              <label>GitHub Repository URL</label>
              <input
                className="input"
                value={newForm.repoUrl}
                onChange={(e) => setNewForm((f) => ({ ...f, repoUrl: e.target.value }))}
                placeholder="https://github.com/username/project"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddProject}>Create Project</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Existing Tasks Modal */}
      {assignExistingProjId && (
        <AssignExistingTaskToProjectModal
          projectId={assignExistingProjId}
          tasks={tasks}
          onAssign={async (taskId) => {
            await assignTask(taskId, { projectId: assignExistingProjId });
            setAssignExistingProjId(null);
          }}
          onClose={() => setAssignExistingProjId(null)}
        />
      )}

      {/* Task Assignment Modal for moving between projects/areas */}
      {taskToMove && (
        <TaskAssignmentModal
          task={taskToMove}
          isOpen={true}
          onClose={() => setTaskToMove(null)}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  allTasks,
  customLifeAreas,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onStatusChange,
  onAddTask,
  onUpdateTask,
  onCompleteTask,
  onRemoveTask,
  onAssignExisting,
  onMoveTask,
}: {
  project: Project;
  allTasks: Task[];
  customLifeAreas: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: ProjectStatus) => void;
  onAddTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  onUpdateTask: (task: Task) => Promise<any>;
  onCompleteTask: (id: string) => Promise<any>;
  onRemoveTask: (id: string) => Promise<any>;
  onAssignExisting: () => void;
  onMoveTask: (task: Task) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskArea, setNewTaskArea] = useState<LifeArea>('technical');
  const [parentForSubtask, setParentForSubtask] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const cfg = STATUS_CONFIG[project.status];

  // Linked tasks from underlying Task table
  const projectTasks = allTasks.filter((t) => t.projectId === project.id && !t.parentId);
  const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
  const totalCount = projectTasks.length;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddProjectTask = async () => {
    if (!newTaskTitle.trim()) return;
    await onAddTask({
      title: newTaskTitle.trim(),
      projectId: project.id,
      lifeArea: newTaskArea,
      dueDate: today(),
      priority: 'medium',
      status: 'not-started',
    });
    setNewTaskTitle('');
  };

  const handleAddSubtask = async (parentId: string) => {
    if (!newSubtaskTitle.trim()) return;
    const parent = allTasks.find((t) => t.id === parentId);
    await onAddTask({
      title: newSubtaskTitle.trim(),
      parentId,
      projectId: project.id,
      lifeArea: parent?.lifeArea || 'technical',
      dueDate: parent?.dueDate || today(),
      priority: 'medium',
      status: 'not-started',
    });
    setNewSubtaskTitle('');
    setParentForSubtask(null);
  };

  const handleUnlinkTask = async (task: Task) => {
    await onUpdateTask({
      ...task,
      projectId: undefined,
    });
  };

  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${cfg.color}`,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: 'clamp(0.75rem, 3vw, 1.25rem)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 200, cursor: 'pointer' }} onClick={onToggle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
              {project.name}
            </h3>
            <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontSize: '0.72rem' }}>
              {cfg.label}
            </span>
            {project.priority && (
              <span className={`badge priority-${project.priority}`} style={{ fontSize: '0.68rem' }}>
                {project.priority}
              </span>
            )}
          </div>

          {project.description && (
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
              {project.description}
            </p>
          )}

          {/* Dates & Repo Tags */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            {project.technologies.slice(0, 5).map((t) => (
              <span key={t} className="badge" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                {t}
              </span>
            ))}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="badge"
                style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
              >
                <ExternalLink size={10} /> Repo
              </a>
            )}
            {project.targetDate && (
              <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Calendar size={11} /> Target: {project.targetDate}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem' }}>
            <div className="progress-bar-track" style={{ flex: 1, height: 5 }}>
              <div className="progress-bar-fill" style={{ width: `${progressPct}%`, background: cfg.color }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {completedCount}/{totalCount} tasks ({progressPct}%)
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onEdit} title="Edit Project">
            <Edit3 size={14} />
          </button>
          {confirmDelete ? (
            <>
              <button className="btn btn-danger btn-xs" onClick={onDelete}>Delete</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: '#ef4444' }} onClick={() => setConfirmDelete(true)} title="Delete Project">
              <Trash2 size={14} />
            </button>
          )}
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onToggle}>
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded Project Workspace */}
      {isExpanded && (
        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          {/* Status buttons */}
          <div style={{ display: 'flex', gap: '0.4rem', margin: '1rem 0', flexWrap: 'wrap' }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                className="btn btn-sm"
                style={{
                  background: project.status === s ? STATUS_CONFIG[s].bg : 'var(--bg-surface-2)',
                  color: project.status === s ? STATUS_CONFIG[s].color : 'var(--text-muted)',
                  border: `1px solid ${project.status === s ? STATUS_CONFIG[s].color + '40' : 'transparent'}`,
                  fontSize: '0.75rem',
                }}
                onClick={() => onStatusChange(s)}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* Project Task Hierarchy */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ListTree size={14} /> Project Task Hierarchy ({projectTasks.length})
              </span>
              <button
                className="btn btn-secondary btn-xs"
                onClick={onAssignExisting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
              >
                <Link2 size={12} /> Link Existing Task
              </button>
            </div>

            {/* Task rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {projectTasks.map((t) => {
                const isCompleted = t.status === 'completed';
                const subtasks = allTasks.filter((sub) => sub.parentId === t.id);

                return (
                  <div
                    key={t.id}
                    style={{
                      background: 'var(--bg-surface-2)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.85rem',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 200 }}>
                        <button
                          onClick={() => onCompleteTask(t.id)}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '4px',
                            border: `2px solid ${isCompleted ? cfg.color : 'var(--border)'}`,
                            background: isCompleted ? cfg.color : 'transparent',
                            flexShrink: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isCompleted && <CheckCircle2 size={11} color="white" />}
                        </button>
                        <span
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {t.title}
                        </span>
                        <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                          {t.lifeArea}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => setParentForSubtask(parentForSubtask === t.id ? null : t.id)}
                          style={{ fontSize: '0.72rem' }}
                        >
                          + Subtask
                        </button>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => onMoveTask(t)}
                          style={{ fontSize: '0.72rem', color: '#818cf8' }}
                          title="Move or reassign task"
                        >
                          Move
                        </button>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleUnlinkTask(t)}
                          style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
                          title="Unlink from project (keeps task safe in Task Builder)"
                        >
                          Unlink
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-xs"
                          onClick={() => onRemoveTask(t.id)}
                          style={{ color: '#ef4444' }}
                          title="Delete task"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Subtasks hierarchy */}
                    {subtasks.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {subtasks.map((st) => (
                          <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button
                                onClick={() => onCompleteTask(st.id)}
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '3px',
                                  border: `1px solid ${st.status === 'completed' ? cfg.color : 'var(--border)'}`,
                                  background: st.status === 'completed' ? cfg.color : 'transparent',
                                  cursor: 'pointer',
                                }}
                              />
                              <span style={{ color: st.status === 'completed' ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: st.status === 'completed' ? 'line-through' : 'none' }}>
                                {st.title}
                              </span>
                            </div>
                            <button className="btn btn-ghost btn-icon btn-xs" onClick={() => onRemoveTask(st.id)} style={{ color: '#ef4444' }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subtask input form if open for this parent */}
                    {parentForSubtask === t.id && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                        <input
                          className="input"
                          style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                          placeholder="Subtask title…"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(t.id)}
                          autoFocus
                        />
                        <button className="btn btn-primary btn-xs" onClick={() => handleAddSubtask(t.id)}>
                          Add
                        </button>
                        <button className="btn btn-ghost btn-xs" onClick={() => setParentForSubtask(null)}>
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Add Task to Project */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 180, fontSize: '0.82rem' }}
                placeholder="+ Add task to this project…"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProjectTask()}
              />
              <select
                className="input select"
                style={{ width: '130px', fontSize: '0.8rem' }}
                value={newTaskArea}
                onChange={(e) => setNewTaskArea(e.target.value as LifeArea)}
              >
                {customLifeAreas.filter((a) => a.enabled !== false).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleAddProjectTask}>
                <Plus size={14} /> Add Task
              </button>
            </div>
          </div>

          {/* Notes and Next Action */}
          {project.nextAction && (
            <div style={{ padding: '0.75rem 1rem', background: `${cfg.color}08`, border: `1px solid ${cfg.color}25`, borderRadius: '8px', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '0.78rem', color: cfg.color }}>⚡ Immediate Next Action:</strong>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{project.nextAction}</p>
            </div>
          )}

          {project.notes && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
              📝 {project.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectEditModal({
  project,
  onSave,
  onClose,
}: {
  project: Project;
  onSave: (p: Project) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority || 'medium',
    startDate: project.startDate || '',
    targetDate: project.targetDate || '',
    technologies: project.technologies.join(', '),
    repoUrl: project.repoUrl ?? '',
    nextAction: project.nextAction ?? '',
    notes: project.notes ?? '',
  });

  const handleSave = async () => {
    await onSave({
      ...project,
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      startDate: form.startDate || undefined,
      targetDate: form.targetDate || undefined,
      technologies: form.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      repoUrl: form.repoUrl.trim() || undefined,
      nextAction: form.nextAction.trim() || undefined,
      notes: form.notes.trim(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit: ${project.name}`} maxWidth="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <label>Project Name *</label>
          <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label>Description</label>
          <textarea className="input" style={{ minHeight: '68px' }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="form-grid-2">
          <div>
            <label>Status</label>
            <select className="input select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div>
            <label>Priority</label>
            <select className="input select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <label>Start Date</label>
            <input type="date" className="input" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label>Target Date</label>
            <input type="date" className="input" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} />
          </div>
        </div>
        <div>
          <label>Technologies</label>
          <input className="input" value={form.technologies} onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))} />
        </div>
        <div>
          <label>Repo URL</label>
          <input className="input" value={form.repoUrl} onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))} />
        </div>
        <div>
          <label>Next Action</label>
          <input className="input" value={form.nextAction} onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))} />
        </div>
        <div>
          <label>Notes</label>
          <textarea className="input" style={{ minHeight: '60px' }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </Modal>
  );
}

function AssignExistingTaskToProjectModal({
  projectId,
  tasks,
  onAssign,
  onClose,
}: {
  projectId: string;
  tasks: Task[];
  onAssign: (taskId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const availableTasks = tasks.filter(
    (t) => t.projectId !== projectId && !t.parentId && t.status !== 'completed'
  );

  const filtered = availableTasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Link Existing Task to Project">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <input
          className="input"
          placeholder="Search unlinked tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        {filtered.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            No available tasks found.
          </p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {filtered.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{t.title}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    ({t.lifeArea})
                  </span>
                </div>
                <button
                  className="btn btn-primary btn-xs"
                  onClick={() => onAssign(t.id)}
                >
                  Link to Project
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
