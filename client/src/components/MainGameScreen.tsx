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
  players: Player[];                       // live from socket
  taskProgress: Record<string, number>;    // username → completed count
  onEmergency: () => void;
  onTimerEnd: () => void;
  onTasksCompleted: (count: number) => void;
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
  onEmergency,
  onTimerEnd,
  onTasksCompleted,
}) => {
  // ── Task state ──────────────────────────────────────────────────────────────
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const currentTask: Task | null = tasks[currentTaskIdx] ?? null;

  const [editorCode, setEditorCode] = useState<string>(
    () => tasks[0]?.starterCode ?? ''
  );
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // ── Game / UI state ─────────────────────────────────────────────────────────
  const [timer, setTimer] = useState(180);
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  // Reset task state when tasks list changes (new round / category)
  useEffect(() => {
    setCompletedTaskIds([]);
    setCurrentTaskIdx(0);
    setEditorCode(tasks[0]?.starterCode ?? '');
    setSubmitStatus('idle');
    setTestResults([]);
  }, [tasks]);

  // Sync editor when navigating to a different task
  useEffect(() => {
    if (currentTask) {
      setEditorCode(currentTask.starterCode);
      setSubmitStatus('idle');
      setTestResults([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTaskIdx]);

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
  // (No fake bots — real players type in the chat input)


  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [chatMessages]);

  // ── Task handlers ───────────────────────────────────────────────────────────

  const handleEditorChange = useCallback((value: string) => {
    setEditorCode(value);
    setSubmitStatus('idle');
    setTestResults([]);
  }, []);

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
        const nextCompleted = [...completedTaskIds, currentTask.id];
        setCompletedTaskIds(nextCompleted);
        setSubmitStatus('correct');
        onTasksCompleted(nextCompleted.length);

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
  }, [currentTask, editorCode, completedTaskIds, currentTaskIdx, tasks]);

  const handleChatSend = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages((m) => [...m, { user: playerName, text: chatInput.toUpperCase() }]);
    setChatInput('');
  }, [chatInput, playerName]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const allTasksDone = currentTaskIdx >= tasks.length && tasks.length > 0;
  const isIntern = role === 'intern';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col font-mono text-sm">

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between mb-3 pb-2"
        style={{ borderBottom: `1px solid ${isIntern ? 'var(--crt-red)' : 'var(--crt-dim)'}` }}
      >
        <span className={`font-terminal text-lg ${isIntern ? 'crt-glow-red' : 'crt-glow'}`}>
          ROUND {round}/3 — {category}
          {isIntern && <span className="ml-2 text-sm" style={{ color: 'var(--crt-red)' }}>[ SABOTAGE MODE ]</span>}
        </span>
        <span className={`font-terminal text-xl ${timer <= 30 ? 'crt-glow-red' : isIntern ? 'crt-glow-red' : 'crt-glow'}`}>
          {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
        </span>
        <button
          className="crt-button crt-button-red text-xs px-3 py-1"
          onClick={onEmergency}
        >
          ⚠ EMERGENCY_MEETING
        </button>
      </div>

      {/* ── Intern sabotage banner ── */}
      {isIntern && (
        <div
          className="mb-3 px-3 py-2 text-xs font-terminal"
          style={{
            border: '1px solid var(--crt-red)',
            color: 'var(--crt-red)',
            textShadow: 'var(--crt-glow-red)',
            background: 'rgba(255,51,51,0.06)',
          }}
        >
          ██ DIRECTIVE ACTIVE ██ — Complete sabotage tasks without raising suspicion. Your solutions MUST pass all tests to be deployed.
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
          <div className="mt-auto pt-3 text-xs overflow-auto" style={{ color: 'var(--crt-dim)', borderTop: `1px solid ${isIntern ? 'var(--crt-red)' : 'var(--crt-dim)'}` }}>
            <p className="font-terminal mb-1" style={{ color: isIntern ? 'var(--crt-red)' : undefined }}>
              {isIntern ? '┌─ DIRECTIVES ─┐' : '┌─ TASKS ─┐'}
            </p>
            {tasks.map((t, i) => {
              const done = completedTaskIds.includes(t.id);
              const active = i === currentTaskIdx;
              const activeColor = isIntern ? 'var(--crt-red)' : 'var(--crt-accent)';
              const doneColor = isIntern ? 'var(--crt-red)' : 'var(--crt-green)';
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
            <p className="mt-1" style={{ color: isIntern ? 'var(--crt-red)' : 'var(--crt-green)', textShadow: isIntern ? 'var(--crt-glow-red)' : 'var(--crt-glow)' }}>
              DONE: {completedTaskIds.length}/{tasks.length}
            </p>
          </div>
        </div>

        {/* ── CENTER: Task + Editor + Results ── */}
        <div className="flex-1 flex flex-col min-w-0 gap-2">

          {allTasksDone ? (
            <div
              className="flex-1 ascii-box flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(0,0,0,0.3)', borderColor: isIntern ? 'var(--crt-red)' : undefined }}
            >
              <p className={`font-terminal text-2xl ${isIntern ? 'crt-glow-red' : 'crt-glow-accent'}`}>
                {isIntern ? 'ALL DIRECTIVES COMPLETE' : 'ALL TASKS COMPLETE'}
              </p>
              <p style={{ color: 'var(--crt-dim)' }}>
                {isIntern ? 'Sabotage deployed. Blend in...' : 'Waiting for emergency meeting...'}
              </p>
            </div>
          ) : (
            <>
              {/* Task description */}
              <div
                className="ascii-box p-3"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderColor: isIntern ? 'var(--crt-red)' : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className={`font-terminal text-base ${isIntern ? 'crt-glow-red' : 'crt-glow-accent'}`}>
                    {currentTask?.title}
                  </p>
                  <span className="text-xs" style={{ color: 'var(--crt-dim)' }}>{completedTaskIds.length}/{tasks.length} COMPLETE</span>
                </div>
                <pre className="text-xs whitespace-pre-wrap" style={{ color: isIntern ? '#ff555588' : 'var(--crt-dim)', lineHeight: 1.6 }}>
                  {currentTask?.description}
                </pre>
              </div>

              {/* Monaco Editor */}
              <div
                className="flex-1 ascii-box overflow-hidden"
                style={{ background: '#1e1e1e', minHeight: 0 }}
              >
                <p className="font-terminal text-xs px-2 py-1" style={{ color: 'var(--crt-dim)', borderBottom: '1px solid #333' }}>
                  ┌─ EDITOR ─┐
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
                  className={`crt-button ${isIntern ? 'crt-button-red' : 'crt-button-accent'} px-4 py-1 text-sm`}
                  onClick={handleSubmit}
                  disabled={submitStatus === 'running' || submitStatus === 'correct'}
                >
                  {submitStatus === 'running' ? '⟳ RUNNING...' : isIntern ? '▶ DEPLOY' : '▶ SUBMIT'}
                </button>
                {submitStatus === 'correct' && (
                  <span className={`text-sm font-terminal ${isIntern ? 'crt-glow-red' : 'crt-glow-accent'}`}>
                    {isIntern ? '✓ SABOTAGE DEPLOYED — NEXT DIRECTIVE...' : '✓ ALL TESTS PASSED — NEXT TASK...'}
                  </span>
                )}
                {submitStatus === 'incorrect' && (
                  <span className="crt-glow-red text-sm font-terminal">
                    {isIntern ? '✗ DEPLOY FAILED — FIX YOUR CODE' : '✗ TESTS FAILED — SEE RESULTS BELOW'}
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
                    borderColor: isIntern ? 'var(--crt-red)' : undefined,
                  }}
                >
                  <p className="font-terminal mb-1" style={{ color: 'var(--crt-dim)' }}>
                    {isIntern ? '┌─ DEPLOY RESULTS ─┐' : '┌─ TEST RESULTS ─┐'}
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
                    color: msg.user === playerName ? 'var(--crt-accent)' : 'var(--crt-green)',
                    textShadow: msg.user === playerName ? 'var(--crt-glow-accent)' : 'var(--crt-glow)',
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
