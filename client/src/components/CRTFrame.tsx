import React from 'react';

interface CRTFrameProps {
  children: React.ReactNode;
}

const CRTFrame: React.FC<CRTFrameProps> = ({ children }) => {
  return (
    <div
      className="crt-flicker relative overflow-hidden w-screen h-screen"
      style={{
        background: '#0b0f0b',
      }}
    >
      <div className="crt-screen-on h-full overflow-auto p-6">
        {children}
      </div>

      {/* CRT overlays */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />
      <div className="crt-grain" />
    </div>
  );
};

export default CRTFrame;
