import React, { useState } from 'react';
import {
  CheckCircle2,
  ListTree,
  FileText,
  FolderOpen,
  Lightbulb,
  AlertCircle,
  Send,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { today } from '../../utils/dates';
import { nanoid } from '../../utils/nanoid';
import type { LifeArea, TaskPriority, ProjectStatus, Project } from '../../types';

export type QuickCaptureType = 'task' | 'note' | 'project' | 'idea';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: QuickCaptureType;
  onSuccessNavigate?: (destination: string) => void;
}

export default function QuickCaptureModal({
  isOpen,
  onClose,
  initialType = 'task',
  onSuccessNavigate,
}: QuickCaptureModalProps) {
  const { customLifeAreas, addTask, addNote, updateProject } = useApp();
  const availableAreas = customLifeAreas.filter((a) => a.isEnabled !== false);
  const defaultArea = (availableAreas[0]?.id as LifeArea) || 'technical';

  const [activeType, setActiveType] = useState<QuickCaptureType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskArea, setTaskArea] = useState<LifeArea>(defaultArea);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState(today());
  const [taskEstMinutes, setTaskEstMinutes] = useState('30');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');

  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectPriority, setProjectPriority] = useState<TaskPriority>('high');

  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaNotes, setIdeaNotes] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setTaskTitle('');
    setNoteTitle('');
    setNoteContent('');
    setProjectName('');
    setProjectDesc('');
    setIdeaTitle('');
    setIdeaNotes('');
    setErrorMessage(null);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setErrorMessage('Please enter a task title.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const minutesNum = taskEstMinutes ? parseInt(taskEstMinutes, 10) : undefined;
      await addTask({
        title: taskTitle.trim(),
        lifeArea: taskArea,
        priority: taskPriority,
        dueDate: taskDueDate || today(),
        status: 'not-started',
        estimatedMinutes: !isNaN(minutesNum as number) && (minutesNum as number) >= 0 ? minutesNum : undefined,
        orderIndex: 0,
        parentId: null,
      });
      setSuccessBanner('Task captured successfully!');
      setTimeout(() => {
        resetForm();
        onClose();
        onSuccessNavigate?.('tasks');
      }, 700);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to capture task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      setErrorMessage('Please enter a note title.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await addNote({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        category: noteCategory.trim() || 'General',
        isPinned: false,
      });
      setSuccessBanner('Note saved to Knowledge repository!');
      setTimeout(() => {
        resetForm();
        onClose();
        onSuccessNavigate?.('knowledge');
      }, 700);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setErrorMessage('Please enter a project name.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const newProj: Project = {
        id: nanoid(),
        name: projectName.trim(),
        description: projectDesc.trim(),
        status: 'planned' as ProjectStatus,
        priority: projectPriority,
        startDate: today(),
        goals: [],
        tasks: [],
        milestones: [],
        technologies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await updateProject(newProj);
      setSuccessBanner('Project initialized in Portfolio!');
      setTimeout(() => {
        resetForm();
        onClose();
        onSuccessNavigate?.('journey');
      }, 700);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) {
      setErrorMessage('Please enter an idea title.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await addNote({
        title: ideaTitle.trim(),
        content: ideaNotes.trim(),
        category: 'Projects & Ideas',
        isPinned: false,
      });
      setSuccessBanner('Idea captured into Projects & Ideas!');
      setTimeout(() => {
        resetForm();
        onClose();
        onSuccessNavigate?.('knowledge');
      }, 700);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to capture idea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚡ Universal Quick Capture" maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Type Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}
        >
          {[
            { id: 'task', label: 'Task', icon: <ListTree size={14} />, color: '#38bdf8' },
            { id: 'note', label: 'Note', icon: <FileText size={14} />, color: '#c084fc' },
            { id: 'project', label: 'Project', icon: <FolderOpen size={14} />, color: '#f97316' },
            { id: 'idea', label: 'Idea', icon: <Lightbulb size={14} />, color: '#eab308' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setActiveType(item.id as QuickCaptureType);
                setErrorMessage(null);
              }}
              style={{
                flex: 1,
                fontSize: '0.8rem',
                justifyContent: 'center',
                gap: '6px',
                background: activeType === item.id ? 'var(--bg-surface-3)' : 'transparent',
                borderColor: activeType === item.id ? item.color : 'transparent',
                color: activeType === item.id ? item.color : 'var(--text-secondary)',
                fontWeight: activeType === item.id ? 700 : 500,
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            style={{
              padding: '0.6rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success toast */}
        {successBanner && (
          <div
            style={{
              padding: '0.6rem 0.85rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#34d399',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Form: Task */}
        {activeType === 'task' && (
          <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Task Title *
              </label>
              <input
                type="text"
                className="input"
                placeholder="What action needs to be executed?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Life Area
                </label>
                <select
                  className="input"
                  value={taskArea}
                  onChange={(e) => setTaskArea(e.target.value as LifeArea)}
                >
                  {availableAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Priority
                </label>
                <select
                  className="input"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                >
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🔵 Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Est. Minutes
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="30"
                  min="0"
                  value={taskEstMinutes}
                  onChange={(e) => setTaskEstMinutes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                <Send size={14} /> {isSubmitting ? 'Saving…' : 'Capture Task'}
              </button>
            </div>
          </form>
        )}

        {/* Form: Note */}
        {activeType === 'note' && (
          <form onSubmit={handleNoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Note Title *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Title or summary of insight…"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Category
              </label>
              <select
                className="input"
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
              >
                <option value="General">General Personal</option>
                <option value="Technical & DSA">Technical & DSA</option>
                <option value="System Design">System Design</option>
                <option value="Career & Interview">Career & Interview</option>
                <option value="Personal Reflection">Personal Reflection</option>
                <option value="Projects & Ideas">Projects & Ideas</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Content & Takeaways
              </label>
              <textarea
                className="input"
                rows={4}
                placeholder="Write your notes, code snippets, or thoughts…"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                <Send size={14} /> {isSubmitting ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </form>
        )}

        {/* Form: Project */}
        {activeType === 'project' && (
          <form onSubmit={handleProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Project Name *
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Life OS Web Platform, AI Compiler…"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Priority
              </label>
              <select
                className="input"
                value={projectPriority}
                onChange={(e) => setProjectPriority(e.target.value as TaskPriority)}
              >
                <option value="critical">Critical Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Description & Vision
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="High-level goal, architectural objectives, and deliverables…"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                <Send size={14} /> {isSubmitting ? 'Saving…' : 'Initialize Project'}
              </button>
            </div>
          </form>
        )}

        {/* Form: Idea */}
        {activeType === 'idea' && (
          <form onSubmit={handleIdeaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Idea Concept *
              </label>
              <input
                type="text"
                className="input"
                placeholder="What sparks your curiosity?"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Notes & Potential Angles
              </label>
              <textarea
                className="input"
                rows={4}
                placeholder="Quick brain dump, references, links, or follow-up thoughts…"
                value={ideaNotes}
                onChange={(e) => setIdeaNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                <Send size={14} /> {isSubmitting ? 'Saving…' : 'Capture Idea'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
