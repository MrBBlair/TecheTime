import { useRef } from 'react';
import Logo from './Logo';

/**
 * Shared animated background: floating purple/gold clocks and logos on white.
 * Used by Kiosk and Layout (main app pages).
 */
export default function FloatingBackground() {
  const clockPositions = useRef(
    Array.from({ length: 15 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 120 + Math.random() * 120,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
      type: Math.random() > 0.5 ? ('clock' as const) : ('logo' as const),
      color: Math.random() > 0.5 ? ('purple' as const) : ('gold' as const),
    }))
  ).current;

  return (
    <>
      {clockPositions.map((pos, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
            animation: `float-clock-${i % 5} ${pos.duration}s ease-in-out infinite`,
            animationDelay: `${pos.delay}s`,
            opacity: pos.type === 'logo' ? 0.2 : 0.18,
          }}
        >
          {pos.type === 'logo' ? (
            <img
              src="/logo.png"
              alt=""
              aria-hidden
              style={{
                width: `${pos.size}px`,
                height: 'auto',
                filter:
                  pos.color === 'purple'
                    ? 'drop-shadow(0 0 12px rgba(75, 46, 131, 0.6)) drop-shadow(0 0 6px rgba(201, 162, 39, 0.5))'
                    : 'drop-shadow(0 0 12px rgba(201, 162, 39, 0.6)) drop-shadow(0 0 6px rgba(75, 46, 131, 0.5))',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: `${pos.size}px`,
                color: pos.color === 'purple' ? '#4B2E83' : '#C9A227',
                textShadow:
                  pos.color === 'purple'
                    ? '0 0 12px rgba(75, 46, 131, 0.6), 0 0 6px rgba(201, 162, 39, 0.5), 3px 3px 6px rgba(75, 46, 131, 0.4)'
                    : '0 0 12px rgba(201, 162, 39, 0.6), 0 0 6px rgba(75, 46, 131, 0.5), 3px 3px 6px rgba(201, 162, 39, 0.4)',
                filter: 'drop-shadow(0 0 8px currentColor)',
              }}
            >
              🕐
            </span>
          )}
        </div>
      ))}

      <style>{`
        @keyframes float-clock-0 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -30px) rotate(90deg); }
          50% { transform: translate(-15px, 20px) rotate(180deg); }
          75% { transform: translate(30px, 10px) rotate(270deg); }
        }
        @keyframes float-clock-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-25px, 25px) rotate(120deg); }
          66% { transform: translate(25px, -20px) rotate(240deg); }
        }
        @keyframes float-clock-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(15px, -25px) rotate(72deg); }
          40% { transform: translate(-20px, 15px) rotate(144deg); }
          60% { transform: translate(25px, 20px) rotate(216deg); }
          80% { transform: translate(-15px, -10px) rotate(288deg); }
        }
        @keyframes float-clock-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, -30px) rotate(180deg); }
        }
        @keyframes float-clock-4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-30px, 20px) rotate(90deg); }
          50% { transform: translate(20px, 30px) rotate(180deg); }
          75% { transform: translate(-20px, -25px) rotate(270deg); }
        }
      `}</style>

      <div
        className="absolute top-0 left-0 right-0 flex items-start justify-center pointer-events-none pt-8"
        style={{ zIndex: 0 }}
      >
        <Logo variant="kioskBackground" alt="" />
      </div>
    </>
  );
}
