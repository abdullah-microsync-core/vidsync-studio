import React, { useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';

interface TimeRulerProps {
  totalDuration: number;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({ totalDuration }) => {
  const { zoom, setCurrentTime, project } = useEditorStore(useShallow(state => ({ zoom: state.zoom, setCurrentTime: state.setCurrentTime, project: state.project })));
  const rulerRef = useRef<HTMLDivElement>(null);

  const totalWidth = Math.max(1200, (totalDuration + 5) * zoom);

  // Determine tick spacing based on zoom
  const secondInterval = zoom >= 60 ? 1 : zoom >= 30 ? 2 : 5;
  const numTicks = Math.ceil((totalDuration + 5) / secondInterval);

  const handleRulerClick = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = Math.max(0, Math.min(project.duration, clickX / zoom));
    setCurrentTime(time);
  };

  const handleRulerMouseDown = (e: React.MouseEvent) => {
    handleRulerClick(e);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = moveEvent.clientX - rect.left;
      const time = Math.max(0, Math.min(project.duration, clickX / zoom));
      setCurrentTime(time);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const formatRulerTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      ref={rulerRef}
      style={{ width: `${totalWidth}px` }}
      onMouseDown={handleRulerMouseDown}
      className="h-7 bg-editor-darker border-b border-editor-border relative select-none cursor-pointer overflow-hidden"
    >
      {Array.from({ length: numTicks }).map((_, idx) => {
        const sec = idx * secondInterval;
        const left = sec * zoom;

        return (
          <div
            key={sec}
            style={{ left: `${left}px` }}
            className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
          >
            <div className="flex items-center gap-1 pl-1">
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {formatRulerTime(sec)}
              </span>
            </div>
            {/* Major tick mark */}
            <div className="w-px h-2 bg-slate-600 self-start" />
          </div>
        );
      })}
    </div>
  );
};
