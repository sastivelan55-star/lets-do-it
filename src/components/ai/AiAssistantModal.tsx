import { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { today } from '../../utils/dates';
import {
  checkAiConfig,
  parseNaturalLanguageTask,
  executeAiAction,
  type AiTaskAction,
  type AiStatusResult
} from '../../services/aiService';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXAMPLE_PROMPTS = [
  'Create a task to practise Python loops and assign it to Technical',
  'Move my resume polish task to Career Readiness',
  'Add 3 subtasks to practice algorithms',
  'Schedule DSA practice for tomorrow',
  'Move all overdue tasks to tomorrow',
];

export default function AiAssistantModal({ isOpen, onClose }: AiAssistantModalProps) {
  const {
    tasks,
    customLifeAreas,
    projects,
    addTask,
    updateTask,
    assignTask,
    rescheduleTask,
    settings,
  } = useApp();

  const [prompt, setPrompt] = useState('');
  const [configStatus, setConfigStatus] = useState<AiStatusResult | null>(null);
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [parsedAction, setParsedAction] = useState<AiTaskAction | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmedBulk, setConfirmedBulk] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setIsCheckingConfig(true);
    try {
      const res = await checkAiConfig();
      setConfigStatus(res);
    } finally {
      setIsCheckingConfig(false);
    }
  };

  if (!isOpen) return null;

  const activeProvider = settings.aiSettings?.provider || (configStatus?.providerConfigured?.gemini ? 'gemini' : 'openai');
  const activeModel = settings.aiSettings?.model || (activeProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
  const isConfigured = Boolean(
    configStatus?.providerConfigured?.openai || configStatus?.providerConfigured?.gemini
  );

  const handleParse = async (overridePrompt?: string) => {
    const textToSubmit = overridePrompt || prompt;
    if (!textToSubmit.trim()) return;

    setIsParsing(true);
    setParsedAction(null);
    setFeedback(null);
    setConfirmedBulk(false);

    try {
      const res = await parseNaturalLanguageTask(
        textToSubmit,
        {
          today: today(),
          tasks,
          areas: customLifeAreas.map((a) => ({ id: a.id, name: a.name })),
          projects: projects.map((p) => ({ id: p.id, name: p.name })),
        },
        activeProvider,
        activeModel
      );

      if (!res.success || !res.action) {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to interpret instruction. Check your AI provider settings.',
        });
      } else {
        setParsedAction(res.action);
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecute = async () => {
    if (!parsedAction) return;

    if (parsedAction.needsConfirmation && !confirmedBulk) {
      setConfirmedBulk(true);
      return;
    }

    setIsExecuting(true);
    setFeedback(null);

    try {
      const result = await executeAiAction(parsedAction, {
        addTask,
        updateTask,
        assignTask,
        rescheduleTask,
        tasks,
        today: today(),
      });

      if (result.success) {
        setFeedback({ type: 'success', message: result.message });
        setParsedAction(null);
        setPrompt('');
      } else {
        setFeedback({ type: 'error', message: result.message });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `Execution failed: ${msg}` });
    } finally {
      setIsExecuting(false);
      setConfirmedBulk(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Life OS AI Task Assistant" maxWidth="620px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Status / Model Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-2)',
            padding: '0.6rem 0.85rem',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            fontSize: '0.8rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={15} color="#818cf8" />
            <span style={{ color: 'var(--text-secondary)' }}>Active Provider:</span>
            <span style={{ fontWeight: 700, color: '#818cf8', textTransform: 'capitalize' }}>
              {activeProvider} ({activeModel})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isConfigured ? '#10b981' : '#f59e0b',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: isConfigured ? '#10b981' : '#f59e0b' }}>
              {isConfigured ? 'Keys Configured' : 'No Server Keys Configured'}
            </span>
            <button
              onClick={checkStatus}
              className="btn btn-ghost btn-icon btn-xs"
              title="Refresh connection status"
              disabled={isCheckingConfig}
              style={{ padding: '2px', width: '20px', height: '20px' }}
            >
              <RefreshCw size={11} className={isCheckingConfig ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Unconfigured Warning Notice */}
        {!isConfigured && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '8px',
              padding: '0.75rem 0.9rem',
              fontSize: '0.82rem',
              color: '#f59e0b',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Secure Server-Side Setup Required</strong>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                Set <code>OPENAI_API_KEY</code> or <code>GEMINI_API_KEY</code> in your Vercel Project Environment Variables (or local <code>.env</code> file). Frontend code never exposes secret API keys.
              </p>
            </div>
          </div>
        )}

        {/* Natural Language Prompt Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            What would you like Life OS to do?
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Create a task to review Spring Boot security notes and assign it to Technical Mastery for tomorrow…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleParse();
                }
              }}
              style={{ paddingRight: '2.5rem', resize: 'vertical', fontSize: '0.86rem' }}
            />
            <button
              type="button"
              onClick={() => handleParse()}
              disabled={isParsing || !prompt.trim()}
              className="btn btn-primary btn-sm"
              style={{
                position: 'absolute',
                right: '8px',
                bottom: '10px',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
              }}
              title="Parse instruction with AI"
            >
              {isParsing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>

        {/* Quick Example Chips */}
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Quick instructions to try:
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setPrompt(ex);
                  handleParse(ex);
                }}
                className="btn btn-ghost btn-xs"
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  textAlign: 'left',
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Parsed Action Interpretation / Preview */}
        {parsedAction && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '10px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={12} /> AI Action Interpretation
              </span>
              <span className={`badge badge-info`} style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>
                {parsedAction.intent}
              </span>
            </div>

            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {parsedAction.explanation}
            </p>

            {/* Action Details preview */}
            {parsedAction.actionParams && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', background: 'var(--bg-surface)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                {parsedAction.actionParams.taskTitle && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>Task:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{parsedAction.actionParams.taskTitle}</strong>
                  </div>
                )}
                {parsedAction.actionParams.lifeArea && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>Life Area:</span>
                    <span style={{ color: '#818cf8', fontWeight: 600, textTransform: 'capitalize' }}>{parsedAction.actionParams.lifeArea}</span>
                  </div>
                )}
                {parsedAction.actionParams.dueDate && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>Due Date:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{parsedAction.actionParams.dueDate}</span>
                  </div>
                )}
                {parsedAction.actionParams.targetMonth && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>Roadmap:</span>
                    <span style={{ color: '#38bdf8' }}>Month {parsedAction.actionParams.targetMonth}</span>
                  </div>
                )}
                {parsedAction.actionParams.subtasks && parsedAction.actionParams.subtasks.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>Subtasks:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {parsedAction.actionParams.subtasks.join(' · ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Ambiguity or clarification needed */}
            {parsedAction.intent === 'clarify' && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#f59e0b', fontSize: '0.82rem' }}>
                <HelpCircle size={15} />
                <span>{parsedAction.clarificationQuestion || 'Please provide more details to clarify the target task.'}</span>
              </div>
            )}

            {/* Confirmation warning for bulk actions */}
            {parsedAction.needsConfirmation && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#f59e0b' }}>
                ⚠️ <strong>Confirmation Required:</strong> {parsedAction.confirmationMessage || 'This operation will affect multiple records. Please confirm to proceed.'}
              </div>
            )}

            {/* Action Execution Button */}
            {parsedAction.intent !== 'clarify' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setParsedAction(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${parsedAction.needsConfirmation && !confirmedBulk ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleExecute}
                  disabled={isExecuting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving to Database…</span>
                    </>
                  ) : parsedAction.needsConfirmation && !confirmedBulk ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Confirm & Execute</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Approve & Execute</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Execution Feedback Banner */}
        {feedback && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: feedback.type === 'success' ? '#10b981' : '#f87171',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
