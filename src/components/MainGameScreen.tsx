import { useState, useEffect, useRef, useCallback } from 'react';
import type { Task } from '@/types/task';
import { TASKS } from '@/data/tasks';
import { validateTask } from '@/utils/validateTask';
import CodeEditor from '@/components/editor/CodeEditor';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MainGameScreenProps {
  playerName: string;
  round: number;
  category: string;
  role: 'engineer' | 'intern';
  onEmergency: () => void;
  onTimerEnd: () => void;
}

type SubmitStatus = 'idle' | 'correct' | 'incorrect';

interface PlayerEntry {
  name: string;
  status: 'ALIVE' | 'EJECTED';
}

// ── Static data ───────────────────────────────────────────────────────────────

const PLAYERS_DATA: PlayerEntry[] = [
  { name: '', status: 'ALIVE' },
  { name: 'CIPHER', status: 'ALIVE' },
  { name: 'NULLPTR', status: 'ALIVE' },
  { name: 'STACK0F', status: 'ALIVE' },
];

const CHAT_MESSAGES = [
  { user: 'CIPHER', text: 'ANYONE NOTICE ANYTHING SUS?' },
  { user: 'NULLPTR', text: 'ALL CLEAR ON MY END' },
  { user: 'STACK0F', text: 'FOCUS ON TASKS PEOPLE' },
  { user: 'CIPHER', text: 'STACK0F IS QUIET...' },
  { user: 'NULLPTR', text: 'I SAW SOMEONE NEAR THE SERVER ROOM' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the first task from TASKS that hasn't been completed yet.
 * Returns null when all tasks are done.
 */
const getNextTask = (completedIds: string[]): Task | null =>
  TASKS.find((t) => !completedIds.includes(t.id)) ?? null;

// ── Component ─────────────────────────────────────────────────────────────────

const MainGameScreen: React.FC<MainGameScreenProps> = ({
  playerName,
  round,
  category,
  role,
  onEmergency,
  onTimerEnd,
}) => {
  // ── Task state ──────────────────────────────────────────────────────────────
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(() => getNextTask([]));
  const [editorCode, setEditorCode] = useState<string>(
    () => getNextTask([])?.starterCode ?? ''
  );
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');

  // ── Game / UI state ─────────────────────────────────────────────────────────
  const [timer, setTimer] = useState(60);
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [players] = useState<PlayerEntry[]>(() =>
    PLAYERS_DATA.map((p) => ({ ...p, name: p.name || playerName }))
  );
  const chatRef = useRef<HTMLDivElement>(null);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onTimerEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onTimerEnd]);

  // ── Simulated incoming chat ─────────────────────────────────────────────────
  useEffect(() => {
    const timers = CHAT_MESSAGES.map((msg, i) =>
      setTimeout(() => {
        setChatMessages((m) => [...m, msg]);
      }, 5000 + i * 8000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [chatMessages]);

  // ── Task handlers ───────────────────────────────────────────────────────────

  const handleEditorChange = useCallback((value: string) => {
    setEditorCode(value);
    // Clear feedback as soon as the player edits
    setSubmitStatus('idle');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!currentTask) return;

    const isCorrect = validateTask(editorCode, currentTask.solution);

    if (isCorrect) {
      const nextCompleted = [...completedTaskIds, currentTask.id];
      setCompletedTaskIds(nextCompleted);
      setSubmitStatus('correct');

      const next = getNextTask(nextCompleted);
      // Short delay so the player sees the ✓ feedback before the next task loads
      setTimeout(() => {
        setCurrentTask(next);
        setEditorCode(next?.starterCode ?? '');
        setSubmitStatus('idle');
      }, 1000);
    } else {
      setSubmitStatus('incorrect');
    }
  }, [currentTask, editorCode, completedTaskIds]);

  const handleChatSend = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages((m) => [
      ...m,
      { user: playerName, text: chatInput.toUpperCase() },
    ]);
    setChatInput('');
  }, [chatInput, playerName]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const allTasksDone = currentTask === null;
  const taskProgress = `${completedTaskIds.length}/${TASKS.length}`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col font-mono text-sm">

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between mb-3 pb-2"
        style={{ borderBottom: '1px solid var(--crt-dim)' }}
      >
        <span className="crt-glow font-terminal text-lg">
          ROUND {round}/3 — {category}
        </span>
        <span className={`font-terminal text-xl ${timer <= 10 ? 'crt-glow-red' : 'crt-glow'}`}>
          {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
        </span>
        <button
          className="crt-button crt-button-red text-xs px-3 py-1"
          onClick={onEmergency}
        >
          ⚠ EMERGENCY_MEETING
        </button>
      </div>

      {/* ── 3-column layout ── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* ── LEFT: Crew ── */}
        <div className="w-44 flex-shrink-0 flex flex-col">
          <p className="font-terminal mb-2" style={{ color: 'var(--crt-dim)' }}>
            ┌─ CREW ─┐
          </p>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div
                key={i}
                className="ascii-box py-1 px-2"
                style={{
                  borderColor: p.status === 'ALIVE' ? 'var(--crt-dim)' : 'transparent',
                  opacity: p.status === 'ALIVE' ? 1 : 0.3,
                }}
              >
                <p className={`font-terminal ${p.name === playerName ? 'crt-glow-accent' : 'crt-glow'}`}>
                  {p.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: p.status === 'ALIVE' ? 'var(--crt-dim)' : 'var(--crt-red)' }}
                >
                  [{p.status}]
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs" style={{ color: 'var(--crt-dim)' }}>
            <p>
              ROLE:{' '}
              <span className={role === 'engineer' ? 'crt-glow' : 'crt-glow-red'}>
                {role.toUpperCase()}
              </span>
            </p>
          </div>

          {/* Task progress summary */}
          <div
            className="mt-auto pt-3 text-xs"
            style={{ color: 'var(--crt-dim)', borderTop: '1px solid var(--crt-dim)' }}
          >
            <p className="font-terminal mb-1">┌─ TASKS ─┐</p>
            {TASKS.map((t) => {
              const done = completedTaskIds.includes(t.id);
              const active = currentTask?.id === t.id;
              return (
                <div key={t.id} className="flex items-center gap-1 py-0.5">
                  <span style={{ color: done ? 'var(--crt-green)' : active ? 'var(--crt-accent)' : 'var(--crt-dim)' }}>
                    {done ? '[✓]' : active ? '[▶]' : '[ ]'}
                  </span>
                  <span
                    className="truncate"
                    style={{
                      color: done ? 'var(--crt-dim)' : active ? 'var(--crt-accent)' : 'var(--crt-dim)',
                      textDecoration: done ? 'line-through' : 'none',
                      maxWidth: '110px',
                    }}
                    title={t.title}
                  >
                    {t.title}
                  </span>
                </div>
              );
            })}
            <p className="mt-1 crt-glow">DONE: {taskProgress}</p>
          </div>
        </div>

        {/* ── CENTER: Task + Monaco Editor ── */}
        <div className="flex-1 flex flex-col min-w-0 gap-2">

          {allTasksDone ? (
            /* All tasks completed banner */
            <div
              className="flex-1 ascii-box flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <p className="font-terminal text-2xl crt-glow-accent">ALL TASKS COMPLETE</p>
              <p style={{ color: 'var(--crt-dim)' }}>Waiting for emergency meeting...</p>
            </div>
          ) : (
            <>
              {/* Task description panel */}
              <div className="ascii-box p-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-terminal crt-glow-accent text-base">
                    {currentTask?.title}
                  </p>
                  <span className="text-xs" style={{ color: 'var(--crt-dim)' }}>
                    {taskProgress} COMPLETE
                  </span>
                </div>
                <pre
                  className="text-xs whitespace-pre-wrap"
                  style={{ color: 'var(--crt-dim)', lineHeight: 1.6 }}
                >
                  {currentTask?.description}
                </pre>
              </div>

              {/* Monaco Editor */}
              <div
                className="flex-1 ascii-box overflow-hidden"
                style={{ background: '#1e1e1e', minHeight: 0 }}
              >
                <p
                  className="font-terminal text-xs px-2 py-1"
                  style={{ color: 'var(--crt-dim)', borderBottom: '1px solid #333' }}
                >
                  ┌─ EDITOR ─┐
                </p>
                <div style={{ height: 'calc(100% - 28px)' }}>
                  <CodeEditor
                    value={editorCode}
                    onChange={handleEditorChange}
                    language="typescript"
                  />
                </div>
              </div>

              {/* Submit row */}
              <div className="flex items-center gap-3">
                <button
                  className="crt-button crt-button-accent px-4 py-1 text-sm"
                  onClick={handleSubmit}
                >
                  ▶ SUBMIT
                </button>
                {submitStatus === 'correct' && (
                  <span className="crt-glow-accent text-sm font-terminal">
                    ✓ CORRECT — LOADING NEXT TASK...
                  </span>
                )}
                {submitStatus === 'incorrect' && (
                  <span className="crt-glow-red text-sm font-terminal">
                    ✗ INCORRECT — CHECK YOUR SOLUTION
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Comms / Chat ── */}
        <div className="w-56 flex-shrink-0 flex flex-col">
          <p className="font-terminal mb-2" style={{ color: 'var(--crt-dim)' }}>
            ┌─ COMMS ─┐
          </p>
          <div
            ref={chatRef}
            className="flex-1 ascii-box overflow-auto space-y-1 text-xs"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            {chatMessages.map((msg, i) => (
              <div key={i}>
                <span
                  className="font-terminal"
                  style={{
                    color: msg.user === playerName ? 'var(--crt-accent)' : 'var(--crt-green)',
                    textShadow:
                      msg.user === playerName
                        ? 'var(--crt-glow-accent)'
                        : 'var(--crt-glow)',
                  }}
                >
                  {msg.user}:
                </span>{' '}
                <span className="crt-glow">{msg.text}</span>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <p style={{ color: 'var(--crt-dim)' }}>COMMS CHANNEL OPEN...</p>
            )}
          </div>
          <div className="mt-2 flex gap-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
              className="flex-1 bg-transparent outline-none crt-glow text-xs px-1"
              style={{
                color: 'var(--crt-green)',
                caretColor: 'var(--crt-green)',
                border: '1px solid var(--crt-dim)',
              }}
              placeholder="> MSG..."
            />
            <button
              className="crt-button text-xs px-2 py-0"
              onClick={handleChatSend}
            >
              TX
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MainGameScreen;
