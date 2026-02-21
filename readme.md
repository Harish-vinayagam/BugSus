#  BugSus

> *A multiplayer social-deduction coding game with a retro CRT terminal aesthetic.*

One player is secretly the **Intern** — their job is to deploy subtly broken code while blending in with the engineering team. Everyone else is an **Engineer** trying to complete legitimate tasks and identify who's sabotaging the codebase before it's too late.

---

## 📸 Screenshots

coming soon

---

## 🎮 How to Play

### Roles

| Role | Goal | Tasks |
|------|------|-------|
| **Engineer** (75% chance) | Complete coding tasks. Find and eject the Intern. | Write correct, passing code |
| **Intern** (25% chance) | Deploy sabotaged code without being caught. Survive 3 rounds. | Write *intentionally broken* code that passes its fake tests |

### Game Flow

```
Boot → Lobby → [Category Vote] → Role Reveal → Game Round
                     ↑                              ↓
              Round Summary ←── Meeting ←── Emergency Meeting
                     ↓
              (repeat up to 3 rounds)
                     ↓
                 Final Screen
```

1. **Category Vote** — All players vote on a coding category: `FRONTEND`, `BACKEND`, `OOPS`, or `DSA`. Majority wins. Timer: 15s.
2. **Role Reveal** — Your secret role is revealed. Engineers see 🔧, Interns see 🐛. Your role is locked for the entire game.
3. **Game Round** — 3 minutes to complete as many tasks as possible in the Monaco code editor. Run your code against live test cases.
4. **Emergency Meeting** — Triggered by a player pressing `⚠ EMERGENCY_MEETING` or by the round timer expiring.
5. **Vote** — 20 seconds to discuss (via in-game chat) and vote to eject a suspect. Live vote tallies shown.
6. **Round Summary** — Debrief screen showing ejection result, task progress, and crew status. Then the next round begins with a fresh category vote.
7. **End Conditions** — See Win Conditions below.

### Win Conditions

| Condition | Winner |
|-----------|--------|
| Intern is ejected | **Engineers** 🏆 |
| Engineers ejected down to ≤1 remaining | **Intern** 🏆 |
| Intern survives all 3 rounds | **Intern** 🏆 |

---

## 🧩 Task Categories

Each round the crew votes on one of four categories. Tasks are randomly selected from a pool of 12 per category.

### DSA
Array manipulation, sorting, searching, and classic algorithms — `twoSum`, `binarySearch`, `fibonacci`, `flatten`, `intersection`, and more.

### FRONTEND
Pure utility functions common in frontend codebases — `clamp`, `debounce`, `throttle`, `deepClone`, `memoize`, `formatUSD`, `groupBy`, and more.

### BACKEND
Functional programming and server-side patterns — `compose`, `pipe`, `curry`, `EventEmitter`, `LRUCache`, `retry`, `rateLimiter`, and more.

### OOPS
Object-oriented design patterns — `Animal` inheritance, `Stack`, `Queue`, `Singleton`, `Observer`, `LinkedList`, mixins, decorators, and more.

### Sabotage Tasks (Intern only)
Each category has 5 matching sabotage tasks. These are subtly wrong implementations designed to corrupt the codebase:

- **DSA** — `corruptSort`, off-by-one `twoSum`, fence-post `fibonacci`, etc.
- **FRONTEND** — inverted `clamp`, undercut `truncate`, poisoned query parser, etc.
- **BACKEND** — short-circuiting `pipe`, double-firing `EventEmitter`, LRU evicting newest, etc.
- **OOPS** — mismatched `speak()`, stack `pop()` returns wrong item, singleton that resets every 3rd call, etc.

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 18](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org/) |
| Build Tool | [Vite 5](https://vitejs.dev) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| Code Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/react` |
| UI Primitives | [Radix UI](https://www.radix-ui.com/) |
| Fonts | [VT323](https://fonts.google.com/specimen/VT323) · [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) (Google Fonts) |
| Testing | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com/) |
| Code Execution | `new Function()` in-browser sandbox |

---

## 📁 Project Structure

```
BugSus/
├── readme.md
└── client/                        # Vite + React frontend
    └── src/
        ├── components/
        │   ├── BootScreen.tsx         # Title / mode-select screen
        │   ├── CRTFrame.tsx           # Scanlines, vignette, grain overlay
        │   ├── CRTIntro.tsx           # Phosphor tube power-on animation
        │   ├── CategoryVoteScreen.tsx # Live vote bars, 15s timer
        │   ├── RoleRevealScreen.tsx   # Glitch → role reveal
        │   ├── MainGameScreen.tsx     # 3-col layout: crew | editor | comms
        │   ├── EmergencyScreen.tsx    # Dramatic interstitial with countdown
        │   ├── MeetingScreen.tsx      # Vote UI with live tally + ejection reveal
        │   ├── RoundSummaryScreen.tsx # Post-round debrief with stats
        │   ├── FinalScreen.tsx        # Win/loss screen with intern identity reveal
        │   ├── CreateJoinScreen.tsx   # Name + room code entry
        │   ├── LobbyScreen.tsx        # Waiting room
        │   └── editor/
        │       └── CodeEditor.tsx     # Monaco editor wrapper
        ├── data/
        │   └── tasks.ts               # 68 tasks (48 engineer + 20 intern sabotage)
        ├── types/
        │   ├── task.ts                # Task, TestCase, TaskCategory types
        │   └── game.ts                # Game state types
        ├── utils/
        │   └── validateTask.ts        # new Function() executor + deepEqual
        └── pages/
            └── Index.tsx              # Root game state machine (11 screens)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (or [Bun](https://bun.sh/))

### Install & Run

```bash
# Clone the repo
git clone https://github.com/Harish-vinayagam/BugSus.git
cd BugSus/client

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other Commands

```bash
npm run build       # Production build → dist/
npm run preview     # Preview the production build locally
npm run test        # Run unit tests (Vitest)
npm run test:watch  # Run tests in watch mode
npm run lint        # ESLint
```

---

## ▲ Deploying to Vercel

The app lives in the `client/` subdirectory. A `vercel.json` at the repo root handles this automatically.

**Steps:**

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → import your repo.
3. In **Configure Project**, set **Root Directory** to `client`.
4. Leave Framework as **Vite** (auto-detected). Vercel will use the settings in `vercel.json`.
5. Click **Deploy**.

The `vercel.json` at the repo root sets:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
The `rewrites` rule ensures React Router routes don't 404 on hard refresh.

---

## 🔧 How Code Execution Works

BugSus runs player-submitted code entirely **in the browser** using `new Function()`:

```ts
const fn = new Function(`
  "use strict";
  ${userCode}          // player's submission
  return (${tc.call}); // test case call expression
`);
const received = fn();
const passed = deepEqual(received, tc.expected);
```

Each task has typed `TestCase[]` with a `call` expression, `expected` value, and `label` for display. A custom recursive `deepEqual` handles arrays and nested objects.

> ⚠️ **Security note:** `new Function()` has no real sandbox — it runs in the same JS context as the page. For a production multiplayer game, task execution should be moved server-side (e.g. isolated Workers or a sandboxed Node process).

---

## 🎨 CRT Aesthetic

The retro terminal look is achieved entirely with CSS:

| Effect | Implementation |
|--------|---------------|
| Scanlines | `repeating-linear-gradient` overlay |
| Phosphor glow | `text-shadow` CSS variables (`--crt-glow`, `--crt-glow-red`, `--crt-glow-accent`) |
| Screen vignette | Radial gradient overlay |
| Film grain | Animated SVG `feTurbulence` noise |
| Glitch text | CSS `@keyframes glitch` with translate jitter |
| Power-on intro | Multi-phase tube animation: flash → expand → stabilise → flicker |
| Emergency flash | Alternating dark-red background + red border at 400ms |

---

## 🗺️ Screen State Machine

```
boot
 ├── create ──┐
 └── join ────┴─→ lobby → category → role → game
                                              ↓
                                    ┌── emergency
                                    │       ↓
                                    └──> meeting
                                          ↓ (not final round, not game-over)
                                        summary → category (next round)
                                          ↓ (game-over)
                                         final
```

---

## 🤝 Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`
2. Commit your changes: `git commit -m 'feat: add my feature'`
3. Push and open a Pull Request

### Adding New Tasks

All tasks live in `client/src/data/tasks.ts`. Each task must satisfy the `Task` interface:

```ts
{
  id: 'dsa-013',
  category: 'DSA',           // 'FRONTEND' | 'BACKEND' | 'OOPS' | 'DSA'
  forRole: 'engineer',       // 'engineer' | 'intern'
  title: 'MY NEW TASK',
  description: 'Write a function `myFn(x)` that ...',
  starterCode: `function myFn(x) {\n  // TODO\n}`,
  solution: `function myFn(x) { return x; }`,
  testCases: [
    { label: 'myFn(1) === 1', call: 'myFn(1)', expected: 1 },
  ],
}
```

For sabotage tasks (`forRole: 'intern'`), prefix the title with `[SABOTAGE]` and write a `DIRECTIVE:` description that explains what subtle bug to introduce.

---
