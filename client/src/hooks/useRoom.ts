import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '@/lib/socket';
import type {
  Player,
  RoleAssignedPayload,
  CategorySelectedPayload,
  CategoryVoteUpdatePayload,
  MeetingStartedPayload,
  EjectionVoteUpdatePayload,
  VoteResultPayload,
  GameOverPayload,
  NextRoundStartedPayload,
  TaskProgressUpdatePayload,
} from '../../../shared/types';

export type RoomStatus =
  | 'idle'
  | 'connecting'
  | 'creating'
  | 'joining'
  | 'in_room'
  | 'error';

export interface UseRoomReturn {
  // connection
  status: RoomStatus;
  roomId: string;
  players: Player[];
  error: string;
  createRoom: (username: string) => void;
  joinRoom: (roomId: string, username: string) => void;
  disconnect: () => void;
  // game actions
  startGame: () => void;
  castCategoryVote: (category: string) => void;
  triggerMeeting: () => void;
  castEjectionVote: (targetId: string | 'SKIP') => void;
  reportTaskProgress: (count: number) => void;
  // game state
  gamePhase: string;
  round: number;
  myRole: 'engineer' | 'intern' | null;
  categoryVotes: Record<string, number>;
  selectedCategory: string;
  meetingPlayers: Player[];
  meetingTriggeredBy: string;
  ejectionVotes: Record<string, number>;
  voteResult: VoteResultPayload | null;
  taskProgress: Record<string, number>; // username → count
  gameOver: GameOverPayload | null;
}

export const useRoom = (): UseRoomReturn => {
  const [status, setStatus]     = useState<RoomStatus>('idle');
  const [roomId, setRoomId]     = useState('');
  const [players, setPlayers]   = useState<Player[]>([]);
  const [error, setError]       = useState('');

  // game state
  const [gamePhase, setGamePhase]               = useState('lobby');
  const [round, setRound]                       = useState(1);
  const [myRole, setMyRole]                     = useState<'engineer' | 'intern' | null>(null);
  const [categoryVotes, setCategoryVotes]       = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [meetingPlayers, setMeetingPlayers]     = useState<Player[]>([]);
  const [meetingTriggeredBy, setMeetingTriggeredBy] = useState('');
  const [ejectionVotes, setEjectionVotes]       = useState<Record<string, number>>({});
  const [voteResult, setVoteResult]             = useState<VoteResultPayload | null>(null);
  const [taskProgress, setTaskProgress]         = useState<Record<string, number>>({});
  const [gameOver, setGameOver]                 = useState<GameOverPayload | null>(null);

  // store roomId in a ref so socket callbacks always have the latest value
  const roomIdRef = useRef('');

  useEffect(() => {
    const onConnect = () => {
      setStatus((s) => s === 'connecting' ? 'creating' : s);
    };
    const onConnectError = () => {
      setStatus('error');
      setError('Could not reach server. Is it running?');
    };
    const onRoomCreated = (p: { roomId: string; players: Player[] }) => {
      setRoomId(p.roomId); roomIdRef.current = p.roomId;
      setPlayers(p.players); setStatus('in_room');
    };
    const onRoomJoined = (p: { roomId: string; players: Player[] }) => {
      setRoomId(p.roomId); roomIdRef.current = p.roomId;
      setPlayers(p.players); setStatus('in_room');
    };
    const onPlayerListUpdate = (p: { roomId: string; players: Player[] }) => {
      setPlayers(p.players);
    };
    const onRoomError = (p: { message: string }) => {
      setStatus('error'); setError(p.message);
    };
    const onGameStarted = (p: { players: Player[]; round: number }) => {
      setPlayers(p.players); setRound(p.round);
      setGamePhase('category_vote');
      setCategoryVotes({}); setSelectedCategory('');
      setVoteResult(null); setGameOver(null);
      setTaskProgress({});
    };
    const onCategoryVoteUpdate = (p: CategoryVoteUpdatePayload) => {
      setCategoryVotes(p.votes);
    };
    const onCategorySelected = (p: CategorySelectedPayload) => {
      setSelectedCategory(p.category);
      setCategoryVotes(p.votes);
      setGamePhase('role_reveal');
    };
    const onRoleAssigned = (p: RoleAssignedPayload) => {
      setMyRole(p.role); setRound(p.round);
      setGamePhase('role_reveal');
    };
    const onMeetingStarted = (p: MeetingStartedPayload) => {
      setMeetingPlayers(p.players);
      setMeetingTriggeredBy(p.triggeredBy);
      setEjectionVotes({});
      setVoteResult(null);
      setGamePhase('meeting');
    };
    const onEjectionVoteUpdate = (p: EjectionVoteUpdatePayload) => {
      setEjectionVotes(p.votes);
    };
    const onVoteResult = (p: VoteResultPayload) => {
      setVoteResult(p);
      setPlayers((prev) => prev.map((pl) => ({
        ...pl,
        alive: p.alivePlayers.some((a) => a.id === pl.id),
      })));
      setGamePhase('summary');
    };
    const onTaskProgressUpdate = (p: TaskProgressUpdatePayload) => {
      setTaskProgress((prev) => ({ ...prev, [p.username]: p.count }));
    };
    const onGameOver = (p: GameOverPayload) => {
      setGameOver(p); setGamePhase('final');
    };
    const onNextRoundStarted = (p: NextRoundStartedPayload) => {
      setRound(p.round); setPlayers(p.players);
      setCategoryVotes({}); setSelectedCategory('');
      setVoteResult(null); setEjectionVotes({});
      setGamePhase('category_vote');
    };

    socket.on('connect',               onConnect);
    socket.on('connect_error',         onConnectError);
    socket.on('room_created',          onRoomCreated);
    socket.on('room_joined',           onRoomJoined);
    socket.on('player_list_update',    onPlayerListUpdate);
    socket.on('room_error',            onRoomError);
    socket.on('game_started',          onGameStarted);
    socket.on('category_vote_update',  onCategoryVoteUpdate);
    socket.on('category_selected',     onCategorySelected);
    socket.on('role_assigned',         onRoleAssigned);
    socket.on('meeting_started',       onMeetingStarted);
    socket.on('ejection_vote_update',  onEjectionVoteUpdate);
    socket.on('vote_result',           onVoteResult);
    socket.on('task_progress_update',  onTaskProgressUpdate);
    socket.on('game_over',             onGameOver);
    socket.on('next_round_started',    onNextRoundStarted);

    return () => {
      socket.off('connect',               onConnect);
      socket.off('connect_error',         onConnectError);
      socket.off('room_created',          onRoomCreated);
      socket.off('room_joined',           onRoomJoined);
      socket.off('player_list_update',    onPlayerListUpdate);
      socket.off('room_error',            onRoomError);
      socket.off('game_started',          onGameStarted);
      socket.off('category_vote_update',  onCategoryVoteUpdate);
      socket.off('category_selected',     onCategorySelected);
      socket.off('role_assigned',         onRoleAssigned);
      socket.off('meeting_started',       onMeetingStarted);
      socket.off('ejection_vote_update',  onEjectionVoteUpdate);
      socket.off('vote_result',           onVoteResult);
      socket.off('task_progress_update',  onTaskProgressUpdate);
      socket.off('game_over',             onGameOver);
      socket.off('next_round_started',    onNextRoundStarted);
    };
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────
  const createRoom = useCallback((username: string) => {
    setStatus('connecting'); setError('');
    socket.connect();
    socket.once('connect', () => {
      setStatus('creating');
      socket.emit('create_room', { username });
    });
  }, []);

  const joinRoom = useCallback((rid: string, username: string) => {
    setStatus('connecting'); setError('');
    socket.connect();
    socket.once('connect', () => {
      setStatus('joining');
      socket.emit('join_room', { roomId: rid, username });
    });
  }, []);

  const disconnect = useCallback(() => {
    socket.disconnect();
    setStatus('idle'); setRoomId(''); setPlayers([]); setError('');
    setGamePhase('lobby'); setMyRole(null);
  }, []);

  const startGame = useCallback(() => {
    socket.emit('start_game', { roomId: roomIdRef.current });
  }, []);

  const castCategoryVote = useCallback((category: string) => {
    socket.emit('category_vote', { roomId: roomIdRef.current, category });
  }, []);

  const triggerMeeting = useCallback(() => {
    socket.emit('start_meeting', { roomId: roomIdRef.current });
  }, []);

  const castEjectionVote = useCallback((targetId: string | 'SKIP') => {
    socket.emit('cast_vote', { roomId: roomIdRef.current, targetId });
  }, []);

  const reportTaskProgress = useCallback((count: number) => {
    socket.emit('task_progress', { roomId: roomIdRef.current, count });
  }, []);

  return {
    status, roomId, players, error,
    createRoom, joinRoom, disconnect,
    startGame, castCategoryVote, triggerMeeting, castEjectionVote, reportTaskProgress,
    gamePhase, round, myRole, categoryVotes, selectedCategory,
    meetingPlayers, meetingTriggeredBy, ejectionVotes, voteResult,
    taskProgress, gameOver,
  };
};
