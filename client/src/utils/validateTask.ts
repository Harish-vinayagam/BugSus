import type { TestCase } from '@/types/task';

export interface TestResult {
  label: string;
  passed: boolean;
  expected: unknown;
  received: unknown;
  error?: string;
}

/**
 * Executes `userCode` in a sandboxed Function scope and runs every test case
 * against the exported functions. Returns per-case results so the UI can show
 * which tests passed/failed.
 *
 * Security note: this runs in the browser's JS engine with no real sandbox.
 * For a production game, move execution server-side (see comment below).
 */
export const validateTask = (
  userCode: string,
  testCases: TestCase[]
): TestResult[] => {
  return testCases.map((tc) => {
    try {
      // Wrap the user's code + the test call in a single Function body.
      // The last expression is the actual call we want the return value of.
      // eslint-disable-next-line no-new-func
      const fn = new Function(`
        "use strict";
        ${userCode}
        return (${tc.call});
      `);
      const received = fn();
      const passed = deepEqual(received, tc.expected);
      return { label: tc.label, passed, expected: tc.expected, received };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e);
      return { label: tc.label, passed: false, expected: tc.expected, received: undefined, error };
    }
  });
};

/** Recursive deep-equality check (no external deps needed). */
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, (b as unknown[])[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    if (!deepEqual(ka, kb)) return false;
    return ka.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
    );
  }
  return false;
};
