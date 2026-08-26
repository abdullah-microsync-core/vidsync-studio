import React, { useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { TimelineToolbar } from './TimelineToolbar';
import { TrackHeader } from './TrackHeader';
import { TrackLane } from './TrackLane';
import { TimeRuler } from './TimeRuler';
import { Playhead } from './Playhead';

export const Timeline: React.FC = () => {
  const { project, zoom } = useEditorStore(useShallow(state => ({ project: state.project, zoom: state.zoom })));
  const lanesScrollRef = useRef<HTMLDivElement>(null);

  const totalWidth = Math.max(1200, (project.duration + 5) * zoom);
  const totalTracksHeight = project.tracks.length * 64 + 28; // 64px per track + 28px ruler

  return (
    <div className="h-44 md:h-64 border-t border-editor-border bg-editor-panel flex flex-col select-none relative z-10 overflow-hidden">
      {/* Top Controls Toolbar */}
      <TimelineToolbar />

      {/* Main Multi-Track Scroll Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Fixed Track Headers */}
        <div className="w-24 md:w-48 shrink-0 flex flex-col bg-editor-panel border-r border-editor-border overflow-hidden z-20 shadow-md">
          {/* Header spacer aligned with ruler */}
          <div className="h-7 bg-editor-darker border-b border-editor-border px-2 md:px-3 flex items-center justify-center md:justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="hidden md:inline">Tracks ({project.tracks.length})</span>
            <span className="md:hidden">{project.tracks.length} Tracks</span>
          </div>

          {/* List of track headers */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {project.tracks.map((track) => (
              <TrackHeader key={track.id} track={track} />
            ))}
          </div>
        </div>

        {/* Right Scrollable Lanes & Ruler Container */}
        <div
          id="vidsync-timeline-lanes"
          ref={lanesScrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-editor-bg"
        >
          {/* Dynamic Time Ruler */}
          <TimeRuler totalDuration={project.duration} />

          {/* Track Lanes */}
          <div className="flex flex-col relative" style={{ width: `${totalWidth}px` }}>
            {project.tracks.map((track) => (
              <TrackLane key={track.id} track={track} totalWidth={totalWidth} />
            ))}

            {/* Draggable Playhead Scrubber */}
            <Playhead timelineHeight={totalTracksHeight} />
          </div>
        </div>
      </div>
    </div>
  );
};
