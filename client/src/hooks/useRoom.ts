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
  CodeSyncedPayload,
  ChatBroadcastPayload,
  TaskCompletionBroadcastPayload,
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
  broadcastCode: (code: string, taskId: string) => void;
  broadcastTaskCompleted: (taskId: string) => void;
  sendChat: (text: string) => void;
  // game state
  gamePhase: string;
  round: number;
  myRole: 'engineer' | 'intern' | null;
  myTaskIds: string[];       // server-assigned task IDs — identical for all engineers
  categoryVotes: Record<string, number>;
  selectedCategory: string;
  meetingPlayers: Player[];
  meetingTriggeredBy: string;
  ejectionVotes: Record<string, number>;
  voteResult: VoteResultPayload | null;
  taskProgress: Record<string, number>;
  gameOver: GameOverPayload | null;
  // multiplayer code sync
  sharedCode: string;
  sharedCodeTaskId: string;
  sharedCodeSender: string;
  // shared task completions
  completedTaskIds: string[];
  // chat
  chatMessages: { username: string; text: string }[];
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
  const [myTaskIds, setMyTaskIds]               = useState<string[]>([]);
  const [categoryVotes, setCategoryVotes]       = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [meetingPlayers, setMeetingPlayers]     = useState<Player[]>([]);
  const [meetingTriggeredBy, setMeetingTriggeredBy] = useState('');
  const [ejectionVotes, setEjectionVotes]       = useState<Record<string, number>>({});
  const [voteResult, setVoteResult]             = useState<VoteResultPayload | null>(null);
  const [taskProgress, setTaskProgress]         = useState<Record<string, number>>({});
  const [gameOver, setGameOver]                 = useState<GameOverPayload | null>(null);
  const [sharedCode, setSharedCode]             = useState<string>('');
  const [sharedCodeTaskId, setSharedCodeTaskId] = useState('');
  const [sharedCodeSender, setSharedCodeSender] = useState('');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [chatMessages, setChatMessages]         = useState<{ username: string; text: string }[]>([]);

  // store roomId in a ref so socket callbacks always have the latest value
  const roomIdRef = useRef('');
  // Pending create/join stored in refs so the connect handler can flush them
  const pendingCreate = useRef<string | null>(null);
  const pendingJoin   = useRef<{ rid: string; username: string } | null>(null);

  useEffect(() => {
    const onConnect = () => {
      // Status is advanced by onReconnectEmit (second useEffect).
      // Nothing to do here — kept so connect_error cleanup has a counterpart.
    };
    const onConnectError = (err: Error) => {
      // Clear any pending emissions so they don't fire on a later reconnect
      pendingCreate.current = null;
      pendingJoin.current   = null;
      setStatus('error');
      setError(`Could not reach server. ${err?.message ?? 'Is it running?'}`);
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
      setTaskProgress({}); setMyTaskIds([]);
      setCompletedTaskIds([]); setChatMessages([]);
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
      setMyTaskIds(p.taskIds ?? []);
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
      setSharedCode(''); setSharedCodeTaskId(''); setSharedCodeSender('');
      setMyTaskIds([]);
      setCompletedTaskIds([]);
      setChatMessages([]);
      setGamePhase('category_vote');
    };
    const onCodeSynced = (p: CodeSyncedPayload) => {
      setSharedCode(p.code);
      setSharedCodeTaskId(p.taskId);
      setSharedCodeSender(p.senderName);
    };
    const onChatBroadcast = (p: ChatBroadcastPayload) => {
      setChatMessages((prev) => [...prev, { username: p.username, text: p.text }]);
    };
    const onTaskCompletionBroadcast = (p: TaskCompletionBroadcastPayload) => {
      setCompletedTaskIds((prev) => prev.includes(p.taskId) ? prev : [...prev, p.taskId]);
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
    socket.on('code_synced',               onCodeSynced);
    socket.on('chat_broadcast',            onChatBroadcast);
    socket.on('task_completion_broadcast', onTaskCompletionBroadcast);

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
      socket.off('code_synced',               onCodeSynced);
      socket.off('chat_broadcast',            onChatBroadcast);
      socket.off('task_completion_broadcast', onTaskCompletionBroadcast);
    };
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  // Single persistent connect handler that flushes any pending create/join
  useEffect(() => {
    const onReconnectEmit = () => {
      if (pendingCreate.current !== null) {
        const username = pendingCreate.current;
        pendingCreate.current = null;
        setStatus('creating');
        socket.emit('create_room', { username });
      } else if (pendingJoin.current !== null) {
        const { rid, username } = pendingJoin.current;
        pendingJoin.current = null;
        setStatus('joining');
        socket.emit('join_room', { roomId: rid, username });
      }
    };
    socket.on('connect', onReconnectEmit);
    return () => { socket.off('connect', onReconnectEmit); };
  }, []);

  const createRoom = useCallback((username: string) => {
    setStatus('connecting'); setError('');
    pendingCreate.current = username;
    pendingJoin.current   = null;
    if (socket.connected) {
      pendingCreate.current = null;
      setStatus('creating');
      socket.emit('create_room', { username });
    } else {
      socket.connect();
      // onReconnectEmit above will fire on connect and flush pendingCreate
    }
  }, []);

  const joinRoom = useCallback((rid: string, username: string) => {
    setStatus('connecting'); setError('');
    pendingJoin.current   = { rid, username };
    pendingCreate.current = null;
    if (socket.connected) {
      pendingJoin.current = null;
      setStatus('joining');
      socket.emit('join_room', { roomId: rid, username });
    } else {
      socket.connect();
      // onReconnectEmit above will fire on connect and flush pendingJoin
    }
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

  const broadcastCode = useCallback((code: string, taskId: string) => {
    if (!roomIdRef.current) return;
    socket.emit('code_change', { roomId: roomIdRef.current, code, taskId });
  }, []);

  const broadcastTaskCompleted = useCallback((taskId: string) => {
    if (!roomIdRef.current) return;
    socket.emit('task_completed', { roomId: roomIdRef.current, taskId });
  }, []);

  const sendChat = useCallback((text: string) => {
    if (!roomIdRef.current || !text.trim()) return;
    socket.emit('chat_message', { roomId: roomIdRef.current, text: text.trim() });
  }, []);

  return {
    status, roomId, players, error,
    createRoom, joinRoom, disconnect,
    startGame, castCategoryVote, triggerMeeting, castEjectionVote,
    reportTaskProgress, broadcastCode, broadcastTaskCompleted, sendChat,
    gamePhase, round, myRole, myTaskIds, categoryVotes, selectedCategory,
    meetingPlayers, meetingTriggeredBy, ejectionVotes, voteResult,
    taskProgress, gameOver,
    sharedCode, sharedCodeTaskId, sharedCodeSender,
    completedTaskIds,
    chatMessages,
  };
};
