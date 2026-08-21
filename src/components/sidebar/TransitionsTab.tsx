import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { TransitionType } from '../../types/editor';
import { Sparkles, ArrowRight, ArrowLeft, ArrowUp, ZoomIn, ZoomOut, Eye, Layers } from 'lucide-react';

const TRANSITION_LIST: { id: TransitionType; name: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'none', name: 'No Transition', desc: 'Direct cut', icon: Layers },
  { id: 'fade', name: 'Fade In / Out', desc: 'Smooth opacity dissolve', icon: Sparkles },
  { id: 'crossfade', name: 'Crossfade', desc: 'Seamless blend', icon: Sparkles },
  { id: 'wipe-left', name: 'Wipe Left', desc: 'Horizontal wipe left-to-right', icon: ArrowRight },
  { id: 'wipe-right', name: 'Wipe Right', desc: 'Horizontal wipe right-to-left', icon: ArrowLeft },
  { id: 'wipe-up', name: 'Wipe Up', desc: 'Vertical wipe upwards', icon: ArrowUp },
  { id: 'zoom-in', name: 'Zoom In Dissolve', desc: 'Cinematic punch zoom', icon: ZoomIn },
  { id: 'zoom-out', name: 'Zoom Out Dissolve', desc: 'Smooth pull back', icon: ZoomOut },
  { id: 'slide-left', name: 'Slide Left', desc: 'Push from right', icon: ArrowLeft },
  { id: 'slide-right', name: 'Slide Right', desc: 'Push from left', icon: ArrowRight },
];

export const TransitionsTab: React.FC = () => {
  const { project, selectedClipId, updateClip } = useEditorStore();
  const [duration, setDuration] = useState<number>(0.8);
  const [targetType, setTargetType] = useState<'in' | 'out'>('in');

  let selectedClip: import('../../types/editor').Clip | null = null;
  project.tracks.forEach((t) => {
    const c = t.clips.find((clip) => clip.id === selectedClipId);
    if (c) selectedClip = c;
  });

  const activeClip = selectedClip as import('../../types/editor').Clip | null;

  const handleApply = (type: TransitionType) => {
    if (!selectedClipId) return;

    if (targetType === 'in') {
      updateClip(selectedClipId, {
        transitionIn: { type, duration },
      });
    } else {
      updateClip(selectedClipId, {
        transitionOut: { type, duration },
      });
    }
  };

  const currentTransition =
    targetType === 'in' ? activeClip?.transitionIn?.type || 'none' : activeClip?.transitionOut?.type || 'none';

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      {!selectedClip && (
        <div className="rounded-xl bg-editor-accent/10 border border-editor-accent/30 p-3 text-xs text-indigo-200 flex items-center gap-2">
          <Eye className="w-4 h-4 text-editor-cyan shrink-0" />
          <span>Select any clip on the timeline to add video transitions.</span>
        </div>
      )}

      {/* Target Toggle: In vs Out */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Apply Transition To
        </div>
        <div className="flex items-center gap-1 bg-editor-darker p-1 rounded-lg border border-editor-border text-xs font-semibold">
          <button
            onClick={() => setTargetType('in')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all ${
              targetType === 'in' ? 'bg-editor-card text-editor-cyan shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clip Entrance (In)
          </button>
          <button
            onClick={() => setTargetType('out')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all ${
              targetType === 'out' ? 'bg-editor-card text-editor-cyan shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clip Exit (Out)
          </button>
        </div>
      </div>

      {/* Duration Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          <span>Transition Duration</span>
          <span className="font-mono text-[11px] text-slate-400">{duration.toFixed(1)}s</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full h-1.5 bg-editor-darker rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Transitions Grid */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Available Transitions ({TRANSITION_LIST.length})
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TRANSITION_LIST.map((item) => {
            const Icon = item.icon;
            const isSelected = currentTransition === item.id;
            return (
              <button
                key={item.id}
                disabled={!selectedClip}
                onClick={() => handleApply(item.id)}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-editor-card border-editor-accent ring-1 ring-editor-accent/50 shadow-md'
                    : 'bg-editor-card/60 hover:bg-editor-card border-editor-border disabled:opacity-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-editor-panel flex items-center justify-center text-editor-cyan mb-2">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">{item.name}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
