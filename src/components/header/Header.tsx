import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { AspectRatioPicker } from './AspectRatioPicker';
import { 
  Film, 
  Undo2, 
  Redo2, 
  Download, 
  FolderOpen, 
  Sparkles, 
  Check, 
  Edit3, 
  Layers 
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    project,
    setProjectName,
    history,
    undo,
    redo,
    setExportModalOpen,
    setProjectModalOpen,
  } = useEditorStore(useShallow(state => ({
    project: state.project,
    setProjectName: state.setProjectName,
    history: state.history,
    undo: state.undo,
    redo: state.redo,
    setExportModalOpen: state.setExportModalOpen,
    setProjectModalOpen: state.setProjectModalOpen,
  })));

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.name);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setProjectName(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSubmit();
    if (e.key === 'Escape') {
      setTitleInput(project.name);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="h-14 border-b border-editor-border bg-editor-panel/95 backdrop-blur-md px-4 flex items-center justify-between select-none z-30">
      {/* Left: Brand + Project Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Film className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              VidSync
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-editor-accent/20 border border-editor-accent/40 text-editor-cyan tracking-wider">
              PRO
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-editor-border" />

        {/* Project Name Editor */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="px-2 py-1 text-xs font-semibold rounded bg-editor-card border border-editor-accent text-slate-100 outline-none w-48"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 rounded bg-editor-accent text-white hover:bg-editor-accent-hover"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTitleInput(project.name);
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white px-2 py-1 rounded-lg hover:bg-editor-hover transition-colors"
              title="Click to rename project"
            >
              <span className="truncate max-w-[180px]">{project.name}</span>
              <Edit3 className="w-3 h-3 text-slate-500" />
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-400 bg-editor-card px-2 py-0.5 rounded-full border border-editor-border">
            <div className="w-1.5 h-1.5 rounded-full bg-editor-emerald animate-pulse" />
            <span>Auto-saved</span>
          </div>
        </div>
      </div>

      {/* Center: Undo/Redo & Aspect Ratio */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-editor-card border border-editor-border rounded-lg p-0.5">
          <button
            onClick={undo}
            disabled={history.past.length === 0}
            className="p-1.5 rounded hover:bg-editor-hover disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={history.future.length === 0}
            className="p-1.5 rounded hover:bg-editor-hover disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <AspectRatioPicker />
      </div>

      {/* Right: Project Manager & Export Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setProjectModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-editor-card hover:bg-editor-hover border border-editor-border text-xs font-semibold text-slate-200 transition-colors"
          title="Open Project Manager"
        >
          <FolderOpen className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};
