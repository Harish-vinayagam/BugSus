import { useState, useCallback, useEffect } from 'react';
import CRTFrame from '@/components/CRTFrame';
import CRTIntro from '@/components/CRTIntro';
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
import { getTasksForCategory } from '@/data/tasks';
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

  const room = useRoom();

  // ── React to server-driven phase changes ──────────────────────────────────

  // game_started → ALL players (host + non-host) move to category vote screen
  useEffect(() => {
    if (room.gamePhase === 'category_vote') {
      setScreen('category');
    }
  }, [room.gamePhase]);

  // category_selected → compute local tasks then go to role_reveal
  useEffect(() => {
    if (room.gamePhase === 'role_reveal' && room.selectedCategory && room.myRole) {
      setRoundTasks(getTasksForCategory(room.selectedCategory, room.myRole));
      setScreen('role');
    }
  }, [room.gamePhase, room.selectedCategory, room.myRole]);

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

  // Meeting screen done (after vote_result reveal delay)
  const handleMeetingComplete = useCallback(() => {
    if (room.gameOver) {
      setScreen('final');
    } else {
      setScreen('summary');
    }
  }, [room.gameOver]);

  // Summary screen 5s countdown done → server already fired next_round_started
  // but give a manual path too
  const handleSummaryComplete = useCallback(() => {
    setScreen('category');
  }, []);

  const handlePlayAgain = useCallback(() => {
    room.disconnect();
    setScreen('boot');
    setPlayerName('');
    setRoomCode('');
    setRoundTasks([]);
    setTasksCompleted(0);
  }, [room]);

  const handleExit = useCallback(() => {
    room.disconnect();
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
            onEmergency={handleEmergency}
            onTimerEnd={handleTimerEnd}
            onTasksCompleted={handleTasksCompleted}
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

        {screen === 'summary' && room.voteResult && (
          <RoundSummaryScreen
            round={room.round}
            ejected={room.voteResult.ejectedUsername}
            ejectedWasIntern={room.voteResult.ejectedWasIntern}
            internName={room.voteResult.internUsername}
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

      </CRTFrame>
    </>
  );
};

export default Index;
