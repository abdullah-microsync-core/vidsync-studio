import React, { useState } from 'react';
import { AspectRatio } from '../../types/editor';
import { useEditorStore } from '../../store/editorStore';
import { Smartphone, Monitor, Square, Tv, Film } from 'lucide-react';

const RATIO_CONFIG: { ratio: AspectRatio; label: string; sub: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { ratio: '16:9', label: '16:9', sub: 'YouTube / Widescreen', icon: Monitor },
  { ratio: '9:16', label: '9:16', sub: 'TikTok / Shorts / Reels', icon: Smartphone },
  { ratio: '1:1', label: '1:1', sub: 'Instagram / Square', icon: Square },
  { ratio: '4:5', label: '4:5', sub: 'Instagram Portrait', icon: Tv },
  { ratio: '21:9', label: '21:9', sub: 'Ultrawide Cinema', icon: Film },
];

export const AspectRatioPicker: React.FC = () => {
  const { project, setAspectRatio } = useEditorStore();
  const [isOpen, setIsOpen] = useState(false);

  const current = RATIO_CONFIG.find((r) => r.ratio === project.aspectRatio) || RATIO_CONFIG[0];
  const CurrentIcon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-editor-card hover:bg-editor-hover border border-editor-border text-xs font-semibold text-slate-200 transition-colors"
        title="Change Aspect Ratio"
      >
        <CurrentIcon className="w-4 h-4 text-editor-cyan" />
        <span>{current.label}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 w-60 rounded-xl bg-editor-panel border border-editor-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1 mb-1">
              Canvas Aspect Ratio
            </div>
            <div className="space-y-1">
              {RATIO_CONFIG.map((item) => {
                const Icon = item.icon;
                const isSelected = project.aspectRatio === item.ratio;
                return (
                  <button
                    key={item.ratio}
                    onClick={() => {
                      setAspectRatio(item.ratio);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-editor-accent text-white font-medium shadow-md'
                        : 'hover:bg-editor-hover text-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {item.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
