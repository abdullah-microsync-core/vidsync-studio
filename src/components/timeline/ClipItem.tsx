import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Clip } from '../../types/editor';
import { WaveformCanvas } from './WaveformCanvas';
import { Sparkles, Video, Music, Type, Image as ImageIcon, Gauge } from 'lucide-react';

interface ClipItemProps {
  clip: Clip;
  trackType: string;
}

export const ClipItem: React.FC<ClipItemProps> = ({ clip, trackType }) => {
  const {
    zoom,
    selectedClipId,
    selectClip,
    moveClip,
    trimClip,
    setActiveSidebarTab,
  } = useEditorStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isTrimmingLeft, setIsTrimmingLeft] = useState(false);
  const [isTrimmingRight, setIsTrimmingRight] = useState(false);
  const [liveDuration, setLiveDuration] = useState(clip.duration);

  const clipRef = useRef<HTMLDivElement>(null);
  const isSelected = selectedClipId === clip.id;

  const leftPx = clip.startTime * zoom;
  const widthPx = Math.max(20, clip.duration * zoom);

  // Handle Dragging Move
  const handleDragStart = (e: React.MouseEvent) => {
    if (isTrimmingLeft || isTrimmingRight) return;
    e.stopPropagation();
    selectClip(clip.id);
    setIsDragging(true);

    const startClientX = e.clientX;
    const initialStartTime = clip.startTime;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startClientX;
      const deltaTime = deltaPx / zoom;
      const newStartTime = Math.max(0, initialStartTime + deltaTime);
      moveClip(clip.id, clip.trackId, newStartTime);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle Trim Left
  const handleTrimLeftStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrimmingLeft(true);
    const startClientX = e.clientX;
    const initStart = clip.startTime;
    const initDuration = clip.duration;
    const initTrimIn = clip.trimIn;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startClientX;
      const deltaTime = deltaPx / zoom;
      const newDuration = Math.max(0.3, initDuration - deltaTime);
      const newStart = Math.max(0, initStart + (initDuration - newDuration));
      const newTrimIn = Math.max(0, initTrimIn + (initDuration - newDuration));

      setLiveDuration(newDuration);
      trimClip(clip.id, newStart, newDuration, newTrimIn);
    };

    const onMouseUp = () => {
      setIsTrimmingLeft(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle Trim Right
  const handleTrimRightStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrimmingRight(true);
    const startClientX = e.clientX;
    const initDuration = clip.duration;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startClientX;
      const deltaTime = deltaPx / zoom;
      const newDuration = Math.max(0.3, initDuration + deltaTime);

      setLiveDuration(newDuration);
      trimClip(clip.id, clip.startTime, newDuration, clip.trimIn);
    };

    const onMouseUp = () => {
      setIsTrimmingRight(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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
      }}
      onMouseDown={handleDragStart}
      className={`absolute top-1 bottom-1 rounded-lg select-none cursor-pointer flex flex-col justify-between overflow-hidden border transition-all duration-75 group ${
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
        className="absolute top-0 bottom-0 left-0 w-2 hover:w-3.5 bg-white/20 hover:bg-editor-cyan cursor-w-resize z-30 transition-all flex items-center justify-center group/trim"
      >
        <div className="w-0.5 h-4 bg-white rounded-full opacity-60 group-hover/trim:opacity-100" />
      </div>

      {/* Right Trim Handle */}
      <div
        onMouseDown={handleTrimRightStart}
        className="absolute top-0 bottom-0 right-0 w-2 hover:w-3.5 bg-white/20 hover:bg-editor-cyan cursor-e-resize z-30 transition-all flex items-center justify-center group/trim"
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
