import { useEffect, useRef } from 'react';
import { drawStaticLogo } from './pixel-scan/engine';

interface Props {
  className?: string;
  label?: string;
}

// Static-only logo: the WebGL pixel-scan effect (three.js) was removed
// to reduce bundle size. We always render the static fallback.
export function PixelScanLogo({ className, label = 'OpenDesign' }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;
    drawStaticLogo(canvas, host);
    return undefined;
  }, []);

  return (
    <div ref={hostRef} className={className} role="img" aria-label={label}>
      <canvas ref={canvasRef} />
    </div>
  );
}
