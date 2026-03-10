import { useState, useCallback, useEffect, useRef } from 'react';
import CRTFrame from '@/components/CRTFrame';
import CRTIntro from '@/components/CRTIntro';
import CRTTransition, { styleForScreen } from '@/components/CRTTransition';
import BootScreen from '@/components/BootScreen';
import CreateJoinScreen from '@/components/CreateJoinScreen';
import LobbyScreen from '@/components/LobbyScreen';
import CategoryVoteScreen from '@/components/CategoryVoteScreen';
import RoleRevealScreen from '@/components/RoleRevealScreen';
import MainGameScreen from '@/components/MainGameScreen';
import EmergencyScreen from '@/components/EmergencyScreen';
import MeetingScreen from '@/components/MeetingScreen';
import RoundSummaryScreen from '@/components/RoundSummaryScreen';
import FinalScreen from '@/components/FinalScreen';
import { getTasksByIds } from '@/data/tasks';
import { useRoom } from '@/hooks/useRoom';
import type { Task } from '@/types/task';

type Screen =
  | 'boot' | 'create' | 'join' | 'lobby'
  | 'category' | 'role' | 'game'
  | 'emergency' | 'meeting' | 'summary' | 'final';

const Index = () => {
  const [introComplete, setIntroComplete]       = useState(false);
  const [screen, setScreen]                     = useState<Screen>('boot');
  const [playerName, setPlayerName]             = useState('');
  const [roomCode, setRoomCode]                 = useState('');
  const [emergencyTrigger, setEmergencyTrigger] = useState<'button' | 'timer'>('button');
  const [roundTasks, setRoundTasks]             = useState<Task[]>([]);
  const [tasksCompleted, setTasksCompleted]     = useState(0);
  // Track whether this is the very first round start vs a next-round transition
  const gameStartedRef = useRef(false);
  // Snapshot the vote result so the summary screen stays mounted until
  // the player navigates away (server clears voteResult on next_round_started)
  const [summaryVoteResult, setSummaryVoteResult] = useState<import('@/hooks/useRoom').UseRoomReturn['voteResult']>(null);

  const room = useRoom();

  // Snapshot voteResult into local state so summary screen stays alive even
  // after next_round_started clears room.voteResult
  useEffect(() => {
    if (room.voteResult) setSummaryVoteResult(room.voteResult);
  }, [room.voteResult]);

  // game_started → go to category screen (first round only)
  useEffect(() => {
    if (room.gamePhase === 'category_vote' && !gameStartedRef.current) {
      gameStartedRef.current = true;
      setScreen('category');
    }
  }, [room.gamePhase]);

  // role_reveal → go to role screen (both first round via category vote AND next rounds via next_round_started)
  useEffect(() => {
    if (room.gamePhase === 'role_reveal' && room.selectedCategory && room.myRole) {
      if (room.myTaskIds.length > 0) {
        setRoundTasks(getTasksByIds(room.myTaskIds));
      }
      // Delay so any winner banner can display before transitioning
      const t = setTimeout(() => setScreen('role'), 1500);
      return () => clearTimeout(t);
    }
  }, [room.gamePhase, room.selectedCategory, room.myRole, room.round]);

  // meeting_started → emergency interstitial first
  useEffect(() => {
    if (room.gamePhase === 'meeting') {
      setScreen('emergency');
    }
  }, [room.gamePhase]);

  // game_over → final screen
  useEffect(() => {
    if (room.gameOver) {
      setScreen('final');
    }
  }, [room.gameOver]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBootSelect = useCallback((mode: 'create' | 'join') => {
    setScreen(mode === 'create' ? 'create' : 'join');
  }, []);

  const handleCreateJoinSubmit = useCallback((name: string, code: string) => {
    setPlayerName(name);
    setRoomCode(code || room.roomId);
    setScreen('lobby');
  }, [room.roomId]);

  // Host clicks START — emits start_game to server
  // Screen transition is handled by the useEffect above (gamePhase → 'category_vote')
  // so ALL players (not just the host) get moved to the category screen
  const handleGameStart = useCallback(() => {
    room.startGame();
  }, [room]);

  // Role reveal finished → go to game screen
  const handleRoleComplete = useCallback(() => {
    setScreen('game');
  }, []);

  // Player clicks Emergency Meeting button in game
  const handleEmergency = useCallback(() => {
    setEmergencyTrigger('button');
    room.triggerMeeting();
    // server fires meeting_started → useEffect above sets screen='emergency'
  }, [room]);

  // Round timer expired
  const handleTimerEnd = useCallback(() => {
    setEmergencyTrigger('timer');
    room.triggerMeeting();
  }, [room]);

  const handleEmergencyComplete = useCallback(() => {
    setScreen('meeting');
  }, []);

  const handleTasksCompleted = useCallback((count: number) => {
    setTasksCompleted(count);
    room.reportTaskProgress(count);
  }, [room]);

  const handleTaskCompleted = useCallback((taskId: string) => {
    room.broadcastTaskCompleted(taskId);
  }, [room]);

  // Meeting screen done (after vote_result reveal delay)
  const handleMeetingComplete = useCallback(() => {
    if (room.gameOver) {
      setScreen('final');
    } else {
      setScreen('summary');
    }
  }, [room.gameOver]);

  // Summary countdown done — server will fire role_assigned shortly after,
  // which flips gamePhase → role_reveal and our useEffect navigates to 'role'.
  // Just clear the snapshot so the summary unmounts cleanly.
  const handleSummaryComplete = useCallback(() => {
    setSummaryVoteResult(null);
    // Navigation handled by the role_reveal useEffect above
  }, []);

  const handlePlayAgain = useCallback(() => {
    room.disconnect();
    gameStartedRef.current = false;
    setScreen('boot');
    setPlayerName('');
    setRoomCode('');
    setRoundTasks([]);
    setTasksCompleted(0);
  }, [room]);

  const handleExit = useCallback(() => {
    room.disconnect();
    gameStartedRef.current = false;
    setScreen('boot');
    setPlayerName('');
    setRoomCode('');
    setRoundTasks([]);
    setTasksCompleted(0);
  }, [room]);

  // ── Derived values ────────────────────────────────────────────────────────

  const alivePlayers = room.players.filter((p) => p.alive);

  return (
    <>
      {!introComplete && <CRTIntro onComplete={() => setIntroComplete(true)} />}
      <CRTFrame>
        <CRTTransition transitionKey={screen} style={styleForScreen(screen)}>

          {screen === 'boot' && (
            <BootScreen onSelect={handleBootSelect} />
          )}

          {(screen === 'create' || screen === 'join') && (
            <CreateJoinScreen
              mode={screen}
              onSubmit={handleCreateJoinSubmit}
              onBack={() => setScreen('boot')}
              onCreateRoom={room.createRoom}
              onJoinRoom={room.joinRoom}
              socketStatus={room.status}
              socketRoomId={room.roomId}
              socketError={room.error}
            />
          )}

          {screen === 'lobby' && (
            <LobbyScreen
              playerName={playerName}
              roomCode={roomCode || room.roomId}
              players={room.players}
              onStart={handleGameStart}
            />
          )}

          {screen === 'category' && (
            <CategoryVoteScreen
              round={room.round}
              totalPlayers={alivePlayers.length}
              votes={room.categoryVotes}
              selectedCategory={room.selectedCategory}
              onVote={room.castCategoryVote}
              onComplete={() => {/* transition driven by useEffect on role_reveal phase */}}
              timerEndsAt={room.categoryVoteEndsAt}
            />
          )}

          {screen === 'role' && (
            <RoleRevealScreen
              role={room.myRole ?? 'engineer'}
              round={room.round}
              onComplete={handleRoleComplete}
            />
          )}

          {screen === 'game' && (
            <MainGameScreen
              playerName={playerName}
              round={room.round}
              category={room.selectedCategory}
              role={room.myRole ?? 'engineer'}
              tasks={roundTasks}
              players={room.players}
              taskProgress={room.taskProgress}
              completedTaskIds={room.completedTaskIds}
              sharedCode={room.sharedCode}
              sharedCodeTaskId={room.sharedCodeTaskId}
              sharedCodeSender={room.sharedCodeSender}
              chatMessages={room.chatMessages}
              onCodeChange={room.broadcastCode}
              onChatSend={room.sendChat}
              onTaskCompleted={handleTaskCompleted}
              onEmergency={handleEmergency}
              onTimerEnd={handleTimerEnd}
              onTasksCompleted={handleTasksCompleted}
              timerEndsAt={room.gameTimerEndsAt}
            />
          )}

          {screen === 'emergency' && (
            <EmergencyScreen
              trigger={emergencyTrigger}
              onComplete={handleEmergencyComplete}
            />
          )}

          {screen === 'meeting' && (
            <MeetingScreen
              playerName={playerName}
              players={alivePlayers}
              triggeredBy={room.meetingTriggeredBy}
              ejectionVotes={room.ejectionVotes}
              voteResult={room.voteResult}
              onCastVote={room.castEjectionVote}
              onComplete={handleMeetingComplete}
            />
          )}

          {screen === 'summary' && summaryVoteResult && (
            <RoundSummaryScreen
              round={room.round > 1 ? room.round - 1 : room.round}
              ejected={summaryVoteResult.ejectedUsername}
              ejectedWasIntern={summaryVoteResult.ejectedWasIntern}
              internName={summaryVoteResult.internUsername}
              alivePlayers={alivePlayers.map((p) => p.username)}
              tasksCompleted={tasksCompleted}
              totalTasks={roundTasks.length}
              onComplete={handleSummaryComplete}
            />
          )}

          {screen === 'final' && room.gameOver && (
            <FinalScreen
              winner={room.gameOver.winner}
              internName={room.gameOver.internUsername}
              playerRole={room.myRole ?? 'engineer'}
              onPlayAgain={handlePlayAgain}
              onExit={handleExit}
            />
          )}

        </CRTTransition>
      </CRTFrame>
    </>
  );
};

export default Index;
