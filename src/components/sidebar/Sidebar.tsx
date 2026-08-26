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
  SlidersHorizontal,
  X
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
  const { activeSidebarTab, setActiveSidebarTab, selectedClipId, isSidebarOpen, setIsSidebarOpen } = useEditorStore(useShallow(state => ({
    activeSidebarTab: state.activeSidebarTab,
    setActiveSidebarTab: state.setActiveSidebarTab,
    selectedClipId: state.selectedClipId,
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen
  })));

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Visible only on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around bg-editor-darker border-t border-editor-border z-40 px-2 pb-safe">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSidebarTab === tab.id && isSidebarOpen;
          const isInspector = tab.id === 'inspector';

          return (
            <button
              key={`mobile-${tab.id}`}
              onClick={() => {
                if (isActive) setIsSidebarOpen(false);
                else setActiveSidebarTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full ${
                isActive ? 'text-editor-cyan' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {isInspector && selectedClipId && (
                <div className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-editor-cyan ring-2 ring-editor-darker" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/50 transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar OR Mobile Bottom Sheet */}
      <aside className={`
        flex flex-col select-none z-50 overflow-hidden bg-editor-panel
        md:w-96 md:static md:flex-row md:border-r md:border-editor-border md:translate-y-0
        fixed left-0 right-0 bottom-16 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-editor-border
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-y-0 pointer-events-auto visible' : 'translate-y-full md:translate-y-0 pointer-events-none invisible md:pointer-events-auto md:visible'}
        h-[55vh] md:h-auto
      `}>
        {/* Desktop Left Rail (Hidden on mobile) */}
        <nav className="hidden md:flex w-16 flex-col items-center py-3 bg-editor-darker border-r border-editor-border space-y-1">
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
        <div className="h-12 md:h-10 px-4 border-b border-editor-border/80 flex items-center justify-between bg-editor-card/40">
          <span className="text-sm md:text-xs font-bold uppercase tracking-wider text-slate-200">
            {TABS.find((t) => t.id === activeSidebarTab)?.label}
          </span>
          <button 
            className="md:hidden p-2 -mr-2 rounded-full hover:bg-editor-hover text-slate-400 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
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
    </>
  );
};
