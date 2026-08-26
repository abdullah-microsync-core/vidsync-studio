import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Clip, ClipTransform } from '../../types/editor';
import { RotateCw, Move } from 'lucide-react';

interface TransformGizmoProps {
  canvasRect: DOMRect | null;
}

/** Extract clientX/Y from mouse or touch event */
function getClientPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if ('changedTouches' in e && (e as TouchEvent).changedTouches.length > 0) {
    return { x: (e as TouchEvent).changedTouches[0].clientX, y: (e as TouchEvent).changedTouches[0].clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
}

export const TransformGizmo: React.FC<TransformGizmoProps> = ({ canvasRect }) => {
  const { project, selectedClipId, updateClip, isPlaying, currentTime } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; initScale: number } | null>(null);

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

  // ─── Gizmo Drag ────────────────────────────────────────────────────────────
  const startGizmoDrag = (startX: number, startY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX,
      startY,
      initX: transform.x,
      initY: transform.y,
    };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current || !selectedClipId) return;
      if ('cancelable' in moveEvent && moveEvent.cancelable) moveEvent.preventDefault();
      const { x, y } = getClientPos(moveEvent);
      const dx = x - dragStartRef.current.startX;
      const dy = y - dragStartRef.current.startY;

      const newPercentX = dragStartRef.current.initX + (dx / canvasW) * 100;
      const newPercentY = dragStartRef.current.initY + (dy / canvasH) * 100;

      updateClip(selectedClipId, {
        transform: {
          ...transform,
          x: Math.round(Math.max(-70, Math.min(70, newPercentX))),
          y: Math.round(Math.max(-70, Math.min(70, newPercentY))),
        },
      }, false);
    };

    const handleUp = (upEvent: MouseEvent | TouchEvent) => {
      setIsDragging(false);

      if (dragStartRef.current && selectedClipId) {
        const { x, y } = getClientPos(upEvent);
        const dx = x - dragStartRef.current.startX;
        const dy = y - dragStartRef.current.startY;
        const newPercentX = dragStartRef.current.initX + (dx / canvasW) * 100;
        const newPercentY = dragStartRef.current.initY + (dy / canvasH) * 100;
        updateClip(selectedClipId, {
          transform: {
            ...transform,
            x: Math.round(Math.max(-70, Math.min(70, newPercentX))),
            y: Math.round(Math.max(-70, Math.min(70, newPercentY))),
          },
        }, true);
      }

      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    startGizmoDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startGizmoDrag(e.touches[0].clientX, e.touches[0].clientY);
  };

  // ─── Resize ────────────────────────────────────────────────────────────────
  const startResize = (startX: number) => {
    setIsDragging(true);
    resizeStartRef.current = {
      startX,
      initScale: transform.scale || 1,
    };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!resizeStartRef.current || !selectedClipId) return;
      if ('cancelable' in moveEvent && moveEvent.cancelable) moveEvent.preventDefault();
      const { x } = getClientPos(moveEvent);
      const dx = x - resizeStartRef.current.startX;
      const newScale = Math.max(0.1, resizeStartRef.current.initScale + dx / 100);

      updateClip(selectedClipId, {
        transform: {
          ...transform,
          scale: Number(newScale.toFixed(2)),
        },
      }, false);
    };

    const handleUp = (upEvent: MouseEvent | TouchEvent) => {
      setIsDragging(false);

      if (resizeStartRef.current && selectedClipId) {
        const { x } = getClientPos(upEvent);
        const dx = x - resizeStartRef.current.startX;
        const newScale = Math.max(0.1, resizeStartRef.current.initScale + dx / 100);
        updateClip(selectedClipId, {
          transform: {
            ...transform,
            scale: Number(newScale.toFixed(2)),
          },
        }, true);
      }

      resizeStartRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    startResize(e.clientX);
  };

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startResize(e.touches[0].clientX);
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
      onTouchStart={handleTouchStart}
      className={`absolute pointer-events-auto border-2 border-editor-cyan rounded-lg cursor-move select-none z-30 transition-shadow group touch-none ${
        isDragging ? 'shadow-2xl ring-2 ring-editor-cyan/40 bg-editor-cyan/10' : 'hover:border-white shadow-lg'
      }`}
    >
      {/* Corner Resize Handles — larger on mobile for easier touch targets */}
      <div onMouseDown={handleResizeMouseDown} onTouchStart={handleResizeTouchStart} className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-editor-cyan border-2 border-white cursor-nwse-resize shadow touch-none" />
      <div onMouseDown={handleResizeMouseDown} onTouchStart={handleResizeTouchStart} className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-editor-cyan border-2 border-white cursor-nesw-resize shadow touch-none" />
      <div onMouseDown={handleResizeMouseDown} onTouchStart={handleResizeTouchStart} className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-editor-cyan border-2 border-white cursor-nesw-resize shadow touch-none" />
      <div onMouseDown={handleResizeMouseDown} onTouchStart={handleResizeTouchStart} className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-editor-cyan border-2 border-white cursor-nwse-resize shadow touch-none" />

      {/* Floating Center Move Badge */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-slate-200 border border-editor-cyan/40 pointer-events-none flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Move className="w-3 h-3 text-editor-cyan" />
        <span>Drag to position</span>
      </div>
    </div>
  );
};
