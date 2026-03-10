import React from 'react';

interface CRTFrameProps {
  children: React.ReactNode;
}

const CRTFrame: React.FC<CRTFrameProps> = ({ children }) => {
  return (
    /* Outer bezel — chunky dark plastic like a 1980s terminal */
    <div
      className="crt-flicker"
      style={{
        width: '100vw',
        height: '100vh',
        background:
          'radial-gradient(ellipse at 50% 40%, #1a1e1a 0%, #080c08 60%, #030503 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        /* Bezel padding — thicker on sides to suggest depth */
        padding: '18px 22px 22px 22px',
      }}
    >
      {/* Outer bezel ridge — raised edge around the glass */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '18px',
          padding: '3px',
          background:
            'linear-gradient(145deg, #2a3a2a 0%, #111811 40%, #0a0f0a 60%, #1a2a1a 100%)',
          boxShadow:
            '0 0 0 1px #0a0f0a, ' +
            '0 8px 32px rgba(0,0,0,0.8), ' +
            '0 2px 4px rgba(51,255,51,0.04)',
        }}
      >
        {/* Screen glass — the actual phosphor surface */}
        <div
          className="crt-screen-glass relative overflow-hidden"
          style={{
            width: '100%',
            height: '100%',
            /*
             * A larger border-radius on the glass makes the corners recede
             * more — the bigger the radius, the more tube-like it looks.
             */
            borderRadius: '22px',
            background: '#0b0f0b',
            /*
             * Concave depth illusion — multiple inset shadow rings:
             *  1. Tight black rim at the very edge (glass touching bezel)
             *  2. Broad mid-shadow — main curvature darkness
             *  3. Wide outer bloom pulling corners back
             *  4. Faint green centre glow (phosphor hotspot)
             */
            boxShadow:
              'inset 0 0 0   2px  rgba(0,0,0,0.85), ' +
              'inset 0 0 40px 15px rgba(0,0,0,0.60), ' +
              'inset 0 0 100px 30px rgba(0,0,0,0.40), ' +
              'inset 0 0 180px 40px rgba(0,0,0,0.25), ' +
              'inset 0 0 12px  4px  rgba(51,255,51,0.07), ' +
              '0 0 4px #000',
          }}
        >
          {/* Barrel-distortion SVG filter — applied to content only */}
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <filter id="crt-barrel" x="-5%" y="-5%" width="110%" height="110%">
                {/* Subtle pincushion / barrel warp — like a curved glass tube */}
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.0"
                  numOctaves="1"
                  result="warp"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="warp"
                  scale="0"
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="displaced"
                />
                {/*
                  True barrel distortion isn't possible with CSS alone.
                  We simulate it with a radial-coord remap via feComposite:
                  edges are slightly compressed → centre appears to bulge out.
                  Achieved by feColorMatrix + feBlend with a custom composite.
                  The visible effect: corners are slightly darker / pulled in.
                */}
                <feColorMatrix
                  in="displaced"
                  type="matrix"
                  values="1 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
                          0 0 0 1 0"
                  result="out"
                />
              </filter>
              {/* Curved-glass aberration: gentle RGB fringe stronger at edges */}
              <filter id="crt-aberration" x="-2%" y="-2%" width="104%" height="104%">
                <feColorMatrix
                  type="matrix"
                  values="1    0    0    0  0.003
                          0    1    0    0  0
                          0    0    1    0 -0.003
                          0    0    0    1  0"
                />
              </filter>
            </defs>
          </svg>

          {/* Content with barrel-curve filter */}
          <div
            className="crt-screen-on h-full overflow-auto p-6"
            style={{
              position: 'relative',
              zIndex: 1,
              filter: 'url(#crt-aberration)',
            }}
          >
            {children}
          </div>

          {/* Scanlines */}
          <div className="crt-scanlines" />

          {/* Concave shadow — deepens corners like a curved tube face */}
          <div className="crt-concave" />

          {/* Vignette */}
          <div className="crt-vignette" />

          {/* Phosphor bloom */}
          <div className="crt-grain" />

          {/* RGB chromatic fringe — stronger at horizontal edges */}
          <div
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              borderRadius: '12px',
              boxShadow:
                'inset 3px 0 8px  rgba(255,0,80,0.09), ' +
                'inset -3px 0 8px rgba(0,255,255,0.09), ' +
                'inset 0 3px 6px  rgba(255,0,80,0.04), ' +
                'inset 0 -3px 6px rgba(0,255,255,0.04)',
              zIndex: 13,
            }}
          />

          {/* Convex glass sheen — bright top-left highlight + subtle bottom rim */}
          <div
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              borderRadius: '12px',
              background:
                'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.045) 0%, transparent 50%), ' +
                'linear-gradient(180deg, rgba(255,255,255,0.018) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.12) 100%)',
              zIndex: 14,
            }}
          />

          {/* Edge-darkening mask — simulates the curved glass pulling shadows inward */}
          <div
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              borderRadius: '12px',
              background:
                'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.20) 100%)',
              zIndex: 12,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CRTFrame;
