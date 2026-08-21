import React from 'react';
import { useEditorStore, SidebarTab } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { MediaLibraryTab } from './MediaLibraryTab';
import { TextTab } from './TextTab';
import { FiltersTab } from './FiltersTab';
import { TransitionsTab } from './TransitionsTab';
import { AudioTab } from './AudioTab';
import { AIStudioTab } from './AIStudioTab';
import { InspectorTab } from './InspectorTab';
import { 
  Folder, 
  Type, 
  Sparkles, 
  Sliders, 
  Music, 
  Bot, 
  SlidersHorizontal 
} from 'lucide-react';

const TABS: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'media', label: 'Media', icon: Folder },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'filters', label: 'Filters', icon: Sparkles },
  { id: 'transitions', label: 'Transitions', icon: SlidersHorizontal },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'ai', label: 'AI Studio', icon: Bot },
  { id: 'inspector', label: 'Inspector', icon: Sliders },
];

export const Sidebar: React.FC = () => {
  const { activeSidebarTab, setActiveSidebarTab, selectedClipId } = useEditorStore(useShallow(state => ({
    activeSidebarTab: state.activeSidebarTab,
    setActiveSidebarTab: state.setActiveSidebarTab,
    selectedClipId: state.selectedClipId
  })));

  return (
    <aside className="w-80 md:w-96 flex bg-editor-panel border-r border-editor-border select-none z-20 overflow-hidden">
      {/* Left Icon Navigation Rail */}
      <nav className="w-16 flex flex-col items-center py-3 bg-editor-darker border-r border-editor-border space-y-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSidebarTab === tab.id;
          const isInspector = tab.id === 'inspector';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSidebarTab(tab.id)}
              className={`group relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? 'bg-editor-accent text-white shadow-lg shadow-indigo-500/25'
                  : 'hover:bg-editor-hover text-slate-400 hover:text-slate-200'
              }`}
              title={tab.label}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-semibold tracking-tight">{tab.label}</span>

              {/* Indicator dot if inspector has a selected clip */}
              {isInspector && selectedClipId && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-editor-cyan ring-2 ring-editor-darker" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Tab Content Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-editor-panel/60 overflow-hidden">
        {/* Header */}
        <div className="h-10 px-4 border-b border-editor-border/80 flex items-center justify-between bg-editor-card/40">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {TABS.find((t) => t.id === activeSidebarTab)?.label}
          </span>
        </div>

        {/* Tab Components */}
        <div className="flex-1 overflow-hidden">
          {activeSidebarTab === 'media' && <MediaLibraryTab />}
          {activeSidebarTab === 'text' && <TextTab />}
          {activeSidebarTab === 'filters' && <FiltersTab />}
          {activeSidebarTab === 'transitions' && <TransitionsTab />}
          {activeSidebarTab === 'audio' && <AudioTab />}
          {activeSidebarTab === 'ai' && <AIStudioTab />}
          {activeSidebarTab === 'inspector' && <InspectorTab />}
        </div>
      </div>
    </aside>
  );
};
