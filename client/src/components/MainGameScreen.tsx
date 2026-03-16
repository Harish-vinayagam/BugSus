import { useState, useEffect, useRef, useCallback } from 'react';
import type { Task } from '@/types/task';
import { validateTask, type TestResult } from '@/utils/validateTask';
import CodeEditor from '@/components/editor/CodeEditor';
import type { Player } from '../../../shared/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MainGameScreenProps {
  playerName: string;
  round: number;
  category: string;
  role: 'engineer' | 'intern';
  tasks: Task[];
  players: Player[];
  taskProgress: Record<string, number>;
  completedTaskIds: string[];          // shared across all players via socket
  sharedCode: string;
  sharedCodeTaskId: string;
  sharedCodeSender: string;
  chatMessages: { username: string; text: string }[];
  onCodeChange: (code: string, taskId: string) => void;
  onChatSend: (text: string) => void;
  onTaskCompleted: (taskId: string) => void; // fires once when THIS client completes a task
  onEmergency: () => void;
  onTimerEnd: () => void;
  onTasksCompleted: (count: number) => void;
  /** Server epoch-ms when this game coding phase ends — drives the shared countdown */
  timerEndsAt: number;
}

type SubmitStatus = 'idle' | 'running' | 'correct' | 'incorrect';

// ── Component ─────────────────────────────────────────────────────────────────

const MainGameScreen: React.FC<MainGameScreenProps> = ({
  playerName,
  round,
  category,
  role,
  tasks,
  players,
  taskProgress,
  completedTaskIds: remoteCompletedIds,
  sharedCode,
  sharedCodeTaskId,
  sharedCodeSender,
  chatMessages,
  onCodeChange,
  onChatSend,
  onTaskCompleted,
  onEmergency,
  onTimerEnd,
  onTasksCompleted,
  timerEndsAt,
}) => {
  // ── Task state ──────────────────────────────────────────────────────────────
  // Local completed set merges with the server-broadcast set (carried across rounds)
  const [localCompletedIds, setLocalCompletedIds] = useState<string[]>([]);
  const completedTaskIds = Array.from(new Set([...localCompletedIds, ...remoteCompletedIds]));

  // Start at the first task not yet completed (so returning players don't repeat done work)
  const firstIncompleteIdx = tasks.findIndex((t) => !remoteCompletedIds.includes(t.id));
  const [currentTaskIdx, setCurrentTaskIdx] = useState(() =>
    firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0
  );
  const currentTask: Task | null = tasks[currentTaskIdx] ?? null;

  const [editorCode, setEditorCode] = useState<string>(
    () => tasks[0]?.starterCode ?? ''
  );
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // ── Game / UI state ─────────────────────────────────────────────────────────
  const [timer, setTimer] = useState(() => Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)));
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const broadcastDebounce = useRef<ReturnType<typeof setTimeout>>();

  // ── Apply remote code changes from other players ────────────────────────────
  useEffect(() => {
    if (!sharedCode || !currentTask) return;
    // Only apply if the incoming change is for the task we're currently on
    if (sharedCodeTaskId === currentTask.id) {
      setEditorCode(sharedCode);
    }
  }, [sharedCode, sharedCodeTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the task list changes (new round with fresh tasks), reset editor state
  // but preserve completed IDs — they carry forward across rounds.
  useEffect(() => {
    const firstOpen = tasks.findIndex((t) => !remoteCompletedIds.includes(t.id));
    const startIdx = firstOpen >= 0 ? firstOpen : 0;
    setCurrentTaskIdx(startIdx);
    setEditorCode(tasks[startIdx]?.starterCode ?? '');
    setSubmitStatus('idle');
    setTestResults([]);
    // Do NOT reset localCompletedIds — carry them forward
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance when another player completes the task we're currently on
  useEffect(() => {
    if (!currentTask) return;
    if (remoteCompletedIds.includes(currentTask.id) && !localCompletedIds.includes(currentTask.id)) {
      // Mark locally so the done count stays consistent, then move on
      setLocalCompletedIds((prev) => prev.includes(currentTask.id) ? prev : [...prev, currentTask.id]);
      setTimeout(() => {
        setCurrentTaskIdx((idx) => {
          const next = idx + 1;
          if (next < tasks.length) {
            setEditorCode(tasks[next].starterCode);
          }
          return next;
        });
        setSubmitStatus('idle');
        setTestResults([]);
      }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteCompletedIds]);

  // Sync editor when navigating to a different task
  useEffect(() => {
    if (currentTask) {
      setEditorCode(currentTask.starterCode);
      setSubmitStatus('idle');
      setTestResults([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTaskIdx]);

  // ── Timer — wall-clock driven so all clients stay in sync ──────────────────
  // Re-seed whenever the server provides a new deadline
  useEffect(() => {
    setTimer(Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)));
  }, [timerEndsAt]);

  useEffect(() => {
    if (timerEndsAt === 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
      setTimer(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onTimerEnd();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEndsAt, onTimerEnd]);

  // ── Simulated incoming chat ─────────────────────────────────────────────────
  // (No fake bots — real players type in the chat input)


  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [chatMessages]);

  // ── Task handlers ───────────────────────────────────────────────────────────

  const handleEditorChange = useCallback((value: string) => {
    setEditorCode(value);
    setSubmitStatus('idle');
    setTestResults([]);
    // Debounce broadcast — send after 200ms of no typing to avoid spamming
    if (currentTask) {
      clearTimeout(broadcastDebounce.current);
      broadcastDebounce.current = setTimeout(() => {
        onCodeChange(value, currentTask.id);
      }, 200);
    }
  }, [currentTask, onCodeChange]);

  const handleSubmit = useCallback(() => {
    if (!currentTask) return;

    setSubmitStatus('running');
    setTestResults([]);

    // Small timeout so "RUNNING..." flash is visible
    setTimeout(() => {
      const results = validateTask(editorCode, currentTask.testCases);
      setTestResults(results);
      const allPassed = results.length > 0 && results.every((r) => r.passed);

      if (allPassed) {
        const taskId = currentTask.id;
        // Add to local completed set
        setLocalCompletedIds((prev) => prev.includes(taskId) ? prev : [...prev, taskId]);
        setSubmitStatus('correct');
        // Broadcast to all other players
        onTaskCompleted(taskId);
        onTasksCompleted(completedTaskIds.length + 1);

        setTimeout(() => {
          const nextIdx = currentTaskIdx + 1;
          if (nextIdx < tasks.length) {
            setCurrentTaskIdx(nextIdx);
            setEditorCode(tasks[nextIdx].starterCode);
          } else {
            setCurrentTaskIdx(tasks.length); // signals all done
          }
          setSubmitStatus('idle');
          setTestResults([]);
        }, 1200);
      } else {
        setSubmitStatus('incorrect');
      }
    }, 120);
  }, [currentTask, editorCode, completedTaskIds, currentTaskIdx, tasks, onTaskCompleted, onTasksCompleted]);

  const handleChatSend = useCallback(() => {
    if (!chatInput.trim()) return;
    onChatSend(chatInput.trim());
    setChatInput('');
  }, [chatInput, onChatSend]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const allTasksDone = currentTaskIdx >= tasks.length && tasks.length > 0;
  const isIntern = role === 'intern';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col font-mono text-sm">

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between mb-3 pb-2"
        style={{ borderBottom: '1px solid var(--crt-dim)' }}
      >
        <span className="font-terminal text-lg crt-glow">
          ROUND {round}/3 — {category}
        </span>
        <span className={`font-terminal text-xl ${timer <= 30 ? 'crt-glow-red' : 'crt-glow'}`}>
          {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
        </span>
        <button
          className="crt-button crt-button-red text-xs px-3 py-1"
          onClick={onEmergency}
        >
          ⚠ EMERGENCY_MEETING
        </button>
      </div>

      {/* ── Intern private directive (only visible to them, small + subtle) ── */}
      {isIntern && (
        <div
          className="mb-3 px-3 py-1 text-xs font-terminal"
          style={{
            border: '1px solid #ff333344',
            color: '#ff333399',
            background: 'rgba(255,51,51,0.04)',
            letterSpacing: '0.05em',
          }}
        >
          ▸ PRIVATE: Your goal is to write subtly wrong solutions. Make them look plausible. Don't get caught.
        </div>
      )}

      {/* ── 3-column layout ── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* ── LEFT: Crew + Task list ─ */}
        <div className="w-44 flex-shrink-0 flex flex-col">
          <p className="font-terminal mb-2" style={{ color: 'var(--crt-dim)' }}>┌─ CREW ─┐</p>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="ascii-box py-1 px-2"
                style={{
                  borderColor: p.alive ? 'var(--crt-dim)' : 'transparent',
                  opacity: p.alive ? 1 : 0.3,
                }}
              >
                <p className={`font-terminal ${p.username === playerName ? 'crt-glow-accent' : 'crt-glow'}`}>
                  {p.username}
                </p>
                <p className="text-xs" style={{ color: p.alive ? 'var(--crt-dim)' : 'var(--crt-red)' }}>
                  [{p.alive ? 'ALIVE' : 'EJECTED'}]
                </p>
                {taskProgress[p.username] !== undefined && (
                  <p className="text-xs" style={{ color: 'var(--crt-dim)' }}>
                    TASKS: {taskProgress[p.username]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs" style={{ color: 'var(--crt-dim)' }}>
            <p>ROLE: <span className={role === 'engineer' ? 'crt-glow' : 'crt-glow-red'}>{role.toUpperCase()}</span></p>
          </div>

          {/* Task progress list */}
          <div className="mt-auto pt-3 text-xs overflow-auto" style={{ color: 'var(--crt-dim)', borderTop: `1px solid var(--crt-dim)` }}>
            <p className="font-terminal mb-1">
              ┌─ TASKS ─┐
            </p>
            {tasks.map((t, i) => {
              const done = completedTaskIds.includes(t.id);
              const active = i === currentTaskIdx;
              const activeColor = 'var(--crt-accent)';
              const doneColor = 'var(--crt-green)';
              return (
                <div key={t.id} className="flex items-center gap-1 py-0.5">
                  <span style={{ color: done ? doneColor : active ? activeColor : 'var(--crt-dim)' }}>
                    {done ? '[✓]' : active ? '[▶]' : '[ ]'}
                  </span>
                  <span
                    className="truncate"
                    style={{
                      color: done ? 'var(--crt-dim)' : active ? activeColor : 'var(--crt-dim)',
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
            <p className="mt-1" style={{ color: 'var(--crt-green)', textShadow: 'var(--crt-glow)' }}>
              DONE: {completedTaskIds.length}/{tasks.length}
            </p>
          </div>
        </div>

        {/* ── CENTER: Task + Editor + Results ── */}
        <div className="flex-1 flex flex-col min-w-0 gap-2">

          {allTasksDone ? (
            <div
              className="flex-1 ascii-box flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <p className="font-terminal text-2xl crt-glow-accent">
                ALL TASKS COMPLETE
              </p>
              <p style={{ color: 'var(--crt-dim)' }}>
                Waiting for emergency meeting...
              </p>
            </div>
          ) : (
            <>
              {/* Task description */}
              <div
                className="ascii-box p-3"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-terminal text-base crt-glow-accent">
                    {currentTask?.title}
                  </p>
                  <span className="text-xs" style={{ color: 'var(--crt-dim)' }}>{completedTaskIds.length}/{tasks.length} COMPLETE</span>
                </div>
                <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--crt-dim)', lineHeight: 1.6 }}>
                  {currentTask?.description}
                </pre>
              </div>

              {/* Monaco Editor */}
              <div
                className="flex-1 ascii-box overflow-hidden"
                style={{ background: '#1e1e1e', minHeight: 0 }}
              >
                <p className="font-terminal text-xs px-2 py-1 flex items-center justify-between" style={{ color: 'var(--crt-dim)', borderBottom: '1px solid #333' }}>
                  <span>┌─ EDITOR ─┐</span>
                </p>
                <div style={{ height: 'calc(100% - 28px)' }}>
                  <CodeEditor
                    value={editorCode}
                    onChange={handleEditorChange}
                    language="javascript"
                  />
                </div>
              </div>

              {/* Submit row */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  className="crt-button crt-button-accent px-4 py-1 text-sm"
                  onClick={handleSubmit}
                  disabled={submitStatus === 'running' || submitStatus === 'correct'}
                >
                  {submitStatus === 'running' ? '⟳ RUNNING...' : '▶ SUBMIT'}
                </button>
                {submitStatus === 'correct' && (
                  <span className="text-sm font-terminal crt-glow-accent">
                    ✓ ALL TESTS PASSED — NEXT TASK...
                  </span>
                )}
                {submitStatus === 'incorrect' && (
                  <span className="crt-glow-red text-sm font-terminal">
                    ✗ TESTS FAILED — SEE RESULTS BELOW
                  </span>
                )}
              </div>

              {/* Test case results */}
              {testResults.length > 0 && (
                <div
                  className="ascii-box p-2 text-xs space-y-1 overflow-auto"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    maxHeight: '130px',
                  }}
                >
                  <p className="font-terminal mb-1" style={{ color: 'var(--crt-dim)' }}>
                    ┌─ TEST RESULTS ─┐
                  </p>
                  {testResults.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ color: r.passed ? 'var(--crt-green)' : 'var(--crt-red)', flexShrink: 0 }}>
                        {r.passed ? '✓' : '✗'}
                      </span>
                      <span style={{ color: r.passed ? 'var(--crt-dim)' : 'var(--crt-red)' }}>
                        {r.label}
                      </span>
                      {!r.passed && (
                        <span style={{ color: 'var(--crt-dim)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                          {r.error
                            ? `ERR: ${r.error.slice(0, 40)}`
                            : `got ${JSON.stringify(r.received)} · want ${JSON.stringify(r.expected)}`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT: Comms / Chat ── */}
        <div className="w-56 flex-shrink-0 flex flex-col">
          <p className="font-terminal mb-2" style={{ color: 'var(--crt-dim)' }}>┌─ COMMS ─┐</p>
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
                    color: msg.username === playerName ? 'var(--crt-accent)' : 'var(--crt-green)',
                    textShadow: msg.username === playerName ? 'var(--crt-glow-accent)' : 'var(--crt-glow)',
                  }}
                >
                  {msg.username}:
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
              style={{ color: 'var(--crt-green)', caretColor: 'var(--crt-green)', border: '1px solid var(--crt-dim)' }}
              placeholder="> MSG..."
            />
            <button className="crt-button text-xs px-2 py-0" onClick={handleChatSend}>TX</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MainGameScreen;
