import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Clip, ClipTransform } from '../../types/editor';
import { RotateCw, Move } from 'lucide-react';

interface TransformGizmoProps {
  canvasRect: DOMRect | null;
}

export const TransformGizmo: React.FC<TransformGizmoProps> = ({ canvasRect }) => {
  const { project, selectedClipId, updateClip, isPlaying, currentTime } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  let selectedClip: Clip | null = null;
  project.tracks.forEach((t) => {
    const c = t.clips.find((clip) => clip.id === selectedClipId);
    if (c) selectedClip = c;
  });

  if (!selectedClip || !canvasRect || isPlaying) return null;
  const activeClip = selectedClip as Clip;
  
  // Don't render the gizmo if the clip isn't currently visible on the timeline
  const clipEnd = activeClip.startTime + activeClip.duration;
  if (currentTime < activeClip.startTime || currentTime >= clipEnd) return null;

  const transform: ClipTransform = activeClip.transform || {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    blendMode: 'normal',
  };

  // Calculate pixel position on preview canvas
  const canvasW = canvasRect.width;
  const canvasH = canvasRect.height;
  const posX = canvasW / 2 + (transform.x / 100) * canvasW;
  const posY = canvasH / 2 + (transform.y / 100) * canvasH;

  const boxW = Math.max(80, (activeClip.type === 'text' ? 220 : 180) * (transform.scale || 1));
  const boxH = Math.max(50, (activeClip.type === 'text' ? 80 : 120) * (transform.scale || 1));

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: transform.x,
      initY: transform.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current || !selectedClipId) return;
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;

      const newPercentX = dragStartRef.current.initX + (dx / canvasW) * 100;
      const newPercentY = dragStartRef.current.initY + (dy / canvasH) * 100;

      updateClip(selectedClipId, {
        transform: {
          ...transform,
          x: Math.round(Math.max(-70, Math.min(70, newPercentX))),
          y: Math.round(Math.max(-70, Math.min(70, newPercentY))),
        },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
        width: `${boxW}px`,
        height: `${boxH}px`,
        transform: `translate(-50%, -50%) rotate(${transform.rotation || 0}deg)`,
      }}
      onMouseDown={handleMouseDown}
      className={`absolute pointer-events-auto border-2 border-editor-cyan rounded-lg cursor-move select-none z-30 transition-shadow ${
        isDragging ? 'shadow-2xl ring-2 ring-editor-cyan/40 bg-editor-cyan/10' : 'hover:border-white shadow-lg'
      }`}
    >
      {/* Corner Resize Handles */}
      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-editor-cyan border-2 border-white cursor-nwse-resize shadow" />
      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-editor-cyan border-2 border-white cursor-nesw-resize shadow" />
      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-editor-cyan border-2 border-white cursor-nesw-resize shadow" />
      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-editor-cyan border-2 border-white cursor-nwse-resize shadow" />

      {/* Floating Center Move Badge */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-slate-200 border border-editor-cyan/40 pointer-events-none flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
        <Move className="w-3 h-3 text-editor-cyan" />
        <span>Drag to position</span>
      </div>
    </div>
  );
};
