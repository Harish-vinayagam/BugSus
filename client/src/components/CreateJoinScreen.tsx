import { useState } from 'react';

interface CreateJoinScreenProps {
  mode: 'create' | 'join';
  onSubmit: (name: string, roomCode: string) => void;
  onBack: () => void;
}

const CreateJoinScreen: React.FC<CreateJoinScreenProps> = ({ mode, onSubmit, onBack }) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [step, setStep] = useState<'name' | 'room' | 'ready'>('name');

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleNameSubmit = () => {
    if (!name.trim()) return;
    if (mode === 'create') {
      const code = generateRoomCode();
      setGeneratedCode(code);
      setStep('ready');
    } else {
      setStep('room');
    }
  };

  const handleRoomSubmit = () => {
    if (!roomCode.trim()) return;
    setStep('ready');
  };

  return (
    <div className="h-full flex flex-col justify-center font-mono">
      <div className="space-y-4">
        <p className="crt-glow" style={{ color: 'var(--crt-dim)' }}>
          {'>'} {mode === 'create' ? 'CREATE_ROOM' : 'JOIN_ROOM'} PROTOCOL
        </p>
        <div className="ascii-box" style={{ maxWidth: '500px' }}>
          {step === 'name' && (
            <div className="space-y-4">
              <p className="crt-glow">ENTER CALLSIGN:</p>
              <div className="flex items-center gap-2">
                <span className="crt-glow">{'>'}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 12))}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  className="bg-transparent border-none outline-none crt-glow font-mono text-base flex-1"
                  style={{ color: 'var(--crt-green)', caretColor: 'var(--crt-green)' }}
                  autoFocus
                  placeholder="YOUR_NAME"
                  maxLength={12}
                />
              </div>
              <button className="crt-button" onClick={handleNameSubmit} disabled={!name.trim()}>
                CONFIRM
              </button>
            </div>
          )}

          {step === 'room' && (
            <div className="space-y-4">
              <p className="crt-glow">CALLSIGN: {name}</p>
              <p className="crt-glow">ENTER ROOM CODE:</p>
              <div className="flex items-center gap-2">
                <span className="crt-glow">{'>'}</span>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && handleRoomSubmit()}
                  className="bg-transparent border-none outline-none crt-glow font-mono text-base tracking-[0.3em]"
                  style={{ color: 'var(--crt-green)', caretColor: 'var(--crt-green)' }}
                  autoFocus
                  placeholder="______"
                  maxLength={6}
                />
              </div>
              <button className="crt-button" onClick={handleRoomSubmit} disabled={!roomCode.trim()}>
                CONNECT
              </button>
            </div>
          )}

          {step === 'ready' && (
            <div className="space-y-4">
              <p className="crt-glow">CALLSIGN: {name}</p>
              <p className="crt-glow">
                ROOM CODE:{' '}
                <span className="crt-glow-accent text-xl tracking-[0.4em] font-terminal">
                  {mode === 'create' ? generatedCode : roomCode}
                </span>
              </p>
              <p className="crt-glow" style={{ color: 'var(--crt-dim)' }}>
                SHARE THIS CODE WITH OTHER PLAYERS
              </p>
              <button
                className="crt-button-accent crt-button"
                onClick={() => onSubmit(name, mode === 'create' ? generatedCode : roomCode)}
              >
                ENTER LOBBY {'>>'}
              </button>
            </div>
          )}
        </div>

        <button
          className="crt-button mt-4"
          onClick={onBack}
          style={{ fontSize: '0.875rem' }}
        >
          {'<'} BACK
        </button>
      </div>
    </div>
  );
};

export default CreateJoinScreen;
