import { useState, useCallback } from 'react';
import CRTFrame from '@/components/CRTFrame';
import BootScreen from '@/components/BootScreen';
import CreateJoinScreen from '@/components/CreateJoinScreen';
import LobbyScreen from '@/components/LobbyScreen';
import CategoryVoteScreen from '@/components/CategoryVoteScreen';
import RoleRevealScreen from '@/components/RoleRevealScreen';
import MainGameScreen from '@/components/MainGameScreen';
import MeetingScreen from '@/components/MeetingScreen';
import FinalScreen from '@/components/FinalScreen';

type Screen =
  | 'boot'
  | 'create'
  | 'join'
  | 'lobby'
  | 'category'
  | 'role'
  | 'game'
  | 'meeting'
  | 'final';

const ALL_PLAYERS = ['', 'CIPHER', 'NULLPTR', 'STACK0F'];

const Index = () => {
  const [screen, setScreen] = useState<Screen>('boot');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [category, setCategory] = useState('FRONTEND');
  const [role, setRole] = useState<'engineer' | 'intern'>('engineer');
  const [round, setRound] = useState(1);
  const [winner, setWinner] = useState<'engineers' | 'intern'>('engineers');
  const [alivePlayers, setAlivePlayers] = useState<string[]>([]);

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

  const handleCategoryComplete = useCallback((cat: string) => {
    setCategory(cat);
    // Randomly assign role (75% engineer, 25% intern)
    setRole(Math.random() < 0.75 ? 'engineer' : 'intern');
    setScreen('role');
  }, []);

  const handleRoleComplete = useCallback(() => {
    const players = [playerName, ...ALL_PLAYERS.filter(Boolean)];
    setAlivePlayers(players);
    setScreen('game');
  }, [playerName]);

  const handleEmergency = useCallback(() => {
    setScreen('meeting');
  }, []);

  const handleTimerEnd = useCallback(() => {
    setScreen('meeting');
  }, []);

  const handleMeetingComplete = useCallback((ejected: string | null) => {
    if (ejected) {
      setAlivePlayers((prev) => prev.filter((p) => p !== ejected));
    }

    if (round >= 3) {
      // Game over
      setWinner(Math.random() < 0.6 ? 'engineers' : 'intern');
      setScreen('final');
    } else {
      setRound((r) => r + 1);
      setScreen('game');
    }
  }, [round]);

  const handlePlayAgain = useCallback(() => {
    setRound(1);
    setScreen('category');
  }, []);

  const handleExit = useCallback(() => {
    setScreen('boot');
    setRound(1);
    setPlayerName('');
    setRoomCode('');
  }, []);

  return (
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
        <CategoryVoteScreen onComplete={handleCategoryComplete} />
      )}
      {screen === 'role' && (
        <RoleRevealScreen role={role} onComplete={handleRoleComplete} />
      )}
      {screen === 'game' && (
        <MainGameScreen
          playerName={playerName}
          round={round}
          category={category}
          role={role}
          onEmergency={handleEmergency}
          onTimerEnd={handleTimerEnd}
        />
      )}
      {screen === 'meeting' && (
        <MeetingScreen
          playerName={playerName}
          players={alivePlayers}
          onComplete={handleMeetingComplete}
        />
      )}
      {screen === 'final' && (
        <FinalScreen
          winner={winner}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}
    </CRTFrame>
  );
};

export default Index;
