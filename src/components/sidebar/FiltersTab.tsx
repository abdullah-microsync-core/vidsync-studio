import React from 'react';
import { useEditorStore, DEFAULT_FILTER_SETTINGS } from '../../store/editorStore';
import { FilterPreset, FilterSettings } from '../../types/editor';
import { Sliders, Sparkles, RotateCcw, Eye } from 'lucide-react';

const FILTER_PRESETS: { id: FilterPreset; name: string; desc: string; gradient: string }[] = [
  { id: 'none', name: 'Normal', desc: 'No color grading', gradient: 'from-slate-700 to-slate-800' },
  { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Neon cyan & magenta tint', gradient: 'from-cyan-500 via-indigo-600 to-pink-500' },
  { id: 'cinematic', name: 'Cinematic', desc: 'Hollywood teal & orange', gradient: 'from-teal-600 to-amber-600' },
  { id: 'vintage', name: 'Vintage Warm', desc: 'Retro 70s film sepia', gradient: 'from-amber-700 via-orange-800 to-yellow-900' },
  { id: 'noir', name: 'Noir B&W', desc: 'High contrast monochrome', gradient: 'from-black via-gray-700 to-white' },
  { id: 'vivid', name: 'Vivid Pop', desc: 'Saturated punchy colors', gradient: 'from-fuchsia-600 via-rose-500 to-amber-500' },
  { id: 'emerald', name: 'Emerald', desc: 'Deep lush forest green', gradient: 'from-emerald-600 to-teal-800' },
];

export const FiltersTab: React.FC = () => {
  const { project, selectedClipId, updateClip } = useEditorStore();

  // Find selected clip
  let selectedClip: import('../../types/editor').Clip | null = null;
  project.tracks.forEach((t) => {
    const c = t.clips.find((clip) => clip.id === selectedClipId);
    if (c) selectedClip = c;
  });

  const activeClip = selectedClip as import('../../types/editor').Clip | null;
  const filters: FilterSettings = activeClip?.filters || DEFAULT_FILTER_SETTINGS;

  const handleUpdate = (updates: Partial<FilterSettings>) => {
    if (!selectedClipId) return;
    updateClip(selectedClipId, {
      filters: { ...filters, ...updates },
    });
  };

  const handlePresetSelect = (preset: FilterPreset) => {
    if (!selectedClipId) return;
    handleUpdate({ preset });
  };

  const handleReset = () => {
    if (!selectedClipId) return;
    updateClip(selectedClipId, {
      filters: { ...DEFAULT_FILTER_SETTINGS },
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      {/* Notice if no clip is selected */}
      {!selectedClip && (
        <div className="rounded-xl bg-editor-accent/10 border border-editor-accent/30 p-3 text-xs text-indigo-200 flex items-center gap-2">
          <Eye className="w-4 h-4 text-editor-cyan shrink-0" />
          <span>Select any video or image clip on the timeline to customize its color filters & LUTs.</span>
        </div>
      )}

      {/* Preset LUTs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Preset Color LUTs</span>
          {selectedClip && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FILTER_PRESETS.map((preset) => {
            const isSelected = filters.preset === preset.id;
            return (
              <button
                key={preset.id}
                disabled={!selectedClip}
                onClick={() => handlePresetSelect(preset.id)}
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-editor-card border-editor-accent ring-1 ring-editor-accent/50 shadow-md'
                    : 'bg-editor-card/60 hover:bg-editor-card border-editor-border disabled:opacity-50'
                }`}
              >
                <div className={`h-8 rounded-md bg-gradient-to-r ${preset.gradient} mb-2 shadow-inner`} />
                <span className="text-xs font-bold text-slate-200">{preset.name}</span>
                <span className="text-[10px] text-slate-400 truncate">{preset.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Sliders */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Manual Adjustments
        </div>

        {/* Brightness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>Brightness</span>
            <span className="font-mono text-[11px] text-slate-400">{filters.brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.brightness}
            disabled={!selectedClip}
            onChange={(e) => handleUpdate({ brightness: Number(e.target.value) })}
            className="w-full h-1.5 bg-editor-darker rounded-lg appearance-none cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>Contrast</span>
            <span className="font-mono text-[11px] text-slate-400">{filters.contrast}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.contrast}
            disabled={!selectedClip}
            onChange={(e) => handleUpdate({ contrast: Number(e.target.value) })}
            className="w-full h-1.5 bg-editor-darker rounded-lg appearance-none cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>Saturation</span>
            <span className="font-mono text-[11px] text-slate-400">{filters.saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={filters.saturation}
            disabled={!selectedClip}
            onChange={(e) => handleUpdate({ saturation: Number(e.target.value) })}
            className="w-full h-1.5 bg-editor-darker rounded-lg appearance-none cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Vignette */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>Vignette Edge Blur</span>
            <span className="font-mono text-[11px] text-slate-400">{filters.vignette}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.vignette}
            disabled={!selectedClip}
            onChange={(e) => handleUpdate({ vignette: Number(e.target.value) })}
            className="w-full h-1.5 bg-editor-darker rounded-lg appearance-none cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Blur */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>Gaussian Blur</span>
            <span className="font-mono text-[11px] text-slate-400">{filters.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={filters.blur}
            disabled={!selectedClip}
            onChange={(e) => handleUpdate({ blur: Number(e.target.value) })}
            className="w-full h-1.5 bg-editor-darker rounded-lg appearance-none cursor-pointer disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
};
