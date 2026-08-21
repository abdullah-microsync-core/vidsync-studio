import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ClipTransform, TextOverlay } from '../../types/editor';
import { 
  Sliders, 
  Gauge, 
  Volume2, 
  RotateCw, 
  Move, 
  Maximize2, 
  Eye, 
  Type, 
  Palette, 
  Copy, 
  Trash2 
} from 'lucide-react';

const FONTS = ['Inter', 'Montserrat', 'Bebas Neue', 'JetBrains Mono', 'Playfair Display', 'Outfit'];
const COLOR_TAGS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];

export const InspectorTab: React.FC = () => {
  const { project, selectedClipId, updateClip, duplicateClip, deleteClip } = useEditorStore();

  let selectedClip: import('../../types/editor').Clip | null = null;
  let trackName = '';
  project.tracks.forEach((t) => {
    const c = t.clips.find((clip) => clip.id === selectedClipId);
    if (c) {
      selectedClip = c;
      trackName = t.name;
    }
  });

  if (!selectedClip) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500">
        <Sliders className="w-10 h-10 mb-3 text-slate-600" />
        <h4 className="text-sm font-semibold text-slate-300">No Clip Selected</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Click any clip on the multi-track timeline to inspect and customize its transform, speed, volume, or text properties.
        </p>
      </div>
    );
  }

  const activeClip = selectedClip as import('../../types/editor').Clip;

  const transform: ClipTransform = activeClip.transform || {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    blendMode: 'normal',
  };

  const handleTransformChange = (updates: Partial<ClipTransform>) => {
    if (!selectedClipId) return;
    updateClip(selectedClipId, {
      transform: { ...transform, ...updates },
    });
  };

  const handleTextChange = (updates: Partial<TextOverlay>) => {
    if (!selectedClipId || !activeClip?.text) return;
    updateClip(selectedClipId, {
      text: { ...activeClip.text, ...updates },
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-editor-border">
        <div>
          <h3 className="text-xs font-bold text-slate-200 truncate max-w-[180px]">{activeClip.name}</h3>
          <span className="text-[10px] text-slate-400 capitalize">{trackName} • {activeClip.type}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => duplicateClip(activeClip.id)}
            title="Duplicate Clip (Ctrl+D)"
            className="p-1.5 rounded-lg hover:bg-editor-hover text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteClip(activeClip.id)}
            title="Delete Clip (Del)"
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Speed & Volume */}
        <div className="rounded-xl bg-editor-card/60 border border-editor-border p-3 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Playback & Audio
          </div>

          {/* Speed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-editor-cyan" /> Speed
              </span>
              <span className="font-mono text-slate-400">{(activeClip.speed || 1).toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="4.0"
              step="0.25"
              value={activeClip.speed || 1}
              onChange={(e) => updateClip(activeClip.id, { speed: Number(e.target.value) })}
              className="w-full h-1.5 bg-editor-darker rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.25x</span>
              <span>1.0x</span>
              <span>2.0x</span>
              <span>4.0x</span>
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-editor-emerald" /> Volume
              </span>
              <span className="font-mono text-slate-400">{Math.round((activeClip.volume ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={activeClip.volume ?? 1}
              onChange={(e) => updateClip(activeClip.id, { volume: Number(e.target.value) })}
              className="w-full h-1.5 bg-editor-darker rounded-lg"
            />
          </div>
        </div>

        {/* Text Specific Editor if text clip */}
        {activeClip.type === 'text' && activeClip.text && (
          <div className="rounded-xl bg-editor-card/60 border border-editor-border p-3 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-editor-purple" /> Text Typography
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400">Content</label>
              <textarea
                rows={2}
                value={activeClip.text.text}
                onChange={(e) => handleTextChange({ text: e.target.value })}
                className="w-full p-2 rounded-lg bg-editor-darker border border-editor-border text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Font</label>
                <select
                  value={activeClip.text.fontFamily}
                  onChange={(e) => handleTextChange({ fontFamily: e.target.value })}
                  className="w-full p-1.5 rounded-lg bg-editor-darker border border-editor-border text-xs text-slate-200 outline-none"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Size ({activeClip.text.fontSize}px)</label>
                <input
                  type="range"
                  min="16"
                  max="120"
                  value={activeClip.text.fontSize}
                  onChange={(e) => handleTextChange({ fontSize: Number(e.target.value) })}
                  className="w-full h-1.5 bg-editor-darker rounded-lg mt-2"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeClip.text.color}
                    onChange={(e) => handleTextChange({ color: e.target.value })}
                    className="w-7 h-7 rounded border border-editor-border cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-400">{activeClip.text.color}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Outline Stroke</label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={activeClip.text.strokeWidth || 0}
                  onChange={(e) => handleTextChange({ strokeWidth: Number(e.target.value), strokeColor: '#000000' })}
                  className="w-full h-1.5 bg-editor-darker rounded-lg mt-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2D Canvas Transform */}
        <div className="rounded-xl bg-editor-card/60 border border-editor-border p-3 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-editor-accent" /> Transform & Position
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400">Position X ({transform.x}%)</span>
              <input
                type="range"
                min="-60"
                max="60"
                value={transform.x}
                onChange={(e) => handleTransformChange({ x: Number(e.target.value) })}
                className="w-full h-1.5 bg-editor-darker rounded-lg"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Position Y ({transform.y}%)</span>
              <input
                type="range"
                min="-60"
                max="60"
                value={transform.y}
                onChange={(e) => handleTransformChange({ y: Number(e.target.value) })}
                className="w-full h-1.5 bg-editor-darker rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400">Scale ({(transform.scale || 1).toFixed(2)})</span>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={transform.scale || 1}
                onChange={(e) => handleTransformChange({ scale: Number(e.target.value) })}
                className="w-full h-1.5 bg-editor-darker rounded-lg"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Rotation ({transform.rotation || 0}°)</span>
              <input
                type="range"
                min="-180"
                max="180"
                value={transform.rotation || 0}
                onChange={(e) => handleTransformChange({ rotation: Number(e.target.value) })}
                className="w-full h-1.5 bg-editor-darker rounded-lg"
              />
            </div>
          </div>

          {/* Opacity */}
          <div>
            <span className="text-[10px] text-slate-400">Opacity ({Math.round((transform.opacity ?? 1) * 100)}%)</span>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={transform.opacity ?? 1}
              onChange={(e) => handleTransformChange({ opacity: Number(e.target.value) })}
              className="w-full h-1.5 bg-editor-darker rounded-lg"
            />
          </div>
        </div>

        {/* Color Tag */}
        <div className="rounded-xl bg-editor-card/60 border border-editor-border p-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-editor-amber" /> Timeline Color Tag
          </div>
          <div className="flex items-center gap-2">
            {COLOR_TAGS.map((c) => (
              <button
                key={c}
                onClick={() => updateClip(activeClip.id, { colorTag: c })}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full transition-transform ${
                  activeClip.colorTag === c ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
