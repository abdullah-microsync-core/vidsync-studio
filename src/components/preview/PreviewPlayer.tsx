import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { compositor, VideoCompositor } from '../../services/compositor';
import { audioEngine } from '../../services/audioEngine';
import { PlayerControls } from './PlayerControls';
import { TransformGizmo } from './TransformGizmo';

/** Detect mobile for performance tuning */
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

export const PreviewPlayer: React.FC = () => {
  const { project, isPlaying, selectClip } = useEditorStore(useShallow(state => ({
    project: state.project,
    isPlaying: state.isPlaying,
    selectClip: state.selectClip
  })));

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastRenderedTimeRef = useRef<number>(-1);

  // ─── Bug 5 Fix: Audio sync only on play/pause transitions ───────────────
  useEffect(() => {
    const state = useEditorStore.getState();
    if (isPlaying) {
      audioEngine.syncPlayback(project.tracks, state.currentTime, true);
    } else {
      audioEngine.stopAll();
    }
    // Cleanup: stop audio when component unmounts
    return () => { audioEngine.stopAll(); };
  }, [isPlaying]);

  // ─── Bug 2 Fix: Throttled render loop ───────────────────────────────────
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();
    // On mobile, target ~24fps; on desktop, ~30fps
    const minFrameInterval = isMobile() ? 1000 / 24 : 1000 / 30;
    let timeSinceLastRender = 0;

    const loop = (timestamp: number) => {
      const rawDelta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      const state = useEditorStore.getState();

      // Advance the timeline clock if playing
      if (state.isPlaying) {
        const delta = rawDelta / 1000;
        const nextTime = state.currentTime + delta;
        if (nextTime >= state.project.duration) {
          if (state.isLooping) {
            state.setCurrentTime(0);
          } else {
            state.setCurrentTime(state.project.duration);
            state.setIsPlaying(false);
          }
        } else {
          state.setCurrentTime(nextTime);
        }
      }

      // Throttle canvas renders
      timeSinceLastRender += rawDelta;
      const timeChanged = state.currentTime !== lastRenderedTimeRef.current;
      const shouldRender = state.isPlaying
        ? timeSinceLastRender >= minFrameInterval
        : (timeChanged || compositor.isRenderingLoading) && (timeSinceLastRender >= minFrameInterval || timeChanged);

      if (shouldRender) {
        timeSinceLastRender = 0;
        lastRenderedTimeRef.current = state.currentTime;

        const canvas = canvasRef.current;
        if (canvas) {
          compositor.renderFrame(
            canvas,
            state.project.tracks,
            state.currentTime,
            state.project.aspectRatio,
            state.selectedClipId,
            state.isPlaying
          );
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update canvas bounds & rect for transform gizmo
  // Also applies mobile resolution downscale (Bug 2 cont.)
  useEffect(() => {
    const updateSize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const dim = VideoCompositor.getDimensionsForAspectRatio(project.aspectRatio);
      // On mobile, render at half resolution for dramatically better performance
      const scale = isMobile() ? 0.5 : 1.0;
      canvasRef.current.width = Math.round(dim.width * scale);
      canvasRef.current.height = Math.round(dim.height * scale);
      setCanvasRect(canvasRef.current.getBoundingClientRect());
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [project.aspectRatio]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col min-w-0 bg-editor-bg select-none relative overflow-hidden"
    >
      {/* Canvas Viewport Area */}
      <div
        onClick={() => selectClip(null)}
        className="flex-1 flex items-center justify-center p-4 relative overflow-hidden canvas-checkerboard"
      >
        <div className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-editor-border/80">
            <canvas
            ref={canvasRef}
            className="max-h-[calc(100vh-320px)] min-h-[80px] max-w-full object-contain rounded-md bg-black"
          />

          {/* Interactive Transform Gizmo overlay */}
          <TransformGizmo canvasRect={canvasRect} />
        </div>
      </div>

      {/* Playback Controls Footer */}
      <PlayerControls onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />
    </div>
  );
};
