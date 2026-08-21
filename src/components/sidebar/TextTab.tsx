import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { TEXT_TEMPLATES, TextTemplate } from '../../services/stockAssets';
import { TextOverlay } from '../../types/editor';
import { Type, Sparkles, Plus, Palette, Sliders } from 'lucide-react';

export const TextTab: React.FC = () => {
  const { project, addClip, currentTime, selectedClipId, updateClip } = useEditorStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Find currently selected clip if it's text
  let activeTextClip = null;
  project.tracks.forEach((t) => {
    const found = t.clips.find((c) => c.id === selectedClipId && c.type === 'text');
    if (found) activeTextClip = found;
  });

  const categories = ['All', 'Titles', 'Neon', 'Lower Thirds', 'Captions', 'Minimal'];

  const filteredTemplates = TEXT_TEMPLATES.filter((tpl) => {
    if (selectedCategory === 'All') return true;
    return tpl.category === selectedCategory;
  });

  const handleAddTemplate = (tpl: TextTemplate) => {
    let textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) {
      textTrack = project.tracks[0];
    }
    if (!textTrack) return;

    const overlay: TextOverlay = {
      text: tpl.text,
      fontFamily: tpl.fontFamily,
      fontSize: tpl.fontSize,
      color: tpl.color,
      backgroundColor: tpl.backgroundColor,
      backgroundPadding: tpl.backgroundPadding,
      backgroundRadius: tpl.backgroundRadius,
      strokeColor: tpl.strokeColor,
      strokeWidth: tpl.strokeWidth,
      shadowColor: tpl.shadowColor,
      shadowBlur: tpl.shadowBlur,
      textAlign: 'center',
      fontWeight: tpl.fontWeight,
      fontStyle: 'normal',
      animation: tpl.animation,
    };

    addClip(textTrack.id, {
      name: tpl.name,
      type: 'text',
      startTime: currentTime,
      duration: 5.0,
      text: overlay,
      colorTag: '#a855f7',
    });
  };

  const handleAddCustomText = () => {
    let textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) textTrack = project.tracks[0];
    if (!textTrack) return;

    addClip(textTrack.id, {
      name: 'Custom Heading',
      type: 'text',
      startTime: currentTime,
      duration: 5.0,
      text: {
        text: 'YOUR TEXT HERE',
        fontFamily: 'Montserrat',
        fontSize: 48,
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: '800',
        fontStyle: 'normal',
        animation: 'pop-in',
      },
      colorTag: '#a855f7',
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      {/* Quick Add Custom Text Button */}
      <button
        onClick={handleAddCustomText}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-editor-accent hover:bg-editor-accent-hover text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all"
      >
        <Plus className="w-4 h-4" />
        <span>Add Default Heading Text</span>
      </button>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-semibold text-slate-400 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
              selectedCategory === cat
                ? 'bg-editor-card text-editor-cyan border border-editor-cyan/30'
                : 'hover:bg-editor-hover hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Animated Text Templates ({filteredTemplates.length})
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => handleAddTemplate(tpl)}
              className="group relative rounded-xl border border-editor-border bg-editor-card/60 hover:bg-editor-card hover:border-editor-accent/60 p-3.5 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 group-hover:text-editor-cyan transition-colors">
                  {tpl.name}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-editor-panel text-slate-400 border border-editor-border">
                  {tpl.animation}
                </span>
              </div>

              {/* Visual typography preview banner */}
              <div className="h-16 rounded-lg bg-editor-darker flex items-center justify-center p-2 overflow-hidden border border-editor-border/40">
                <span
                  style={{
                    fontFamily: tpl.fontFamily,
                    fontSize: '18px',
                    fontWeight: tpl.fontWeight,
                    color: tpl.color,
                    textShadow: tpl.shadowColor ? `0 0 10px ${tpl.shadowColor}` : undefined,
                    backgroundColor: tpl.backgroundColor,
                    padding: tpl.backgroundColor ? '4px 8px' : undefined,
                    borderRadius: tpl.backgroundRadius,
                  }}
                  className="truncate text-center"
                >
                  {tpl.text}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                <span>Font: {tpl.fontFamily}</span>
                <span className="text-editor-accent font-semibold group-hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add to Video
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
