import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { Clip } from '../../types/editor';
import { WaveformCanvas } from './WaveformCanvas';
import { Sparkles, Video, Music, Type, Image as ImageIcon, Gauge } from 'lucide-react';

interface ClipItemProps {
  clip: Clip;
  trackType: string;
}

/** Returns clientX from either a mouse or touch event */
function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e && e.touches.length > 0) return e.touches[0].clientX;
  if ('changedTouches' in e && (e as TouchEvent).changedTouches.length > 0)
    return (e as TouchEvent).changedTouches[0].clientX;
  return (e as MouseEvent).clientX;
}

export const ClipItem: React.FC<ClipItemProps> = ({ clip, trackType }) => {
  const {
    zoom,
    selectedClipId,
    selectClip,
    moveClip,
    trimClip,
    setActiveSidebarTab,
    setIsSidebarOpen,
  } = useEditorStore(useShallow(state => ({
    zoom: state.zoom,
    selectedClipId: state.selectedClipId,
    selectClip: state.selectClip,
    moveClip: state.moveClip,
    trimClip: state.trimClip,
    setActiveSidebarTab: state.setActiveSidebarTab,
    setIsSidebarOpen: state.setIsSidebarOpen,
  })));

  const [isDragging, setIsDragging] = useState(false);
  const [isTrimmingLeft, setIsTrimmingLeft] = useState(false);
  const [isTrimmingRight, setIsTrimmingRight] = useState(false);
  const [liveDuration, setLiveDuration] = useState(clip.duration);

  /** Double-tap detection for mobile (mirrors onDoubleClick on desktop) */
  const lastTapRef = useRef<number>(0);

  const clipRef = useRef<HTMLDivElement>(null);
  const isSelected = selectedClipId === clip.id;

  const leftPx = clip.startTime * zoom;
  const widthPx = Math.max(20, clip.duration * zoom);

  // ─── Helper: register both mouse and touch global listeners ───────────────
  const addGlobalListeners = (
    onMove: (e: MouseEvent | TouchEvent) => void,
    onEnd: (e: MouseEvent | TouchEvent) => void,
  ) => {
    const touchMoveOpts: AddEventListenerOptions = { passive: false };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, touchMoveOpts);
    window.addEventListener('touchend', onEnd);
  };

  const removeGlobalListeners = (
    onMove: (e: MouseEvent | TouchEvent) => void,
    onEnd: (e: MouseEvent | TouchEvent) => void,
  ) => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onEnd);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onEnd);
  };

  // ─── Drag Move ─────────────────────────────────────────────────────────────
  const startDrag = (startClientX: number) => {
    if (isTrimmingLeft || isTrimmingRight) return;
    selectClip(clip.id);
    setIsDragging(true);

    const initialStartTime = clip.startTime;
    let finalStartTime = initialStartTime;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if ('cancelable' in e && e.cancelable) e.preventDefault();
      const deltaPx = getClientX(e) - startClientX;
      const deltaTime = deltaPx / zoom;
      finalStartTime = Math.max(0, initialStartTime + deltaTime);
      moveClip(clip.id, clip.trackId, finalStartTime, false);
    };

    const onEnd = () => {
      setIsDragging(false);
      removeGlobalListeners(onMove, onEnd);
      moveClip(clip.id, clip.trackId, finalStartTime, true);
    };

    addGlobalListeners(onMove, onEnd);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (isTrimmingLeft || isTrimmingRight) return;
    e.stopPropagation();
    startDrag(e.clientX);
  };

  const handleTouchDragStart = (e: React.TouchEvent) => {
    if (isTrimmingLeft || isTrimmingRight) return;
    e.stopPropagation();
    // Don't preventDefault here — let double-tap detection work
    startDrag(e.touches[0].clientX);
  };

  // ─── Trim Left ─────────────────────────────────────────────────────────────
  const startTrimLeft = (startClientX: number) => {
    setIsTrimmingLeft(true);
    const initStart = clip.startTime;
    const initDuration = clip.duration;
    const initTrimIn = clip.trimIn;

    let finalStart = initStart;
    let finalDuration = initDuration;
    let finalTrimIn = initTrimIn;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if ('cancelable' in e && e.cancelable) e.preventDefault();
      const deltaPx = getClientX(e) - startClientX;
      const deltaTime = deltaPx / zoom;
      const maxAllowedLeftDuration = initDuration + (initTrimIn / clip.speed);
      finalDuration = Math.min(maxAllowedLeftDuration, Math.max(0.3, initDuration - deltaTime));
      
      finalStart = Math.max(0, initStart + (initDuration - finalDuration));
      finalTrimIn = Math.max(0, initTrimIn - ((finalDuration - initDuration) * clip.speed));

      setLiveDuration(finalDuration);
      trimClip(clip.id, finalStart, finalDuration, finalTrimIn, false);
    };

    const onEnd = () => {
      setIsTrimmingLeft(false);
      removeGlobalListeners(onMove, onEnd);
      trimClip(clip.id, finalStart, finalDuration, finalTrimIn, true);
    };

    addGlobalListeners(onMove, onEnd);
  };

  const handleTrimLeftStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTrimLeft(e.clientX);
  };

  const handleTrimLeftTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startTrimLeft(e.touches[0].clientX);
  };

  // ─── Trim Right ────────────────────────────────────────────────────────────
  const startTrimRight = (startClientX: number) => {
    setIsTrimmingRight(true);
    const initDuration = clip.duration;
    let finalDuration = initDuration;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if ('cancelable' in e && e.cancelable) e.preventDefault();
      const deltaPx = getClientX(e) - startClientX;
      const deltaTime = deltaPx / zoom;

      let maxAllowed = Infinity;
      if (clip.type === 'video' || clip.type === 'audio') {
        const sourceRem = Math.max(0, clip.sourceDuration - clip.trimIn);
        maxAllowed = sourceRem / clip.speed;
        if (isNaN(maxAllowed) || maxAllowed === Infinity) {
          maxAllowed = 3600; // 1 hour fallback for corrupt data
        }
      }
      
      finalDuration = Math.min(maxAllowed, Math.max(0.3, initDuration + deltaTime));

      setLiveDuration(finalDuration);
      trimClip(clip.id, clip.startTime, finalDuration, clip.trimIn, false);
    };

    const onEnd = () => {
      setIsTrimmingRight(false);
      removeGlobalListeners(onMove, onEnd);
      trimClip(clip.id, clip.startTime, finalDuration, clip.trimIn, true);
    };

    addGlobalListeners(onMove, onEnd);
  };

  const handleTrimRightStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTrimRight(e.clientX);
  };

  const handleTrimRightTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startTrimRight(e.touches[0].clientX);
  };

  // ─── Double-tap for mobile inspector ───────────────────────────────────────
  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      // Double-tap detected
      e.stopPropagation();
      selectClip(clip.id);
      setActiveSidebarTab(clip.type === 'text' ? 'text' : 'inspector');
      setIsSidebarOpen(true);
    }
    lastTapRef.current = now;
  };

  const Icon =
    clip.type === 'video' ? Video : clip.type === 'audio' ? Music : clip.type === 'text' ? Type : ImageIcon;

  return (
    <div
      ref={clipRef}
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectClip(clip.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        selectClip(clip.id);
        setActiveSidebarTab(clip.type === 'text' ? 'text' : 'inspector');
        setIsSidebarOpen(true);
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleTouchDragStart}
      onTouchEnd={handleTouchEnd}
      className={`absolute top-1 bottom-1 rounded-lg select-none cursor-pointer flex flex-col justify-between overflow-hidden border transition-all duration-75 group touch-none ${
        isSelected
          ? 'border-editor-cyan ring-2 ring-editor-cyan/50 shadow-lg shadow-cyan-500/20 z-20'
          : 'border-white/10 hover:border-white/30 z-10'
      } ${isDragging ? 'opacity-75 cursor-grabbing z-30' : ''}`}
    >
      {/* Background Color Tag / Gradient */}
      <div
        style={{
          backgroundColor: clip.colorTag || (clip.type === 'video' ? '#4f46e5' : clip.type === 'audio' ? '#059669' : '#9333ea'),
        }}
        className="absolute inset-0 opacity-80"
      />

      {/* Audio Waveform visualizer if audio/video */}
      {(clip.type === 'audio' || clip.type === 'video') && (
        <div className="absolute inset-0 z-0">
          <WaveformCanvas
            clipId={clip.id}
            assetId={clip.assetId}
            src={clip.src}
            width={Math.round(widthPx)}
            height={50}
            color="rgba(255,255,255,0.4)"
          />
        </div>
      )}

      {/* Top Bar: Icon, Name & Speed */}
      <div className="relative z-10 px-2 py-1 flex items-center justify-between text-white drop-shadow">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Icon className="w-3 h-3 shrink-0" />
          <span className="text-[11px] font-bold truncate max-w-[140px] tracking-tight">{clip.name}</span>
        </div>

        {/* Speed tag if modified */}
        {clip.speed !== 1 && (
          <div className="flex items-center gap-0.5 px-1 rounded bg-black/60 text-[9px] font-mono font-bold text-editor-amber">
            <Gauge className="w-2.5 h-2.5" />
            <span>{clip.speed}x</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Duration & Transition indicators */}
      <div className="relative z-10 px-2 py-1 flex items-center justify-between text-[10px] font-mono text-white/90 drop-shadow">
        {/* Left transition in badge */}
        {clip.transitionIn && clip.transitionIn.type !== 'none' ? (
          <div className="flex items-center gap-0.5 text-editor-cyan font-bold text-[9px] bg-black/40 px-1 rounded">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{clip.transitionIn.type}</span>
          </div>
        ) : (
          <span />
        )}

        <span>{clip.duration.toFixed(1)}s</span>

        {/* Right transition out badge */}
        {clip.transitionOut && clip.transitionOut.type !== 'none' && (
          <div className="flex items-center gap-0.5 text-editor-cyan font-bold text-[9px] bg-black/40 px-1 rounded">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* Left Trim Handle */}
      <div
        onMouseDown={handleTrimLeftStart}
        onTouchStart={handleTrimLeftTouchStart}
        className="absolute top-0 bottom-0 left-0 w-3 sm:w-2 hover:w-3.5 bg-white/20 hover:bg-editor-cyan cursor-w-resize z-30 transition-all flex items-center justify-center group/trim touch-none"
      >
        <div className="w-0.5 h-4 bg-white rounded-full opacity-60 group-hover/trim:opacity-100" />
      </div>

      {/* Right Trim Handle */}
      <div
        onMouseDown={handleTrimRightStart}
        onTouchStart={handleTrimRightTouchStart}
        className="absolute top-0 bottom-0 right-0 w-3 sm:w-2 hover:w-3.5 bg-white/20 hover:bg-editor-cyan cursor-e-resize z-30 transition-all flex items-center justify-center group/trim touch-none"
      >
        <div className="w-0.5 h-4 bg-white rounded-full opacity-60 group-hover/trim:opacity-100" />
      </div>

      {/* Trimming live feedback tooltip */}
      {(isTrimmingLeft || isTrimmingRight) && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-2 py-0.5 rounded bg-editor-darker border border-editor-cyan text-[10px] font-mono font-bold text-white shadow-xl z-40">
          Duration: {liveDuration.toFixed(2)}s
        </div>
      )}
    </div>
  );
};
