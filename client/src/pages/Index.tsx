import { useState, useCallback, useRef } from 'react';
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
import type { Task } from '@/types/task';

type Screen =
  | 'boot'
  | 'create'
  | 'join'
  | 'lobby'
  | 'category'
  | 'role'
  | 'game'
  | 'emergency'
  | 'meeting'
  | 'summary'
  | 'final';

// The AI players excluding the local player slot (filled in at game-start)
const BOT_NAMES = ['CIPHER', 'NULLPTR', 'STACK0F'];

const Index = () => {
  const [introComplete, setIntroComplete] = useState(false);
  const [screen, setScreen] = useState<Screen>('boot');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [category, setCategory] = useState('FRONTEND');
  const [role, setRole] = useState<'engineer' | 'intern'>('engineer');
  const [round, setRound] = useState(1);
  const [winner, setWinner] = useState<'engineers' | 'intern'>('engineers');
  const [alivePlayers, setAlivePlayers] = useState<string[]>([]);
  const [emergencyTrigger, setEmergencyTrigger] = useState<'button' | 'timer'>('button');
  const [roundTasks, setRoundTasks] = useState<Task[]>([]);
  const [tasksCompleted, setTasksCompleted] = useState(0);

  // The intern's identity — set once per game, never changes between rounds
  const internNameRef = useRef<string>('');
  // Track the last ejected player and whether they were actually the intern
  const [lastEjected, setLastEjected] = useState<string | null>(null);
  const [lastEjectedWasIntern, setLastEjectedWasIntern] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleBootSelect = useCallback((mode: 'create' | 'join') => {
    setScreen(mode === 'create' ? 'create' : 'join');
  }, []);

  const handleCreateJoinSubmit = useCallback((name: string, code: string) => {
    setPlayerName(name);
    setRoomCode(code);
    setScreen('lobby');
  }, []);

  const handleGameStart = useCallback(() => {
    setScreen('category');
  }, []);

  const handleCategoryComplete = useCallback((cat: string, currentPlayerName: string, currentRole: string) => {
    setCategory(cat);

    // On round 1: assign role + pick intern identity
    // On subsequent rounds: keep same role, just get new tasks
    if (round === 1 || currentRole === '') {
      const assignedRole: 'engineer' | 'intern' = Math.random() < 0.75 ? 'engineer' : 'intern';
      setRole(assignedRole);

      // Pick who the intern is — if player is intern it's them, else pick a random bot
      if (assignedRole === 'intern') {
        internNameRef.current = currentPlayerName;
      } else {
        internNameRef.current = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      }

      setRoundTasks(getTasksForCategory(cat, assignedRole));
      setScreen('role');
    } else {
      // Subsequent rounds: same role, fresh tasks for the new category
      setRoundTasks(getTasksForCategory(cat, currentRole as 'engineer' | 'intern'));
      setScreen('role');
    }
  }, [round]);

  const handleRoleComplete = useCallback((currentPlayerName: string) => {
    const players = [currentPlayerName, ...BOT_NAMES];
    setAlivePlayers(players);
    setScreen('game');
  }, []);

  const handleEmergency = useCallback(() => {
    setEmergencyTrigger('button');
    setScreen('emergency');
  }, []);

  const handleTimerEnd = useCallback(() => {
    setEmergencyTrigger('timer');
    setScreen('emergency');
  }, []);

  const handleEmergencyComplete = useCallback(() => {
    setScreen('meeting');
  }, []);

  const handleTasksCompleted = useCallback((count: number) => {
    setTasksCompleted(count);
  }, []);

  const handleMeetingComplete = useCallback((ejected: string | null, currentRole: string, currentRound: number, currentAlivePlayers: string[]) => {
    const internName = internNameRef.current;
    const ejectedIsIntern = ejected === internName;

    setLastEjected(ejected);
    setLastEjectedWasIntern(ejectedIsIntern);

    const nextAlive = ejected
      ? currentAlivePlayers.filter((p) => p !== ejected)
      : currentAlivePlayers;
    setAlivePlayers(nextAlive);

    // Win conditions:
    // 1. Intern ejected → Engineers win immediately
    if (ejectedIsIntern) {
      setWinner('engineers');
      setScreen('final');
      return;
    }

    // 2. Only intern + ≤1 engineer left → Intern wins
    const engineersLeft = nextAlive.filter((p) => p !== internName).length;
    if (engineersLeft <= 1) {
      setWinner('intern');
      setScreen('final');
      return;
    }

    // 3. Final round elapsed → Intern wins (survived 3 rounds)
    if (currentRound >= 3) {
      setWinner('intern');
      setScreen('final');
      return;
    }

    // Otherwise: show round summary, then next round category vote
    setScreen('summary');
  }, []);

  const handleSummaryComplete = useCallback(() => {
    setRound((r) => r + 1);
    setScreen('category');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setRound(1);
    setRole('engineer');
    internNameRef.current = '';
    setLastEjected(null);
    setTasksCompleted(0);
    setScreen('category');
  }, []);

  const handleExit = useCallback(() => {
    setScreen('boot');
    setRound(1);
    setRole('engineer');
    internNameRef.current = '';
    setLastEjected(null);
    setTasksCompleted(0);
    setPlayerName('');
    setRoomCode('');
  }, []);

  return (
    <>
      {!introComplete && <CRTIntro onComplete={() => setIntroComplete(true)} />}
      <CRTFrame>
        {screen === 'boot' && <BootScreen onSelect={handleBootSelect} />}
        {(screen === 'create' || screen === 'join') && (
          <CreateJoinScreen
            mode={screen}
            onSubmit={handleCreateJoinSubmit}
            onBack={() => setScreen('boot')}
          />
        )}
        {screen === 'lobby' && (
          <LobbyScreen
            playerName={playerName}
            roomCode={roomCode}
            onStart={handleGameStart}
          />
        )}
        {screen === 'category' && (
          <CategoryVoteScreen
            round={round}
            onComplete={(cat) => handleCategoryComplete(cat, playerName, role)}
          />
        )}
        {screen === 'role' && (
          <RoleRevealScreen
            role={role}
            round={round}
            onComplete={() => handleRoleComplete(playerName)}
          />
        )}
        {screen === 'game' && (
          <MainGameScreen
            playerName={playerName}
            round={round}
            category={category}
            role={role}
            tasks={roundTasks}
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
            internName={internNameRef.current}
            onComplete={(ejected) => handleMeetingComplete(ejected, role, round, alivePlayers)}
          />
        )}
        {screen === 'summary' && (
          <RoundSummaryScreen
            round={round}
            ejected={lastEjected}
            ejectedWasIntern={lastEjectedWasIntern}
            internName={internNameRef.current}
            alivePlayers={alivePlayers}
            tasksCompleted={tasksCompleted}
            totalTasks={roundTasks.length}
            onComplete={handleSummaryComplete}
          />
        )}
        {screen === 'final' && (
          <FinalScreen
            winner={winner}
            internName={internNameRef.current}
            playerRole={role}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        )}
      </CRTFrame>
    </>
  );
};

export default Index;
