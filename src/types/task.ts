/**
 * Mirrors server/src/types/task.ts exactly.
 * When server-side validation is introduced, this contract guarantees
 * the request/response shape stays in sync without a shared package.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  solution: string;
}
