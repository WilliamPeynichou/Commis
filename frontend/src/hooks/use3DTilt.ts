import { useCallback, useRef, useState } from 'react';

interface TiltState {
  rotateX: number;
  rotateY: number;
  scale: number;
  glareX: number;
  glareY: number;
}

interface Use3DTiltOptions {
  maxTilt?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
}

export function use3DTilt(options: Use3DTiltOptions = {}) {
  const {
    maxTilt = 8,
    scale = 1.02,
    speed = 400,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    glareX: 50,
    glareY: 50,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setTilt({
        rotateX: (0.5 - y) * maxTilt * 2,
        rotateY: (x - 0.5) * maxTilt * 2,
        scale,
        glareX: x * 100,
        glareY: y * 100,
      });
    },
    [maxTilt, scale]
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      glareX: 50,
      glareY: 50,
    });
  }, []);

  const style: React.CSSProperties = {
    transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.scale}, ${tilt.scale}, ${tilt.scale})`,
    transition: `transform ${speed}ms cubic-bezier(0.23, 1, 0.32, 1)`,
    transformStyle: 'preserve-3d' as const,
  };

  const glareStyle: React.CSSProperties = {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 'inherit',
    background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
    pointerEvents: 'none' as const,
    zIndex: 10,
    transition: `background ${speed}ms cubic-bezier(0.23, 1, 0.32, 1)`,
  };

  return {
    ref,
    style,
    glareStyle,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
}
