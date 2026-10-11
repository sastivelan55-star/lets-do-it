import { useState } from 'react';
import { Plus, FolderOpen, ExternalLink, Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import type { Project, ProjectStatus } from '../types';
import { nanoid } from '../utils/nanoid';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  idea:        { label: 'Idea',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  planned:     { label: 'Planned',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  'in-progress':{ label: 'In Progress', color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  paused:      { label: 'Paused',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  completed:   { label: 'Completed',   color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

const STATUSES: ProjectStatus[] = ['idea','planned','in-progress','paused','completed'];

export default function ProjectsPage() {
  const { projects, updateProject, removeProject } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState<Project | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ name: '', description: '', status: 'idea' as ProjectStatus, technologies: '', repoUrl: '', nextAction: '' });

  const filtered = filterStatus === 'all' ? projects : projects.filter((p) => p.status === filterStatus);

  const handleStatusChange = async (project: Project, status: ProjectStatus) => {
    await updateProject({ ...project, status });
  };

  const handleMilestoneToggle = async (project: Project, msId: string) => {
    await updateProject({
      ...project,
      milestones: project.milestones.map((m) => (m.id === msId ? { ...m, completed: !m.completed } : m)),
    });
  };

  const handleAddProject = async () => {
    if (!newForm.name.trim()) return;
    const proj: Project = {
      id: nanoid(),
      name: newForm.name.trim(),
      description: newForm.description.trim(),
      status: newForm.status,
      goals: [],
      tasks: [],
      milestones: [],
      technologies: newForm.technologies ? newForm.technologies.split(',').map((t) => t.trim()).filter(Boolean) : [],
      repoUrl: newForm.repoUrl.trim() || undefined,
      nextAction: newForm.nextAction.trim() || undefined,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await updateProject(proj);
    setShowAdd(false);
    setNewForm({ name: '', description: '', status: 'idea', technologies: '', repoUrl: '', nextAction: '' });
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            🚀 <span className="gradient-text">Innovation Projects</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            8 project ideas — plan, build, and track your portfolio.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus('all')}>
          All ({projects.length})
        </button>
        {STATUSES.map((s) => {
          const c = STATUS_CONFIG[s];
          const count = projects.filter((p) => p.status === s).length;
          return (
            <button
              key={s}
              className="btn btn-sm"
              style={{ background: filterStatus === s ? c.bg : 'var(--bg-surface)', color: filterStatus === s ? c.color : 'var(--text-secondary)', border: `1px solid ${filterStatus === s ? c.color + '50' : 'var(--border)'}` }}
              onClick={() => setFilterStatus(s)}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Project cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {filtered.map((project) => {
          const cfg = STATUS_CONFIG[project.status];
          const msDone = project.milestones.filter((m) => m.completed).length;
          const msTotal = project.milestones.length;
          const msPct = msTotal ? Math.round((msDone / msTotal) * 100) : 0;
          const isExp = expanded === project.id;

          return (
            <div key={project.id} className="card" style={{ borderLeft: `3px solid ${cfg.color}`, padding: 0, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{project.name}</h3>
                    <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontSize: '0.72rem' }}>{cfg.label}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{project.description}</p>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {project.technologies.slice(0, 4).map((t) => (
                      <span key={t} className="badge" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t}</span>
                    ))}
                    {project.repoUrl && (
                      <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="badge" style={{ background: 'var(--bg-surface-2)', color: '#818cf8', fontSize: '0.72rem', textDecoration: 'none' }}>
                        <ExternalLink size={10} /> Repo
                      </a>
                    )}
                  </div>

                  {msTotal > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div className="progress-bar-track" style={{ flex: 1, height: 4 }}>
                        <div className="progress-bar-fill" style={{ width: `${msPct}%`, background: cfg.color }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{msDone}/{msTotal}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowEdit(project)}>
                    <Edit3 size={14} />
                  </button>
                  {confirmDelete === project.id ? (
                    <>
                      <button className="btn btn-sm btn-danger" onClick={() => { removeProject(project.id); setConfirmDelete(null); }}>Delete</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm btn-icon" style={{ color: '#ef4444' }} onClick={() => setConfirmDelete(project.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setExpanded(isExp ? null : project.id)}>
                    {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expanded */}
              {isExp && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                  {/* Status selector */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        className="btn btn-sm"
                        style={{ background: project.status === s ? STATUS_CONFIG[s].bg : 'var(--bg-surface-2)', color: project.status === s ? STATUS_CONFIG[s].color : 'var(--text-muted)', border: `1px solid ${project.status === s ? STATUS_CONFIG[s].color + '40' : 'transparent'}` }}
                        onClick={() => handleStatusChange(project, s)}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>

                  {/* Goals */}
                  {project.goals.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals</p>
                      {project.goals.map((g, i) => (
                        <p key={i} style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: cfg.color }}>→</span> {g}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Milestones */}
                  {project.milestones.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Milestones</p>
                      {project.milestones.map((m) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <button
                            onClick={() => handleMilestoneToggle(project, m.id)}
                            style={{ width: 16, height: 16, borderRadius: '4px', border: `2px solid ${m.completed ? cfg.color : 'var(--border)'}`, background: m.completed ? cfg.color : 'transparent', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {m.completed && <span style={{ fontSize: '9px', color: 'white' }}>✓</span>}
                          </button>
                          <span style={{ fontSize: '0.83rem', color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: m.completed ? 'line-through' : 'none' }}>{m.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Next action */}
                  {project.nextAction && (
                    <div style={{ padding: '0.75rem', background: `${cfg.color}08`, border: `1px solid ${cfg.color}20`, borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.color, marginBottom: '0.25rem' }}>⚡ Next Action</p>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{project.nextAction}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {project.notes && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                      📝 {project.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <FolderOpen size={36} />
          <p style={{ fontWeight: 600, marginTop: '0.75rem' }}>No projects in this status</p>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <ProjectEditModal project={showEdit} onSave={(p) => { updateProject(p); setShowEdit(null); }} onClose={() => setShowEdit(null)} />
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Project">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div><label>Project Name *</label><input className="input" value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. MyAwesome App" /></div>
          <div><label>Description</label><textarea className="input" style={{ minHeight: '72px' }} value={newForm.description} onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label>Initial Status</label><select className="input select" value={newForm.status} onChange={(e) => setNewForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}</select></div>
            <div><label>Technologies (comma-separated)</label><input className="input" value={newForm.technologies} onChange={(e) => setNewForm((f) => ({ ...f, technologies: e.target.value }))} placeholder="React, Spring Boot, Python" /></div>
          </div>
          <div><label>Repo URL (optional)</label><input className="input" value={newForm.repoUrl} onChange={(e) => setNewForm((f) => ({ ...f, repoUrl: e.target.value }))} placeholder="https://github.com/..." /></div>
          <div><label>Next Action</label><input className="input" value={newForm.nextAction} onChange={(e) => setNewForm((f) => ({ ...f, nextAction: e.target.value }))} placeholder="e.g. Create wireframes" /></div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddProject}>Create Project</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ProjectEditModal({ project, onSave, onClose }: { project: Project; onSave: (p: Project) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
    technologies: project.technologies.join(', '),
    repoUrl: project.repoUrl ?? '',
    nextAction: project.nextAction ?? '',
    notes: project.notes ?? '',
    goals: project.goals.join('\n'),
  });

  const save = () => {
    onSave({
      ...project,
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      technologies: form.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      repoUrl: form.repoUrl.trim() || undefined,
      nextAction: form.nextAction.trim() || undefined,
      notes: form.notes.trim(),
      goals: form.goals.split('\n').map((g) => g.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit: ${project.name}`} maxWidth="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div><label>Name</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div><label>Description</label><textarea className="input" style={{ minHeight: '72px' }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div><label>Status</label><select className="input select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}</select></div>
          <div><label>Technologies</label><input className="input" value={form.technologies} onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))} /></div>
        </div>
        <div><label>Goals (one per line)</label><textarea className="input" style={{ minHeight: '72px' }} value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} placeholder="Improve visitor experience&#10;Digitize bookings" /></div>
        <div><label>Repo URL</label><input className="input" value={form.repoUrl} onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))} /></div>
        <div><label>Next Action</label><input className="input" value={form.nextAction} onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))} /></div>
        <div><label>Notes</label><textarea className="input" style={{ minHeight: '60px' }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save Changes</button>
        </div>
      </div>
    </Modal>
  );
}
