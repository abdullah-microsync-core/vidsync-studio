import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../services/audioEngine';

interface WaveformCanvasProps {
  clipId: string;
  assetId?: string;
  src?: string;
  color?: string;
  peaks?: number[];
  width: number;
  height: number;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  assetId,
  src,
  color = '#10b981',
  peaks: initialPeaks,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const draw = async () => {
      let peaks = initialPeaks;

      if (!peaks) {
        try {
          let buffer: AudioBuffer | null = null;
          if (assetId?.startsWith('audio_') || assetId?.startsWith('sfx_')) {
            const subType = assetId.includes('upbeat') ? 'upbeat' :
                            assetId.includes('lofi') ? 'lofi' :
                            assetId.includes('cinematic') ? 'cinematic' :
                            assetId.includes('techno') ? 'techno' :
                            assetId.includes('swoosh') ? 'swoosh' :
                            assetId.includes('ding') ? 'ding' :
                            assetId.includes('pop') ? 'pop' : 'transition';
            buffer = await audioEngine.getStockAudioBuffer(assetId, subType, 15);
          } else if (src) {
            buffer = await audioEngine.loadAudioBuffer(src);
          }

          if (buffer && !isCancelled) {
            peaks = audioEngine.extractWaveform(buffer, Math.max(30, Math.floor(width / 4)));
          }
        } catch {
          // fallback synthetic wave
          peaks = Array.from({ length: 40 }, () => Math.random() * 0.7 + 0.2);
        }
      }

      const canvas = canvasRef.current;
      if (!canvas || !peaks) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;

      const barWidth = Math.max(2, width / peaks.length);
      const centerY = height / 2;

      peaks.forEach((peak, i) => {
        const barH = peak * height * 0.8;
        const x = i * barWidth;
        const y = centerY - barH / 2;
        ctx.fillRect(x, y, barWidth - 1, barH);
      });
    };

    draw();
    return () => {
      isCancelled = true;
    };
  }, [assetId, src, width, height, color]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full opacity-60 pointer-events-none" />;
};
