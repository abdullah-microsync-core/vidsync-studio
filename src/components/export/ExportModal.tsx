import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ExportProgress, ExportSettings, Resolution } from '../../types/editor';
import { exportEngine } from '../../services/exportEngine';
import { 
  Download, 
  X, 
  Film, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  Settings2, 
  FileVideo 
} from 'lucide-react';

export const ExportModal: React.FC = () => {
  const { isExportModalOpen, setExportModalOpen, project } = useEditorStore();

  const [settings, setSettings] = useState<ExportSettings>({
    format: 'webm',
    resolution: '1080p',
    fps: 30,
    quality: 'high',
  });

  const [progress, setProgress] = useState<ExportProgress>({
    status: 'idle',
    percentage: 0,
    currentFrame: 0,
    totalFrames: 0,
    elapsedTime: 0,
    estimatedTimeLeft: 0,
  });

  if (!isExportModalOpen) return null;

  const isRendering = progress.status === 'preparing' || progress.status === 'rendering' || progress.status === 'encoding';
  const isCompleted = progress.status === 'completed';

  const handleStartExport = async () => {
    try {
      await exportEngine.exportProject(project, settings, (p) => {
        setProgress(p);
      });
    } catch (err: any) {
      setProgress((prev) => ({ ...prev, status: 'error', error: err?.message || 'Export error' }));
    }
  };

  const handleCancel = () => {
    if (isRendering) {
      exportEngine.cancel();
    }
    setProgress({
      status: 'idle',
      percentage: 0,
      currentFrame: 0,
      totalFrames: 0,
      elapsedTime: 0,
      estimatedTimeLeft: 0,
    });
    setExportModalOpen(false);
  };

  const handleDownload = () => {
    if (!progress.outputUrl) return;
    const a = document.createElement('a');
    a.href = progress.outputUrl;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_${settings.resolution}.${settings.format}`;
    a.click();
  };

  // Estimated file size calculation
  const bitrate = settings.quality === 'high' ? 8 : settings.quality === 'medium' ? 5 : 2.5;
  const estimatedSizeMb = ((project.duration * bitrate) / 8).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-xl rounded-2xl bg-editor-panel border border-editor-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-editor-border bg-editor-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Export Video</h2>
              <p className="text-xs text-slate-400">Render your project into a high-quality video file</p>
            </div>
          </div>

          {!isRendering && (
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-editor-hover text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!isRendering && !isCompleted && (
            <>
              {/* Resolution selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Resolution</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['720p', '1080p', '4k'] as Resolution[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setSettings({ ...settings, resolution: res })}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                        settings.resolution === res
                          ? 'bg-editor-card border-editor-accent text-white ring-1 ring-editor-accent/40 shadow-sm font-bold'
                          : 'bg-editor-card/60 hover:bg-editor-card border-editor-border text-slate-300 font-semibold'
                      }`}
                    >
                      <span className="text-xs block uppercase">{res}</span>
                      <span className="text-[10px] text-slate-400">
                        {res === '720p' ? '1280 × 720' : res === '1080p' ? '1920 × 1080' : '3840 × 2160'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Rate & Quality */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Frame Rate</label>
                  <select
                    value={settings.fps}
                    onChange={(e) => setSettings({ ...settings, fps: Number(e.target.value) as 30 | 60 })}
                    className="w-full p-2.5 rounded-xl bg-editor-darker border border-editor-border text-xs text-slate-200 focus:border-editor-accent outline-none"
                  >
                    <option value={30}>30 FPS (Standard Web)</option>
                    <option value={60}>60 FPS (Ultra Smooth)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Quality Bitrate</label>
                  <select
                    value={settings.quality}
                    onChange={(e) => setSettings({ ...settings, quality: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-editor-darker border border-editor-border text-xs text-slate-200 focus:border-editor-accent outline-none"
                  >
                    <option value="high">High Quality (8 Mbps)</option>
                    <option value="medium">Balanced (5 Mbps)</option>
                    <option value="low">Fast / Small File (2.5 Mbps)</option>
                  </select>
                </div>
              </div>

              {/* Project summary card */}
              <div className="rounded-xl bg-editor-darker border border-editor-border p-3.5 flex items-center justify-between text-xs text-slate-300">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">{project.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Duration: {project.duration}s • Aspect: {project.aspectRatio}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-editor-cyan font-bold">~{estimatedSizeMb} MB</div>
                  <div className="text-[10px] text-slate-500">Estimated Size</div>
                </div>
              </div>
            </>
          )}

          {/* Rendering Progress View */}
          {isRendering && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="capitalize">{progress.status}...</span>
                <span className="font-mono text-editor-cyan text-sm">{progress.percentage}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-editor-darker rounded-full overflow-hidden p-0.5 border border-editor-border">
                <div
                  style={{ width: `${progress.percentage}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-150 shadow-lg shadow-cyan-500/30"
                />
              </div>

              {/* Progress metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                <div className="bg-editor-card p-2.5 rounded-xl border border-editor-border">
                  <span className="text-[10px] text-slate-400 block">Rendered Frames</span>
                  <span className="font-mono font-bold text-slate-200">
                    {progress.currentFrame} / {progress.totalFrames}
                  </span>
                </div>

                <div className="bg-editor-card p-2.5 rounded-xl border border-editor-border">
                  <span className="text-[10px] text-slate-400 block">Elapsed Time</span>
                  <span className="font-mono font-bold text-slate-200">{progress.elapsedTime}s</span>
                </div>

                <div className="bg-editor-card p-2.5 rounded-xl border border-editor-border">
                  <span className="text-[10px] text-slate-400 block">Est. Time Left</span>
                  <span className="font-mono font-bold text-editor-cyan">{progress.estimatedTimeLeft}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-editor-emerald/20 border border-editor-emerald/40 flex items-center justify-center text-editor-emerald mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">Video Rendered Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your video is ready to download in {settings.resolution} resolution.
                </p>
              </div>

              {progress.outputUrl && (
                <div className="max-w-md mx-auto aspect-video rounded-xl overflow-hidden border border-editor-border bg-black shadow-lg">
                  <video src={progress.outputUrl} controls className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-editor-border bg-editor-card">
          {!isRendering && !isCompleted && (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl hover:bg-editor-hover text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExport}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Start Export</span>
              </button>
            </>
          )}

          {isRendering && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-colors"
            >
              Cancel Render
            </button>
          )}

          {isCompleted && (
            <>
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-xl hover:bg-editor-hover text-xs font-semibold text-slate-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-editor-emerald hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Download Video</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
