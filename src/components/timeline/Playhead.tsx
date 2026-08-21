import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';

interface PlayheadProps {
  timelineHeight: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ timelineHeight }) => {
  const { currentTime, setCurrentTime, zoom, project, snappingEnabled } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);

  const leftPx = currentTime * zoom;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Find relative X position from timeline body
      const timelineEl = document.getElementById('vidsync-timeline-lanes');
      if (!timelineEl) return;

      const rect = timelineEl.getBoundingClientRect();
      const clickX = moveEvent.clientX - rect.left + timelineEl.scrollLeft;
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

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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
        className="pointer-events-auto cursor-ew-resize flex flex-col items-center -mt-0.5 group"
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
