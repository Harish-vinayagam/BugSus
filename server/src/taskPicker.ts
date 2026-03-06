// ─────────────────────────────────────────────────────────────────────────────
// Server-side task picker
// The server picks which task IDs engineers and interns get each round.
// This guarantees ALL engineers see identical tasks in the same order.
// Client looks up Task objects by ID from its local task bank.
// ─────────────────────────────────────────────────────────────────────────────

// All task IDs, grouped by category and role.
// Keep in sync with client/src/data/tasks.ts IDs.

const TASK_IDS: Record<string, { engineer: string[]; intern: string[] }> = {
  DSA: {
    engineer: [
      'dsa-001','dsa-002','dsa-003','dsa-004','dsa-005',
      'dsa-006','dsa-007','dsa-008','dsa-009','dsa-010',
      'dsa-011','dsa-012',
    ],
    intern: [
      'sab-dsa-001','sab-dsa-002','sab-dsa-003',
      'sab-dsa-004','sab-dsa-005',
    ],
  },
  FRONTEND: {
    engineer: [
      'fe-001','fe-002','fe-003','fe-004','fe-005',
      'fe-006','fe-007','fe-008','fe-009','fe-010',
      'fe-011','fe-012',
    ],
    intern: [
      'sab-fe-001','sab-fe-002','sab-fe-003',
      'sab-fe-004','sab-fe-005',
    ],
  },
  BACKEND: {
    engineer: [
      'be-001','be-002','be-003','be-004','be-005',
      'be-006','be-007','be-008','be-009','be-010',
      'be-011','be-012',
    ],
    intern: [
      'sab-be-001','sab-be-002','sab-be-003',
      'sab-be-004','sab-be-005',
    ],
  },
  OOPS: {
    engineer: [
      'oo-001','oo-002','oo-003','oo-004','oo-005',
      'oo-006','oo-007','oo-008','oo-009','oo-010',
      'oo-011','oo-012',
    ],
    intern: [
      'sab-oo-001','sab-oo-002','sab-oo-003',
      'sab-oo-004','sab-oo-005',
    ],
  },
};

/** Fisher-Yates shuffle — returns a new array, does not mutate. */
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Pick 10 task IDs for a given category + role.
 * Called ONCE per round on the server — the result is stored on the Room
 * and broadcast to every player of that role so they all get identical tasks.
 */
export const pickTaskIds = (
  category: string,
  role: 'engineer' | 'intern',
  count = 10,
): string[] => {
  const pool = TASK_IDS[category]?.[role] ?? [];
  return shuffle(pool).slice(0, Math.min(count, pool.length));
};
