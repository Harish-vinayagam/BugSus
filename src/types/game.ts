/**
 * Global game state shape.
 * Extend here as multiplayer / socket state grows.
 */
export type PlayerRole = 'engineer' | 'intern';

export interface GameState {
  playerName: string;
  roomCode: string;
  role: PlayerRole;
  round: number;
  /** ID of the task the player is currently working on. */
  currentTaskId: string | undefined;
  /** IDs of tasks the player has already completed this round. */
  completedTaskIds: string[];
}
