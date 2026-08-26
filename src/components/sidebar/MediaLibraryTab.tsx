import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { MediaAsset, MediaType } from '../../types/editor';
import { StorageService } from '../../services/storage';
import { 
  UploadCloud, 
  Video, 
  Music, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Play, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export const MediaLibraryTab: React.FC = () => {
  const { project, addAsset, deleteAsset, addClip, currentTime } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const filteredAssets = project.assets.filter((a) => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  const processUploadedFile = async (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isAudio && !isImage) {
      alert('Unsupported file format. Please upload video, audio, or image files.');
      return;
    }

    const type: MediaType = isVideo ? 'video' : isAudio ? 'audio' : 'image';
    const objectUrl = URL.createObjectURL(file);
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let duration = 5.0;
    let width: number | undefined;
    let height: number | undefined;
    let thumbnail: string | undefined;

    // Extract metadata
    if (isVideo) {
      const v = document.createElement('video');
      v.src = objectUrl;
      v.preload = 'metadata';
      await new Promise((resolve) => {
        const handleReady = () => {
          duration = v.duration || 5.0;
          width = v.videoWidth;
          height = v.videoHeight;
          resolve(null);
        };

        v.onloadedmetadata = () => {
          if (v.duration === Infinity) {
            v.currentTime = 1e8;
            v.ondurationchange = () => {
              v.currentTime = 0;
              handleReady();
            };
          } else {
            handleReady();
          }
        };
        v.onerror = () => resolve(null);
      });
    } else if (isAudio) {
      const a = document.createElement('audio');
      a.src = objectUrl;
      a.preload = 'metadata';
      await new Promise((resolve) => {
        const handleReady = () => {
          duration = a.duration || 5.0;
          resolve(null);
        };

        a.onloadedmetadata = () => {
          if (a.duration === Infinity) {
            a.currentTime = 1e8;
            a.ondurationchange = () => {
              a.currentTime = 0;
              handleReady();
            };
          } else {
            handleReady();
          }
        };
        a.onerror = () => resolve(null);
      });
    }

    // Save blob to IndexedDB for persistent reload
    await StorageService.saveAssetBlob(assetId, file);

    const newAsset: MediaAsset = {
      id: assetId,
      name: file.name,
      type,
      url: objectUrl,
      duration,
      width,
      height,
      thumbnail,
      size: file.size,
      createdAt: Date.now(),
    };

    addAsset(newAsset);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      await processUploadedFile(files[i]);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      await processUploadedFile(files[i]);
    }
    setIsUploading(false);
  };

  const handleAddToTimeline = (asset: MediaAsset) => {
    // Find or create appropriate track
    let track = project.tracks.find((t) => (asset.type === 'video' || asset.type === 'image' ? t.type === 'video' : t.type === 'audio'));
    if (!track) {
      track = project.tracks[0];
    }
    if (!track) return;

    addClip(track.id, {
      name: asset.name,
      type: asset.type,
      assetId: asset.id,
      src: asset.url,
      startTime: currentTime,
      duration: asset.type === 'image' ? 5.0 : (asset.duration || 5.0),
      sourceDuration: asset.duration || 5.0,
      trimIn: 0,
      trimOut: asset.type === 'image' ? 5.0 : (asset.duration || 5.0),
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
          isDraggingOver
            ? 'border-editor-cyan bg-editor-cyan/10 scale-[0.99]'
            : 'border-editor-border hover:border-editor-accent/60 bg-editor-card/40 hover:bg-editor-card/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-editor-accent/20 border border-editor-accent/30 flex items-center justify-center text-editor-accent">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200">
              {isUploading ? 'Importing files...' : 'Click or Drag Media Here'}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Supports MP4, WebM, MOV, MP3, WAV, PNG, JPG
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-editor-darker p-1 rounded-lg border border-editor-border text-xs font-semibold text-slate-400">
        {(['all', 'video', 'audio', 'image'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`flex-1 py-1 px-2 rounded-md capitalize transition-all ${
              filterType === t ? 'bg-editor-card text-white shadow-sm' : 'hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Project Media ({filteredAssets.length})</span>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No media found in this filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredAssets.map((asset) => {
              const Icon = asset.type === 'video' ? Video : asset.type === 'audio' ? Music : ImageIcon;
              return (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify(asset));
                  }}
                  className="group relative rounded-xl border border-editor-border/80 bg-editor-card hover:bg-editor-hover overflow-hidden transition-all duration-200 flex flex-col cursor-grab active:cursor-grabbing"
                >
                  {/* Thumbnail / Media icon preview */}
                  <div className="relative aspect-video bg-editor-darker flex items-center justify-center overflow-hidden">
                    {asset.thumbnail || (asset.type === 'image' && asset.url) ? (
                      <img
                        src={asset.thumbnail || asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-editor-panel flex items-center justify-center text-slate-400 group-hover:text-editor-cyan transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    )}

                    {/* Duration badge */}
                    {asset.duration > 0 && asset.type !== 'image' && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-semibold text-slate-200 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{Math.round(asset.duration)}s</span>
                      </div>
                    )}

                    {/* Overlay quick add button */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <button
                        onClick={() => handleAddToTimeline(asset)}
                        title="Add to Timeline at Playhead"
                        className="w-8 h-8 rounded-full bg-editor-accent hover:bg-editor-accent-hover text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {!asset.isStock && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAsset(asset.id);
                          }}
                          title="Delete from Media Library"
                          className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Type */}
                  <div className="p-2 flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 truncate" title={asset.name}>
                      {asset.name}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="capitalize">{asset.type}</span>
                      {asset.isStock && (
                        <span className="text-editor-cyan font-semibold">Stock</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
