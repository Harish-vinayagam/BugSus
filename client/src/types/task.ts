/**
 * Mirrors server/src/types/task.ts exactly.
 * When server-side validation is introduced, this contract guarantees
 * the request/response shape stays in sync without a shared package.
 */

export type TaskCategory = 'FRONTEND' | 'BACKEND' | 'OOPS' | 'DSA';

export interface TestCase {
  /** JavaScript expression to evaluate (has access to the submitted function) */
  call: string;
  /** Expected return value (deep-equal compared) */
  expected: unknown;
  label: string;
}

export interface Task {
  id: string;
  category: TaskCategory;
  /** Who this task is designed for */
  forRole: 'engineer' | 'intern';
  title: string;
  description: string;
  starterCode: string;
  solution: string;
  testCases: TestCase[];
}
