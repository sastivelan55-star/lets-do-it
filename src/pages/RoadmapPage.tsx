import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  CheckCircle2,
  ArrowRightLeft,
  Link2,
  ListTree
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { RoadmapMilestone, LearningSession, Task, LifeArea } from '../types';
import { nanoid } from '../utils/nanoid';
import { today } from '../utils/dates';
import TaskAssignmentModal from '../components/tasks/TaskAssignmentModal';
import Modal from '../components/ui/Modal';

const MONTH_COLORS = [
  '#6366f1', '#60a5fa', '#a78bfa', '#f59e0b',
  '#10b981', '#06b6d4', '#ec4899', '#f97316',
];

const STATUS_OPTS: { value: RoadmapMilestone['status']; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
];

export default function RoadmapPage() {
  const {
    milestones,
    updateMilestone,
    tasks,
    addTask,
    updateTask,
    completeTask,
    removeTask,
    assignTask,
    customLifeAreas,
  } = useApp();

  const [expanded, setExpanded] = useState<string | null>(
    milestones.find((m) => m.status === 'in-progress')?.id ?? milestones[0]?.id ?? null
  );
  const [sessionForm, setSessionForm] = useState<string | null>(null);
  const [assignExistingMonth, setAssignExistingMonth] = useState<number | null>(null);

  // Overall progress includes both milestone subtasks and roadmap tasks
  const roadmapTasks = tasks.filter((t) => t.roadmapMonth != null);
  const completedRoadmapTasks = roadmapTasks.filter((t) => t.status === 'completed');

  const totalMilestoneSubtasks = milestones.reduce((s, m) => s + m.subtasks.length, 0);
  const completedMilestoneSubtasks = milestones.reduce((s, m) => s + m.subtasks.filter((st) => st.completed).length, 0);

  const totalItems = totalMilestoneSubtasks + roadmapTasks.length;
  const completedItems = completedMilestoneSubtasks + completedRoadmapTasks.length;
  const overallPct = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="page-container pb-safe">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          🗺️ <span className="gradient-text">Personal Learning & Milestone Roadmap</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Fully editable monthly roadmap. Add, edit, reorder tasks, nested subtasks, and track completion seamlessly.
        </p>

        {/* Overall progress */}
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Overall Progress</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 700 }}>{overallPct}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {completedItems}/{totalItems} items completed
          </span>
        </div>
      </div>

      {/* Daily habits anchor */}
      <div
        style={{
          background: 'rgba(99,102,241,0.07)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '12px',
          padding: '0.9rem 1.1rem',
          marginBottom: '1.25rem',
          fontSize: '0.83rem',
          color: 'var(--text-secondary)',
        }}
      >
        📌 <strong>Daily Execution Pillars:</strong> Core practice (DSA/Coding 2+ hrs) · GitHub commits · Technical notes · Communication practice · Weekly review.
      </div>

      {/* Milestone Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {milestones.map((m, i) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            tasks={tasks}
            customLifeAreas={customLifeAreas}
            color={MONTH_COLORS[i % MONTH_COLORS.length]}
            isExpanded={expanded === m.id}
            onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
            onUpdateMilestone={updateMilestone}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onCompleteTask={completeTask}
            onRemoveTask={removeTask}
            onAssignExisting={() => setAssignExistingMonth(m.month)}
            showSessionForm={sessionForm === m.id}
            onToggleSessionForm={() => setSessionForm(sessionForm === m.id ? null : m.id)}
          />
        ))}
      </div>

      {/* Assign Existing Tasks Modal */}
      {assignExistingMonth != null && (
        <AssignExistingTaskModal
          targetMonth={assignExistingMonth}
          tasks={tasks}
          onAssign={async (taskId) => {
            await assignTask(taskId, { roadmapMonth: assignExistingMonth });
            setAssignExistingMonth(null);
          }}
          onClose={() => setAssignExistingMonth(null)}
        />
      )}
    </div>
  );
}

function MilestoneCard({
  milestone,
  tasks,
  customLifeAreas,
  color,
  isExpanded,
  onToggle,
  onUpdateMilestone,
  onAddTask,
  onUpdateTask,
  onCompleteTask,
  onRemoveTask,
  onAssignExisting,
  showSessionForm,
  onToggleSessionForm,
}: {
  milestone: RoadmapMilestone;
  tasks: Task[];
  customLifeAreas: any[];
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateMilestone: (m: RoadmapMilestone) => void;
  onAddTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  onUpdateTask: (task: Task) => Promise<any>;
  onCompleteTask: (id: string) => Promise<any>;
  onRemoveTask: (id: string) => Promise<any>;
  onAssignExisting: () => void;
  showSessionForm: boolean;
  onToggleSessionForm: () => void;
}) {
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);
  const [editedTitle, setEditedTitle] = useState(milestone.title);
  const [editedDesc, setEditedDesc] = useState(milestone.description);

  // New Monthly Task inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskArea, setNewTaskArea] = useState<LifeArea>('technical');
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState('30');
  const [sessionNotes, setSessionNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(milestone.notes ?? '');

  // Subtask under monthly task
  const [parentForSubtask, setParentForSubtask] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Moving task modal
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);

  // Tasks belonging to this month
  const monthlyTasks = tasks.filter((t) => t.roadmapMonth === milestone.month && !t.parentId);
  const completedMonthlyTasks = monthlyTasks.filter((t) => t.status === 'completed');

  const completedSubtasks = milestone.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = milestone.subtasks.length;

  const totalMonthItems = totalSubtasks + monthlyTasks.length;
  const completedMonthItems = completedSubtasks + completedMonthlyTasks.length;
  const pct = totalMonthItems ? Math.round((completedMonthItems / totalMonthItems) * 100) : 0;

  const handleSaveMilestoneDetails = () => {
    onUpdateMilestone({
      ...milestone,
      title: editedTitle.trim() || milestone.title,
      description: editedDesc.trim(),
    });
    setIsEditingMilestone(false);
  };

  const handleAddMonthlyTask = async () => {
    if (!newTaskTitle.trim()) return;
    await onAddTask({
      title: newTaskTitle.trim(),
      lifeArea: newTaskArea,
      roadmapMonth: milestone.month,
      dueDate: today(),
      priority: 'medium',
      status: 'not-started',
    });
    setNewTaskTitle('');
  };

  const handleAddNestedSubtask = async (parentId: string) => {
    if (!newSubtaskTitle.trim()) return;
    const parent = tasks.find((t) => t.id === parentId);
    await onAddTask({
      title: newSubtaskTitle.trim(),
      parentId,
      lifeArea: parent?.lifeArea || 'technical',
      roadmapMonth: milestone.month,
      dueDate: parent?.dueDate || today(),
      priority: 'medium',
      status: 'not-started',
    });
    setNewSubtaskTitle('');
    setParentForSubtask(null);
  };

  const handleRemoveFromMonth = async (task: Task) => {
    // Unassign from month without deleting the task!
    await onUpdateTask({
      ...task,
      roadmapMonth: undefined,
    });
  };

  const toggleLegacySubtask = (stId: string) => {
    onUpdateMilestone({
      ...milestone,
      subtasks: milestone.subtasks.map((s) =>
        s.id === stId ? { ...s, completed: !s.completed } : s
      ),
    });
  };

  const removeLegacySubtask = (stId: string) => {
    onUpdateMilestone({
      ...milestone,
      subtasks: milestone.subtasks.filter((s) => s.id !== stId),
    });
  };

  const changeStatus = (status: RoadmapMilestone['status']) => {
    onUpdateMilestone({ ...milestone, status });
  };

  const addSession = () => {
    if (!sessionTopic.trim()) return;
    const session: LearningSession = {
      id: nanoid(),
      date: today(),
      topic: sessionTopic.trim(),
      minutes: Number(sessionMinutes) || 30,
      notes: sessionNotes.trim() || undefined,
    };
    onUpdateMilestone({ ...milestone, learningSessions: [...milestone.learningSessions, session] });
    setSessionTopic('');
    setSessionMinutes('30');
    setSessionNotes('');
    onToggleSessionForm();
  };

  const removeSession = (sessId: string) => {
    onUpdateMilestone({
      ...milestone,
      learningSessions: milestone.learningSessions.filter((s) => s.id !== sessId),
    });
  };

  const saveNotes = () => {
    onUpdateMilestone({ ...milestone, notes: notesValue });
    setEditingNotes(false);
  };

  const totalSessionMinutes = milestone.learningSessions.reduce((s, sess) => s + sess.minutes, 0);

  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${color}`,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* Month Card Header */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(0.5rem, 2.5vw, 1rem)',
          padding: 'clamp(0.75rem, 2.5vw, 1rem) clamp(0.75rem, 3vw, 1.25rem)',
          background: 'none',
          textAlign: 'left',
          flexWrap: 'wrap',
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        {/* Month number */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            background: `${color}20`,
            color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: '0.62rem', fontWeight: 600 }}>Month</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{milestone.month}</span>
        </div>

        {/* Title + Progress Bar */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {milestone.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="progress-bar-track" style={{ flex: 1, height: 6 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              {completedMonthItems}/{totalMonthItems} items ({pct}%)
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`badge status-${milestone.status}`} style={{ flexShrink: 0, fontSize: '0.72rem' }}>
          {milestone.status === 'not-started' ? '○ Not started'
            : milestone.status === 'in-progress' ? '◉ In progress'
            : '✓ Completed'}
        </span>

        <button
          className="btn btn-ghost btn-icon btn-sm"
          style={{ color: 'var(--text-muted)' }}
          aria-label={isExpanded ? 'Collapse month' : 'Expand month'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Month Workspace */}
      {isExpanded && (
        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          {/* Milestone Description and Edit button */}
          <div style={{ margin: '1rem 0 0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            {!isEditingMilestone ? (
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>
                {milestone.description}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <input
                  className="input"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Milestone Title"
                />
                <textarea
                  className="input"
                  rows={2}
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  placeholder="Milestone Description"
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveMilestoneDetails}>Save Milestone</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingMilestone(false)}>Cancel</button>
                </div>
              </div>
            )}

            {!isEditingMilestone && (
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => {
                  setEditedTitle(milestone.title);
                  setEditedDesc(milestone.description);
                  setIsEditingMilestone(true);
                }}
                title="Edit Milestone Title and Description"
              >
                <Edit3 size={13} />
              </button>
            )}
          </div>

          {/* Status changer */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {STATUS_OPTS.map((opt) => (
              <button
                key={opt.value}
                className={`btn btn-sm ${milestone.status === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => changeStatus(opt.value)}
                style={{ fontSize: '0.75rem' }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Monthly Tasks Section (Integrated with AppContext Task Records) */}
          <div style={{ marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ListTree size={14} /> Month {milestone.month} Tasks ({monthlyTasks.length})
              </span>
              <button
                className="btn btn-secondary btn-xs"
                onClick={onAssignExisting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
              >
                <Link2 size={12} /> Assign Existing Task
              </button>
            </div>

            {/* List of Tasks Assigned to this Month */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {monthlyTasks.map((t) => {
                const isCompleted = t.status === 'completed';
                const subtasks = tasks.filter((sub) => sub.parentId === t.id);

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
                            border: `2px solid ${isCompleted ? color : 'var(--border)'}`,
                            background: isCompleted ? color : 'transparent',
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
                        {/* Add subtask */}
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => setParentForSubtask(parentForSubtask === t.id ? null : t.id)}
                          style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          title="Add nested subtask"
                        >
                          <Plus size={11} /> Subtask
                        </button>

                        {/* Move task */}
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => setTaskToMove(t)}
                          style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#818cf8' }}
                          title="Move to another month or area"
                        >
                          <ArrowRightLeft size={11} /> Move
                        </button>

                        {/* Remove from Month (unassign without deleting) */}
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleRemoveFromMonth(t)}
                          style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
                          title="Remove from Month (keeps task in Task Builder)"
                        >
                          Unassign
                        </button>

                        {/* Delete permanently */}
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

                    {/* Nested subtasks */}
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
                                  border: `1px solid ${st.status === 'completed' ? color : 'var(--border)'}`,
                                  background: st.status === 'completed' ? color : 'transparent',
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
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNestedSubtask(t.id)}
                          autoFocus
                        />
                        <button className="btn btn-primary btn-xs" onClick={() => handleAddNestedSubtask(t.id)}>
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

            {/* Quick Add Task to this Month */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 180, fontSize: '0.82rem' }}
                placeholder={`+ Add task for Month ${milestone.month}…`}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMonthlyTask()}
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
              <button className="btn btn-primary btn-sm" onClick={handleAddMonthlyTask}>
                <Plus size={14} /> Add Task
              </button>
            </div>
          </div>

          {/* Subtasks / Curriculum Milestones */}
          {milestone.subtasks.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Curriculum Subtasks ({completedSubtasks}/{milestone.subtasks.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {milestone.subtasks.map((st) => (
                  <div
                    key={st.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.45rem 0.75rem',
                      background: st.completed ? `${color}08` : 'var(--bg-surface-2)',
                      borderRadius: '8px',
                      border: `1px solid ${st.completed ? color + '25' : 'transparent'}`,
                    }}
                  >
                    <button
                      onClick={() => toggleLegacySubtask(st.id)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '4px',
                        border: `2px solid ${st.completed ? color : 'var(--border)'}`,
                        background: st.completed ? color : 'transparent',
                        flexShrink: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {st.completed && <CheckCircle2 size={10} color="white" />}
                    </button>
                    <span
                      style={{
                        flex: 1,
                        fontSize: '0.84rem',
                        color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: st.completed ? 'line-through' : 'none',
                      }}
                    >
                      {st.title}
                    </span>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => removeLegacySubtask(st.id)}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Sessions Log */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Learning Sessions ({totalSessionMinutes}m logged)
              </span>
              <button className="btn btn-sm btn-secondary" onClick={onToggleSessionForm}>
                <BookOpen size={12} /> Log Session
              </button>
            </div>

            {showSessionForm && (
              <div
                style={{
                  background: 'var(--bg-surface-2)',
                  borderRadius: '10px',
                  padding: '0.875rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                <input className="input" placeholder="Topic / What did you study?" value={sessionTopic} onChange={(e) => setSessionTopic(e.target.value)} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" type="number" placeholder="Minutes" value={sessionMinutes} onChange={(e) => setSessionMinutes(e.target.value)} min={1} />
                  <input className="input" placeholder="Notes (optional)" value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-primary" onClick={addSession}>Save Session</button>
                  <button className="btn btn-sm btn-ghost" onClick={onToggleSessionForm}>Cancel</button>
                </div>
              </div>
            )}

            {milestone.learningSessions.slice(-4).reverse().map((sess) => (
              <div key={sess.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{sess.date}</span>
                <span style={{ flex: 1, minWidth: 0, color: 'var(--text-primary)' }}>{sess.topic}</span>
                <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{sess.minutes}m</span>
                <button
                  className="btn btn-ghost btn-icon btn-xs"
                  style={{ color: '#ef4444' }}
                  onClick={() => removeSession(sess.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Milestone Notes
              </span>
              {!editingNotes && (
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingNotes(true); setNotesValue(milestone.notes ?? ''); }}>
                  <Edit3 size={12} />
                </button>
              )}
            </div>
            {editingNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  className="input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Notes, resources, links for this month…"
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-primary" onClick={saveNotes}>Save Notes</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditingNotes(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.83rem', color: milestone.notes ? 'var(--text-secondary)' : 'var(--text-muted)', fontStyle: milestone.notes ? 'normal' : 'italic' }}>
                {milestone.notes || 'No notes yet. Click edit to add.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Task Assignment Modal for moving tasks between months */}
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

// Modal for picking an existing task to assign to the month
function AssignExistingTaskModal({
  targetMonth,
  tasks,
  onAssign,
  onClose,
}: {
  targetMonth: number;
  tasks: Task[];
  onAssign: (taskId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const availableTasks = tasks.filter(
    (t) => t.roadmapMonth !== targetMonth && !t.parentId && t.status !== 'completed'
  );

  const filtered = availableTasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={`Assign Existing Task to Month ${targetMonth}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <input
          className="input"
          placeholder="Search unassigned tasks…"
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
                  Assign to Month {targetMonth}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
