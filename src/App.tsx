import React, { useEffect } from 'react';
import { useEditorStore } from './store/editorStore';
import { StorageService } from './services/storage';
import { Header } from './components/header/Header';
import { Sidebar } from './components/sidebar/Sidebar';
import { PreviewPlayer } from './components/preview/PreviewPlayer';
import { Timeline } from './components/timeline/Timeline';
import { ExportModal } from './components/export/ExportModal';
import { ProjectDashboardModal } from './components/header/ProjectDashboardModal';

import { updateProjectWithFreshStockAssets } from './services/stockAssets';
import { audioEngine } from './services/audioEngine';
import { compositor } from './services/compositor';

export const App: React.FC = () => {
  // Load last active project from storage on startup
  useEffect(() => {
    const init = async () => {
      const lastId = await StorageService.getLastActiveProjectId();
      if (lastId) {
        const p = await StorageService.loadProject(lastId);
        if (p) {
          const updated = updateProjectWithFreshStockAssets(p);
          useEditorStore.getState().setProject(updated);
        }
      }
    };
    init();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const state = useEditorStore.getState();
      const {
        project,
        currentTime,
        setCurrentTime,
        togglePlay,
        toggleMute,
        selectedClipId,
        splitClip,
        deleteClip,
        duplicateClip,
        undo,
        redo,
        zoom,
        setZoom,
      } = state;

      // Space -> Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (!state.isPlaying) {
          compositor.unlockMobileVideos();
          audioEngine.getAudioContext().resume().catch(() => {});
        }
        togglePlay();
      }
      // S -> Split active clip
      else if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        if (selectedClipId) {
          e.preventDefault();
          splitClip(selectedClipId, currentTime);
        }
      }
      // Delete / Backspace -> Delete clip
      else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          deleteClip(selectedClipId);
        }
      }
      // Ctrl+Z / Cmd+Z -> Undo
      else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Ctrl+Shift+Z -> Redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ')
      ) {
        e.preventDefault();
        redo();
      }
      // Ctrl+D -> Duplicate
      else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
        if (selectedClipId) {
          e.preventDefault();
          duplicateClip(selectedClipId);
        }
      }
      // Left Arrow -> Step 1 frame (or 1s with shift)
      else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / project.fps;
        setCurrentTime(Math.max(0, currentTime - step));
      }
      // Right Arrow -> Step 1 frame (or 1s with shift)
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / project.fps;
        setCurrentTime(Math.min(project.duration, currentTime + step));
      }
      // Home / End
      else if (e.code === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
      } else if (e.code === 'End') {
        e.preventDefault();
        setCurrentTime(project.duration);
      }
      // M -> Mute
      else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
      // + / - -> Zoom
      else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoom(zoom + 10);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(zoom - 10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-editor-bg text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative pb-16 md:pb-0">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <PreviewPlayer />
          <Timeline />
        </div>
      </div>

      {/* Modals */}
      <ExportModal />
      <ProjectDashboardModal />
    </div>
  );
};

export default App;
