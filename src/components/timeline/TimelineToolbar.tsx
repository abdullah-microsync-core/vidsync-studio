import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { TrackType } from '../../types/editor';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  Magnet, 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Video, 
  Music, 
  Type, 
  Layers 
} from 'lucide-react';

export const TimelineToolbar: React.FC = () => {
  const {
    zoom,
    setZoom,
    selectedClipId,
    splitClip,
    deleteClip,
    duplicateClip,
    snappingEnabled,
    setSnappingEnabled,
    addTrack,
  } = useEditorStore(useShallow(state => ({
    zoom: state.zoom,
    setZoom: state.setZoom,
    selectedClipId: state.selectedClipId,
    splitClip: state.splitClip,
    deleteClip: state.deleteClip,
    duplicateClip: state.duplicateClip,
    snappingEnabled: state.snappingEnabled,
    setSnappingEnabled: state.setSnappingEnabled,
    addTrack: state.addTrack,
  })));

  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);

  return (
    <div className="h-10 border-b border-editor-border bg-editor-panel px-4 flex items-center justify-between select-none z-20">
      {/* Left: Edit Actions (Split, Duplicate, Delete) */}
      <div className="flex items-center gap-1.5">
        {/* Split at Playhead */}
        <button
          onClick={() => selectedClipId && splitClip(selectedClipId)}
          disabled={!selectedClipId}
          className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-lg bg-editor-card hover:bg-editor-hover border border-editor-border text-xs font-semibold text-slate-200 disabled:opacity-40 disabled:hover:bg-editor-card transition-colors"
          title="Split Selected Clip at Playhead (S)"
        >
          <Scissors className="w-3.5 h-3.5 text-editor-amber" />
          <span className="hidden md:inline">Split (S)</span>
        </button>

        {/* Duplicate */}
        <button
          onClick={() => selectedClipId && duplicateClip(selectedClipId)}
          disabled={!selectedClipId}
          className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-lg bg-editor-card hover:bg-editor-hover border border-editor-border text-xs font-semibold text-slate-200 disabled:opacity-40 disabled:hover:bg-editor-card transition-colors"
          title="Duplicate Clip (Ctrl+D)"
        >
          <Copy className="w-3.5 h-3.5 text-editor-cyan" />
          <span className="hidden md:inline">Duplicate</span>
        </button>

        {/* Delete */}
        <button
          onClick={() => selectedClipId && deleteClip(selectedClipId)}
          disabled={!selectedClipId}
          className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-lg bg-editor-card hover:bg-red-500/20 hover:border-red-500/40 border border-editor-border text-xs font-semibold text-slate-200 hover:text-red-300 disabled:opacity-40 disabled:hover:bg-editor-card transition-colors"
          title="Delete Clip (Delete / Backspace)"
        >
          <Trash2 className="w-3.5 h-3.5 text-editor-rose" />
          <span className="hidden md:inline">Delete</span>
        </button>

        <div className="h-4 w-px bg-editor-border mx-1" />

        {/* Snapping Toggle */}
        <button
          onClick={() => setSnappingEnabled(!snappingEnabled)}
          className={`flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
            snappingEnabled
              ? 'bg-editor-accent/20 border-editor-accent/40 text-editor-cyan'
              : 'bg-editor-card hover:bg-editor-hover border-editor-border text-slate-400'
          }`}
          title="Toggle Magnetic Snapping (N)"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Snapping</span>
        </button>
      </div>

      {/* Right: Add Track & Zoom Slider */}
      <div className="flex items-center gap-3">
        {/* Add Track dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsAddTrackOpen(!isAddTrackOpen)}
            className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-lg bg-editor-card hover:bg-editor-hover border border-editor-border text-xs font-semibold text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-editor-cyan" />
            <span className="hidden sm:inline">Add Track</span>
          </button>

          {isAddTrackOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsAddTrackOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-editor-panel border border-editor-border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
                {[
                  { type: 'video' as TrackType, label: 'Video Track', icon: Video },
                  { type: 'audio' as TrackType, label: 'Audio Track', icon: Music },
                  { type: 'text' as TrackType, label: 'Text Track', icon: Type },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        addTrack(item.type);
                        setIsAddTrackOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-editor-hover text-xs font-semibold text-slate-200 text-left transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 text-editor-cyan" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-editor-border" />

        {/* Timeline Zoom Controls */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setZoom(zoom - 10)}
            className="p-1.5 rounded hover:bg-editor-hover hover:text-slate-200"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="15"
            max="120"
            step="5"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="hidden sm:block w-20 h-1 bg-editor-darker rounded cursor-pointer"
            title={`Timeline Zoom: ${zoom}px/sec`}
          />

          <button
            onClick={() => setZoom(zoom + 10)}
            className="p-1.5 rounded hover:bg-editor-hover hover:text-slate-200"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
