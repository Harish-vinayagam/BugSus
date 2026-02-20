/**
 * Validates the player's submitted code against the expected solution.
 *
 * Current strategy: normalised exact-match (trim whitespace).
 *
 * To move validation server-side, replace this function body with:
 *
 *   const res = await fetch('/api/tasks/validate', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ userCode, expectedSolution }),
 *   });
 *   const { valid } = await res.json();
 *   return valid;
 *
 * The call-site in MainGameScreen does not need to change at all.
 */
export const validateTask = (
  userCode: string,
  expectedSolution: string
): boolean => {
  return userCode.trim() === expectedSolution.trim();
};
