import React from 'react';

interface CRTFrameProps {
  children: React.ReactNode;
}

const CRTFrame: React.FC<CRTFrameProps> = ({ children }) => {
  return (
    /* Outer bezel — dark plastic surround */
    <div
      className="crt-flicker"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#060906',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
      }}
    >
      {/* Screen glass — curved phosphor surface */}
      <div
        className="relative overflow-hidden"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '10px',
          background: '#0b0f0b',
          /* inward shadow fakes tube depth */
          boxShadow:
            'inset 0 0 80px rgba(0,0,0,0.7), ' +
            'inset 0 0 20px rgba(51,255,51,0.04), ' +
            '0 0 0 1px #1a2a1a, ' +
            '0 0 30px rgba(51,255,51,0.08)',
        }}
      >
        {/* Content */}
        <div className="crt-screen-on h-full overflow-auto p-6" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>

        {/* Scanlines */}
        <div className="crt-scanlines" />

        {/* Vignette */}
        <div className="crt-vignette" />

        {/* Phosphor bloom (replaces grain) */}
        <div className="crt-grain" />

        {/* RGB chromatic fringe along edges */}
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            borderRadius: '10px',
            boxShadow:
              'inset 2px 0 6px rgba(255,0,80,0.07), ' +
              'inset -2px 0 6px rgba(0,255,255,0.07)',
            zIndex: 13,
          }}
        />

        {/* Glass sheen — single diagonal highlight */}
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            borderRadius: '10px',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 35%)',
            zIndex: 14,
          }}
        />
      </div>
    </div>
  );
};

export default CRTFrame;
