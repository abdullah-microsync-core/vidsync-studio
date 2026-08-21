import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { compositor, VideoCompositor } from '../../services/compositor';
import { audioEngine } from '../../services/audioEngine';
import { PlayerControls } from './PlayerControls';
import { TransformGizmo } from './TransformGizmo';

export const PreviewPlayer: React.FC = () => {
  const { project, isPlaying, selectClip } = useEditorStore(useShallow(state => ({
    project: state.project,
    isPlaying: state.isPlaying,
    selectClip: state.selectClip
  })));

  // Only re-render this component twice a second for audio syncing, not 60 times a second
  const currentTimeTwiceASecond = useEditorStore(state => Math.floor(state.currentTime * 2));

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keep audio synced with timeline & play state
  useEffect(() => {
    const state = useEditorStore.getState();
    audioEngine.syncPlayback(project.tracks, state.currentTime, isPlaying);
  }, [isPlaying, currentTimeTwiceASecond]);

  // Animation render loop
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      
      const state = useEditorStore.getState();

      if (state.isPlaying) {
        const nextTime = state.currentTime + delta;
        if (nextTime >= state.project.duration) {
          state.setCurrentTime(state.project.duration);
          state.setIsPlaying(false);
        } else {
          state.setCurrentTime(nextTime);
        }
      }

      // Render canvas frame
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

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update canvas bounds & rect for transform gizmo
  useEffect(() => {
    const updateSize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const dim = VideoCompositor.getDimensionsForAspectRatio(project.aspectRatio);
      canvasRef.current.width = dim.width;
      canvasRef.current.height = dim.height;
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
            className="max-h-[calc(100vh-380px)] max-w-full object-contain rounded-md bg-black"
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
