import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';

interface PlayheadProps {
  timelineHeight: number;
}

/** Extract clientX from a mouse or touch event */
function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) {
    return e.touches[0]?.clientX ?? (e as TouchEvent & { changedTouches: TouchList }).changedTouches[0]?.clientX ?? 0;
  }
  return (e as MouseEvent).clientX;
}

export const Playhead: React.FC<PlayheadProps> = ({ timelineHeight }) => {
  const { currentTime, setCurrentTime, zoom, project, snappingEnabled } = useEditorStore(useShallow(state => ({
    currentTime: state.currentTime,
    setCurrentTime: state.setCurrentTime,
    zoom: state.zoom,
    project: state.project,
    snappingEnabled: state.snappingEnabled,
  })));
  const [isDragging, setIsDragging] = useState(false);

  const leftPx = currentTime * zoom;

  const applyPosition = (clientX: number) => {
    const timelineEl = document.getElementById('vidsync-timeline-lanes');
    if (!timelineEl) return;

    const rect = timelineEl.getBoundingClientRect();
    const clickX = clientX - rect.left + timelineEl.scrollLeft;
    let newTime = Math.max(0, Math.min(project.duration, clickX / zoom));

    if (snappingEnabled) {
      const snapThreshold = 0.15; // seconds
      project.tracks.forEach((t) => {
        t.clips.forEach((c) => {
          if (Math.abs(newTime - c.startTime) < snapThreshold) {
            newTime = c.startTime;
          } else if (Math.abs(newTime - (c.startTime + c.duration)) < snapThreshold) {
            newTime = c.startTime + c.duration;
          }
        });
      });
    }

    setCurrentTime(newTime);
  };

  const startDrag = (startClientX: number) => {
    setIsDragging(true);

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      applyPosition(getClientX(moveEvent));
    };

    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    startDrag(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault(); // prevent scroll hijacking
    startDrag(e.touches[0].clientX);
  };

  return (
    <div
      style={{
        left: `${leftPx}px`,
        height: `${timelineHeight}px`,
      }}
      className="absolute top-0 pointer-events-none z-30 flex flex-col items-center select-none"
    >
      {/* Top Grab Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="pointer-events-auto cursor-ew-resize flex flex-col items-center -mt-0.5 group touch-none"
      >
        {/* Needle Flag */}
        <div className="w-3.5 h-3.5 bg-red-500 rounded-t-sm shadow-md group-hover:scale-125 transition-transform flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
        {/* Down pointer triangle */}
        <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[6px] border-t-red-500" />
      </div>

      {/* Vertical Red Needle Line */}
      <div className="w-0.5 flex-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
    </div>
  );
};
