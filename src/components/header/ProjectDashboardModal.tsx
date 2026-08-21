import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { StorageService } from '../../services/storage';
import { Project } from '../../types/editor';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  X, 
  Calendar, 
  Clock, 
  Film, 
  CheckCircle2 
} from 'lucide-react';

import { updateProjectWithFreshStockAssets } from '../../services/stockAssets';

export const ProjectDashboardModal: React.FC = () => {
  const { isProjectModalOpen, setProjectModalOpen, project, setProject, newProject } = useEditorStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isProjectModalOpen) {
      loadProjects();
    }
  }, [isProjectModalOpen]);

  const loadProjects = async () => {
    setLoading(true);
    const list = await StorageService.listProjects();
    setProjects(list);
    setLoading(false);
  };

  const handleOpenProject = async (p: Project) => {
    const updated = updateProjectWithFreshStockAssets(p);
    setProject(updated);
    setProjectModalOpen(false);
  };

  const handleCreateNew = () => {
    newProject();
    setProjectModalOpen(false);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      await StorageService.deleteProject(id);
      loadProjects();
    }
  };

  const handleDuplicate = async (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned: Project = {
      ...p,
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name: `${p.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await StorageService.saveProject(cloned);
    loadProjects();
  };

  const handleExportJSON = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonStr = JSON.stringify(p, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.toLowerCase().replace(/\s+/g, '_')}_vidforge.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Project;
        if (!imported.id || !imported.tracks) {
          alert('Invalid VidForge project file.');
          return;
        }
        imported.id = 'proj_' + Math.random().toString(36).substring(2, 9);
        imported.name = `${imported.name} (Imported)`;
        imported.updatedAt = Date.now();
        await StorageService.saveProject(imported);
        setProject(imported);
        setProjectModalOpen(false);
      } catch (err) {
        alert('Failed to parse project JSON file.');
      }
    };
    reader.readAsText(file);
  };

  if (!isProjectModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-editor-panel border border-editor-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-editor-border bg-editor-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-editor-accent/20 border border-editor-accent/40 flex items-center justify-center text-editor-accent">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Project Manager</h2>
              <p className="text-xs text-slate-400">Save, restore, or export your VidForge projects</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-editor-hover hover:bg-editor-active border border-editor-border text-xs font-semibold text-slate-200 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-editor-cyan" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-editor-accent hover:bg-editor-accent-hover text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>

            <button
              onClick={() => setProjectModalOpen(false)}
              className="p-1.5 rounded-lg hover:bg-editor-hover text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project List Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No saved projects found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Your current edits are automatically saved in local browser storage.
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-editor-accent hover:bg-editor-accent-hover text-white text-sm font-semibold shadow-lg shadow-indigo-500/25"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => {
                const isCurrent = p.id === project.id;
                const totalClips = p.tracks.reduce((acc, t) => acc + t.clips.length, 0);
                const updatedDate = new Date(p.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenProject(p)}
                    className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                      isCurrent
                        ? 'bg-editor-card border-editor-accent ring-1 ring-editor-accent/40 shadow-xl'
                        : 'bg-editor-card/60 hover:bg-editor-card border-editor-border hover:border-slate-600 hover:shadow-lg'
                    }`}
                  >
                    {/* Thumbnail / Aspect preview */}
                    <div className="relative aspect-video rounded-lg bg-editor-bg border border-editor-border/60 overflow-hidden mb-3 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1.5 text-slate-500">
                        <Film className="w-8 h-8 text-editor-accent/80" />
                        <span className="text-[10px] font-mono uppercase bg-editor-panel px-2 py-0.5 rounded border border-editor-border">
                          {p.aspectRatio} • {p.fps}fps
                        </span>
                      </div>

                      {isCurrent && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-editor-emerald/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </div>
                      )}
                    </div>

                    {/* Title & info */}
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-editor-accent transition-colors truncate">
                      {p.name}
                    </h4>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{p.duration}s</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-slate-500" />
                        <span>{totalClips} clips</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                        <Calendar className="w-3 h-3" />
                        <span>{updatedDate}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-editor-border/60">
                      <button
                        onClick={(e) => handleExportJSON(p, e)}
                        title="Export Project JSON"
                        className="p-1.5 rounded-lg hover:bg-editor-hover text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(p, e)}
                        title="Duplicate Project"
                        className="p-1.5 rounded-lg hover:bg-editor-hover text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(p.id, e)}
                        title="Delete Project"
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
