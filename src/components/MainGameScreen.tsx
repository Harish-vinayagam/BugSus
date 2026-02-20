import { useState, useEffect, useRef } from 'react';

interface MainGameScreenProps {
  playerName: string;
  round: number;
  category: string;
  role: 'engineer' | 'intern';
  onEmergency: () => void;
  onTimerEnd: () => void;
}

const PLAYERS_DATA = [
  { name: '', status: 'ALIVE' as const },
  { name: 'CIPHER', status: 'ALIVE' as const },
  { name: 'NULLPTR', status: 'ALIVE' as const },
  { name: 'STACK0F', status: 'ALIVE' as const },
];

const CODE_SNIPPETS: Record<string, string[]> = {
  FRONTEND: [
    'function renderComponent(props) {',
    '  const [state, setState] = useState(null);',
    '  useEffect(() => {',
    '    fetchData().then(setState);',
    '  }, []);',
    '  return (',
    '    <div className="container">',
    '      {state?.map(item => (',
    '        <Card key={item.id} data={item} />',
    '      ))}',
    '    </div>',
    '  );',
    '}',
  ],
  BACKEND: [
    'async function handleRequest(req, res) {',
    '  try {',
    '    const user = await auth.verify(req.token);',
    '    const data = await db.query(',
    '      "SELECT * FROM tasks WHERE user_id = $1",',
    '      [user.id]',
    '    );',
    '    res.json({ status: "ok", data });',
    '  } catch (err) {',
    '    res.status(500).json({ error: err.message });',
    '  }',
    '}',
  ],
  OOPS: [
    'class TaskManager {',
    '  constructor() {',
    '    this.tasks = new Map();',
    '    this.observers = [];',
    '  }',
    '  addTask(task) {',
    '    this.tasks.set(task.id, task);',
    '    this.notify("TASK_ADDED", task);',
    '  }',
    '  subscribe(observer) {',
    '    this.observers.push(observer);',
    '  }',
    '}',
  ],
  DSA: [
    'function mergeSort(arr) {',
    '  if (arr.length <= 1) return arr;',
    '  const mid = Math.floor(arr.length / 2);',
    '  const left = mergeSort(arr.slice(0, mid));',
    '  const right = mergeSort(arr.slice(mid));',
    '  return merge(left, right);',
    '}',
    'function merge(a, b) {',
    '  const result = [];',
    '  while (a.length && b.length) {',
    '    result.push(a[0]<b[0] ? a.shift() : b.shift());',
    '  }',
    '  return [...result, ...a, ...b];',
    '}',
  ],
};

const CHAT_MESSAGES = [
  { user: 'CIPHER', text: 'ANYONE NOTICE ANYTHING SUS?' },
  { user: 'NULLPTR', text: 'ALL CLEAR ON MY END' },
  { user: 'STACK0F', text: 'FOCUS ON TASKS PEOPLE' },
  { user: 'CIPHER', text: 'STACK0F IS QUIET...' },
  { user: 'NULLPTR', text: 'I SAW SOMEONE NEAR THE SERVER ROOM' },
];

const TASK_LIST = [
  { id: 1, label: 'FIX MEMORY LEAK IN useEffect()', done: false },
  { id: 2, label: 'REFACTOR AUTH MIDDLEWARE', done: false },
  { id: 3, label: 'WRITE UNIT TESTS FOR /api/users', done: false },
  { id: 4, label: 'PATCH SQL INJECTION IN QUERY BUILDER', done: false },
  { id: 5, label: 'UPDATE DEPENDENCY VERSIONS', done: false },
  { id: 6, label: 'RESOLVE MERGE CONFLICT IN main', done: false },
];

const MainGameScreen: React.FC<MainGameScreenProps> = ({
  playerName,
  round,
  category,
  role,
  onEmergency,
  onTimerEnd,
}) => {
  const [timer, setTimer] = useState(60);
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState(TASK_LIST);
  const [players, setPlayers] = useState(() =>
    PLAYERS_DATA.map((p) => ({ ...p, name: p.name || playerName }))
  );
  const chatRef = useRef<HTMLDivElement>(null);

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
  }, []);

  // Simulate code typing
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine((l) => {
        const lines = CODE_SNIPPETS[category] || CODE_SNIPPETS.FRONTEND;
        return l < lines.length - 1 ? l + 1 : l;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [category]);

  // Simulate chat
  useEffect(() => {
    CHAT_MESSAGES.forEach((msg, i) => {
      setTimeout(() => {
        setChatMessages((m) => [...m, msg]);
      }, 5000 + i * 8000);
    });
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [chatMessages]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((m) => [...m, { user: playerName, text: chatInput.toUpperCase() }]);
    setChatInput('');
  };

  const lines = CODE_SNIPPETS[category] || CODE_SNIPPETS.FRONTEND;

  return (
    <div className="h-full flex flex-col font-mono text-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--crt-dim)' }}>
        <span className="crt-glow font-terminal text-lg">
          ROUND {round}/3 — {category}
        </span>
        <span className={`font-terminal text-xl ${timer <= 10 ? 'crt-glow-red' : 'crt-glow'}`}>
          {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
        </span>
        <button className="crt-button crt-button-red text-xs px-3 py-1" onClick={onEmergency}>
          ⚠ EMERGENCY_MEETING
        </button>
      </div>

      {/* 3-column layout */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* LEFT: Players */}
        <div className="w-44 flex-shrink-0">
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
                <p className="text-xs" style={{ color: p.status === 'ALIVE' ? 'var(--crt-dim)' : 'var(--crt-red)' }}>
                  [{p.status}]
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs" style={{ color: 'var(--crt-dim)' }}>
            <p>ROLE: <span className={role === 'engineer' ? 'crt-glow' : 'crt-glow-red'}>{role.toUpperCase()}</span></p>
          </div>
        </div>

        {/* CENTER: Code editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <p className="font-terminal mb-2" style={{ color: 'var(--crt-dim)' }}>
            ┌─ TERMINAL ─┐
          </p>
          <div
            className="flex-1 ascii-box overflow-auto"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            {lines.slice(0, currentLine + 1).map((line, i) => (
              <div key={i} className="flex">
                <span className="w-8 text-right mr-3 select-none" style={{ color: 'var(--crt-dim)' }}>
                  {i + 1}
                </span>
                <span className={`crt-glow ${i === currentLine ? 'crt-cursor' : ''}`}>
                  {line}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span style={{ color: 'var(--crt-dim)' }}>PROGRESS:</span>
            <div className="flex-1 h-2" style={{ border: '1px solid var(--crt-dim)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${((currentLine + 1) / lines.length) * 100}%`,
                  background: 'var(--crt-green)',
                  boxShadow: 'var(--crt-glow)',
                }}
              />
            </div>
            <span className="crt-glow text-xs">
              {Math.round(((currentLine + 1) / lines.length) * 100)}%
            </span>
          </div>
          <button
            className="crt-button text-xs px-3 py-1 mt-2 w-full"
            onClick={() => setShowTasks((v) => !v)}
          >
            {showTasks ? '▼ HIDE_TASKS' : '▶ VIEW_TASKS'}
          </button>
          {showTasks && (
            <div
              className="mt-2 ascii-box text-xs"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <p className="font-terminal mb-1" style={{ color: 'var(--crt-dim)' }}>
                ┌─ TASK_QUEUE ─┐
              </p>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 py-0.5 cursor-pointer"
                  onClick={() =>
                    setTasks((prev) =>
                      prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x))
                    )
                  }
                >
                  <span style={{ color: t.done ? 'var(--crt-green)' : 'var(--crt-dim)' }}>
                    [{t.done ? 'X' : ' '}]
                  </span>
                  <span
                    className={t.done ? '' : 'crt-glow'}
                    style={t.done ? { color: 'var(--crt-dim)', textDecoration: 'line-through' } : {}}
                  >
                    {t.label}
                  </span>
                </div>
              ))}
              <p className="mt-1" style={{ color: 'var(--crt-dim)' }}>
                COMPLETED: {tasks.filter((t) => t.done).length}/{tasks.length}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Chat */}
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
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
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
              onClick={sendChat}
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
