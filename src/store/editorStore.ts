import { create } from 'zustand';
import { AspectRatio, Clip, FilterSettings, MediaAsset, MediaType, Project, TextOverlay, Track, TrackType, Transition } from '../types/editor';
import { STOCK_AUDIO_TRACKS, STOCK_IMAGES, STOCK_VIDEOS } from '../services/stockAssets';
import { StorageService } from '../services/storage';

export type SidebarTab = 'media' | 'text' | 'filters' | 'transitions' | 'audio' | 'ai' | 'inspector';

interface HistoryState {
  past: Project[];
  future: Project[];
}

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  preset: 'none',
  brightness: 100,
  contrast: 100,
  saturation: 100,
  temperature: 0,
  tint: 0,
  blur: 0,
  vignette: 0,
  opacity: 100,
};

export const createDefaultProject = (): Project => {
  const videoTrack: Track = {
    id: 'track_v1',
    name: 'Video 1 (Main)',
    type: 'video',
    isMuted: false,
    isLocked: false,
    isHidden: false,
    volume: 1.0,
    clips: [
      {
        id: 'clip_v1_1',
        trackId: 'track_v1',
        name: 'Big Buck Bunny (Blender)',
        type: 'video',
        assetId: 'stock_vid_1',
        src: STOCK_VIDEOS[0].url,
        startTime: 0,
        duration: 8.0,
        trimIn: 0,
        trimOut: 8.0,
        sourceDuration: 15.0,
        speed: 1.0,
        volume: 1.0,
        fadeIn: 0.5,
        fadeOut: 0.5,
        transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
        filters: { ...DEFAULT_FILTER_SETTINGS, preset: 'cyberpunk' },
        transitionIn: { type: 'fade', duration: 0.6 },
        transitionOut: { type: 'crossfade', duration: 0.6 },
        colorTag: '#6366f1',
      },
      {
        id: 'clip_v1_2',
        trackId: 'track_v1',
        name: 'Tears of Steel (Blender)',
        type: 'video',
        assetId: 'stock_vid_3',
        src: STOCK_VIDEOS[2].url,
        startTime: 8.0,
        duration: 8.0,
        trimIn: 0,
        trimOut: 8.0,
        sourceDuration: 15.0,
        speed: 1.0,
        volume: 1.0,
        fadeIn: 0,
        fadeOut: 0.5,
        transform: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
        filters: { ...DEFAULT_FILTER_SETTINGS, preset: 'cinematic' },
        transitionIn: { type: 'wipe-left', duration: 0.8 },
        colorTag: '#06b6d4',
      },
    ],
  };

  const textTrack: Track = {
    id: 'track_t1',
    name: 'Text & Titles',
    type: 'text',
    isMuted: false,
    isLocked: false,
    isHidden: false,
    volume: 1.0,
    clips: [
      {
        id: 'clip_text_1',
        trackId: 'track_t1',
        name: 'Intro Title',
        type: 'text',
        startTime: 0.5,
        duration: 5.0,
        trimIn: 0,
        trimOut: 5.0,
        sourceDuration: 5.0,
        speed: 1.0,
        volume: 1.0,
        fadeIn: 0,
        fadeOut: 0,
        transform: { x: 0, y: -20, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
        text: {
          text: 'WELCOME TO VIDSYNC',
          fontFamily: 'Montserrat',
          fontSize: 48,
          color: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 4,
          shadowColor: '#06b6d4',
          shadowBlur: 20,
          textAlign: 'center',
          fontWeight: '900',
          fontStyle: 'normal',
          animation: 'pop-in',
        },
        filters: { ...DEFAULT_FILTER_SETTINGS },
        colorTag: '#a855f7',
      },
      {
        id: 'clip_text_2',
        trackId: 'track_t1',
        name: 'Subtitle Caption',
        type: 'text',
        startTime: 8.5,
        duration: 6.0,
        trimIn: 0,
        trimOut: 6.0,
        sourceDuration: 6.0,
        speed: 1.0,
        volume: 1.0,
        fadeIn: 0,
        fadeOut: 0,
        transform: { x: 0, y: 35, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
        text: {
          text: 'Next-Gen Browser Video Editing ⚡',
          fontFamily: 'Inter',
          fontSize: 32,
          color: '#facc15',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backgroundPadding: 12,
          backgroundRadius: 8,
          textAlign: 'center',
          fontWeight: '700',
          fontStyle: 'normal',
          animation: 'slide-up',
        },
        filters: { ...DEFAULT_FILTER_SETTINGS },
        colorTag: '#eab308',
      },
    ],
  };

  const audioTrack: Track = {
    id: 'track_a1',
    name: 'Audio & Music',
    type: 'audio',
    isMuted: false,
    isLocked: false,
    isHidden: false,
    volume: 0.8,
    clips: [],
  };

  const tracks = [textTrack, videoTrack, audioTrack];

  // Calculate true duration based on clips
  let maxDuration = 5;
  tracks.forEach(t => t.clips.forEach(c => {
    if (c.startTime + c.duration > maxDuration) maxDuration = c.startTime + c.duration;
  }));

  return {
    id: 'proj_' + Math.random().toString(36).substring(2, 9),
    name: 'Untitled Masterpiece',
    aspectRatio: '16:9',
    fps: 30,
    duration: maxDuration,
    tracks,
    assets: [...STOCK_VIDEOS, ...STOCK_IMAGES],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export interface EditorStore {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  isLooping: boolean;
  isMuted: boolean;
  masterVolume: number;
  zoom: number; // pixels per second (10 - 150)
  selectedClipId: string | null;
  selectedTrackId: string | null;
  snappingEnabled: boolean;
  activeSidebarTab: SidebarTab;
  isSidebarOpen: boolean;
  history: HistoryState;
  isExportModalOpen: boolean;
  isProjectModalOpen: boolean;
  audioLevels: { left: number; right: number };

  // Setters
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLooping: (looping: boolean) => void;
  togglePlay: () => void;
  setMasterVolume: (vol: number) => void;
  toggleMute: () => void;
  setZoom: (zoom: number) => void;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
  setProjectName: (name: string) => void;
  selectClip: (clipId: string | null) => void;
  selectTrack: (trackId: string | null) => void;
  setSnappingEnabled: (enabled: boolean) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setProjectModalOpen: (open: boolean) => void;
  setAudioLevels: (levels: { left: number; right: number }) => void;

  // Track actions
  addTrack: (type: TrackType, name?: string) => void;
  deleteTrack: (trackId: string) => void;
  toggleMuteTrack: (trackId: string) => void;
  toggleLockTrack: (trackId: string) => void;
  toggleHideTrack: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;

  // Clip actions
  addClip: (trackId: string, clipData: Partial<Clip>) => void;
  updateClip: (clipId: string, updates: Partial<Clip>, saveHistory?: boolean) => void;
  moveClip: (clipId: string, targetTrackId: string, newStartTime: number, saveHistory?: boolean) => void;
  trimClip: (clipId: string, newStartTime: number, newDuration: number, newTrimIn: number, saveHistory?: boolean) => void;
  splitClip: (clipId: string, splitTime?: number) => void;
  deleteClip: (clipId: string) => void;
  duplicateClip: (clipId: string) => void;

  // Asset actions
  addAsset: (asset: MediaAsset) => void;
  deleteAsset: (assetId: string) => void;

  // Project actions
  setProject: (project: Project) => void;
  newProject: () => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => {
  const initialProject = createDefaultProject();

  const recordHistory = (prevProject: Project) => {
    const { history } = get();
    return {
      past: [...history.past.slice(-25), JSON.parse(JSON.stringify(prevProject))],
      future: [],
    };
  };

  const calculateTotalDuration = (tracks: Track[]): number => {
    let max = 5;
    tracks.forEach((t) => {
      t.clips.forEach((c) => {
        const end = c.startTime + c.duration;
        if (end > max) max = end;
      });
    });
    return max;
  };

  return {
    project: initialProject,
    currentTime: 0,
    isPlaying: false,
    isLooping: false,
    isMuted: false,
    masterVolume: 1.0,
    zoom: 45,
    selectedClipId: null,
    selectedTrackId: null,
    snappingEnabled: true,
    activeSidebarTab: 'media',
    isSidebarOpen: false,
    history: { past: [], future: [] },
    isExportModalOpen: false,
    isProjectModalOpen: false,
    audioLevels: { left: 0, right: 0 },

    setCurrentTime: (time) => {
      const { project } = get();
      const clamped = Math.max(0, Math.min(project.duration, time));
      set({ currentTime: clamped });
    },

    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setIsLooping: (isLooping) => set({ isLooping }),

    togglePlay: () => {
      const { isPlaying, currentTime, project } = get();
      if (!isPlaying && currentTime >= project.duration) {
        set({ currentTime: 0, isPlaying: true });
      } else {
        set({ isPlaying: !isPlaying });
      }
    },

    setMasterVolume: (masterVolume) => set({ masterVolume: Math.max(0, Math.min(2, masterVolume)) }),

    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

    setZoom: (zoom) => set({ zoom: Math.max(15, Math.min(180, zoom)) }),

    setAspectRatio: (aspectRatio) => {
      const { project } = get();
      const history = recordHistory(project);
      const updated = { ...project, aspectRatio, updatedAt: Date.now() };
      set({ project: updated, history });
      StorageService.saveProject(updated);
    },

    setProjectName: (name) => {
      const { project } = get();
      const updated = { ...project, name, updatedAt: Date.now() };
      set({ project: updated });
      StorageService.saveProject(updated);
    },

    selectClip: (clipId) => set({ selectedClipId: clipId }),

    selectTrack: (trackId) => set({ selectedTrackId: trackId }),

    setSnappingEnabled: (snappingEnabled) => set({ snappingEnabled }),

    setActiveSidebarTab: (activeSidebarTab) => set({ activeSidebarTab, isSidebarOpen: true }),
    setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

    setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),

    setProjectModalOpen: (isProjectModalOpen) => set({ isProjectModalOpen }),

    setAudioLevels: (audioLevels) => set({ audioLevels }),

    // Track methods
    addTrack: (type, name) => {
      const { project } = get();
      const history = recordHistory(project);
      const trackCount = project.tracks.filter((t) => t.type === type).length + 1;
      const newTrack: Track = {
        id: `track_${type}_${Date.now()}`,
        name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${trackCount}`,
        type,
        isMuted: false,
        isLocked: false,
        isHidden: false,
        volume: 1.0,
        clips: [],
      };
      const updated = {
        ...project,
        tracks: [...project.tracks, newTrack],
        updatedAt: Date.now(),
      };
      set({ project: updated, history });
      StorageService.saveProject(updated);
    },

    deleteTrack: (trackId) => {
      const { project } = get();
      const history = recordHistory(project);
      const tracks = project.tracks.filter((t) => t.id !== trackId);
      const updated = {
        ...project,
        tracks,
        duration: calculateTotalDuration(tracks),
        updatedAt: Date.now(),
      };
      set({ project: updated, history, selectedTrackId: null });
      StorageService.saveProject(updated);
    },

    toggleMuteTrack: (trackId) => {
      const { project } = get();
      const tracks = project.tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t));
      set({ project: { ...project, tracks } });
    },

    toggleLockTrack: (trackId) => {
      const { project } = get();
      const tracks = project.tracks.map((t) => (t.id === trackId ? { ...t, isLocked: !t.isLocked } : t));
      set({ project: { ...project, tracks } });
    },

    toggleHideTrack: (trackId) => {
      const { project } = get();
      const tracks = project.tracks.map((t) => (t.id === trackId ? { ...t, isHidden: !t.isHidden } : t));
      set({ project: { ...project, tracks } });
    },

    setTrackVolume: (trackId, volume) => {
      const { project } = get();
      const tracks = project.tracks.map((t) => (t.id === trackId ? { ...t, volume } : t));
      set({ project: { ...project, tracks } });
    },

    // Clip methods
    addClip: (trackId, clipData) => {
      const { project, currentTime } = get();
      const history = recordHistory(project);

      const targetTrack = project.tracks.find((t) => t.id === trackId);
      if (!targetTrack) return;

      const duration = clipData.duration || 5.0;
      const startTime = clipData.startTime !== undefined ? clipData.startTime : currentTime;

      const newClip: Clip = {
        id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        trackId,
        name: clipData.name || 'New Clip',
        type: clipData.type || 'video',
        assetId: clipData.assetId,
        src: clipData.src,
        startTime,
        duration,
        trimIn: clipData.trimIn || 0,
        trimOut: clipData.trimOut || duration,
        sourceDuration: clipData.sourceDuration || duration,
        speed: clipData.speed || 1.0,
        volume: clipData.volume !== undefined ? clipData.volume : 1.0,
        fadeIn: clipData.fadeIn || 0,
        fadeOut: clipData.fadeOut || 0,
        transform: clipData.transform || { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, blendMode: 'normal' },
        text: clipData.text,
        filters: clipData.filters || { ...DEFAULT_FILTER_SETTINGS },
        transitionIn: clipData.transitionIn,
        transitionOut: clipData.transitionOut,
        waveform: clipData.waveform,
        colorTag: clipData.colorTag || (clipData.type === 'video' ? '#6366f1' : clipData.type === 'audio' ? '#10b981' : '#ec4899'),
      };

      let newAspectRatio = project.aspectRatio;
      
      // Auto-adjust aspect ratio if this is the first visual clip added to the timeline
      if (clipData.type === 'video' || clipData.type === 'image') {
        const hasVisualClips = project.tracks.some(t => 
          (t.type === 'video' || t.type === 'overlay') && t.clips.length > 0
        );
        
        if (!hasVisualClips && clipData.assetId) {
          const asset = project.media.find(m => m.id === clipData.assetId);
          if (asset && asset.width && asset.height) {
            const ratio = asset.width / asset.height;
            if (ratio > 2.0) newAspectRatio = '21:9';
            else if (ratio > 1.2) newAspectRatio = '16:9';
            else if (ratio > 0.9) newAspectRatio = '1:1';
            else if (ratio > 0.7) newAspectRatio = '4:5';
            else newAspectRatio = '9:16';
          }
        }
      }

      const tracks = project.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.startTime - b.startTime) } : t
      );

      const updated = {
        ...project,
        tracks,
        aspectRatio: newAspectRatio,
        duration: calculateTotalDuration(tracks),
        updatedAt: Date.now(),
      };

      set({ project: updated, history, selectedClipId: newClip.id });
      StorageService.saveProject(updated);
    },

    updateClip: (clipId, updates, saveHistory = true) => {
      const { project } = get();
      const history = saveHistory ? recordHistory(project) : get().history;

      const tracks = project.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
      }));

      const updated = {
        ...project,
        tracks,
        duration: calculateTotalDuration(tracks),
        updatedAt: Date.now(),
      };

      set({ project: updated, history });
      if (saveHistory) StorageService.saveProject(updated);
    },

    moveClip: (clipId, targetTrackId, newStartTime, saveHistory = true) => {
      const { project, snappingEnabled } = get();
      const history = saveHistory ? recordHistory(project) : get().history;

      let targetClip: Clip | null = null;
      let originalTrackId = '';

      project.tracks.forEach((t) => {
        const found = t.clips.find((c) => c.id === clipId);
        if (found) {
          targetClip = { ...found };
          originalTrackId = t.id;
        }
      });

      if (!targetClip) return;

      let safeStartTime = Math.max(0, newStartTime);

      // Magnetic Snapping logic
      if (snappingEnabled) {
        const snapThreshold = 0.3; // seconds
        // Snap to 0
        if (Math.abs(safeStartTime) < snapThreshold) {
          safeStartTime = 0;
        }
        // Snap to other clip start/ends
        project.tracks.forEach((t) => {
          t.clips.forEach((c) => {
            if (c.id === clipId) return;
            const cEnd = c.startTime + c.duration;
            if (Math.abs(safeStartTime - c.startTime) < snapThreshold) {
              safeStartTime = c.startTime;
            } else if (Math.abs(safeStartTime - cEnd) < snapThreshold) {
              safeStartTime = cEnd;
            } else if (Math.abs((safeStartTime + (targetClip as Clip).duration) - c.startTime) < snapThreshold) {
              safeStartTime = c.startTime - (targetClip as Clip).duration;
            }
          });
        });
      }

      const updatedClip: Clip = {
        ...(targetClip as Clip),
        trackId: targetTrackId,
        startTime: Math.max(0, safeStartTime),
      };

      const tracks = project.tracks.map((t) => {
        if (t.id === originalTrackId && t.id !== targetTrackId) {
          return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
        }
        if (t.id === targetTrackId) {
          const otherClips = t.clips.filter((c) => c.id !== clipId);
          return { ...t, clips: [...otherClips, updatedClip].sort((a, b) => a.startTime - b.startTime) };
        }
        return t;
      });

      const updated = {
        ...project,
        tracks,
        duration: calculateTotalDuration(tracks),
        updatedAt: Date.now(),
      };

      set({ project: updated, history });
      if (saveHistory) StorageService.saveProject(updated);
    },

    trimClip: (clipId, newStartTime, newDuration, newTrimIn, saveHistory = true) => {
      const { project } = get();
      const history = saveHistory ? recordHistory(project) : get().history;

      const tracks = project.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => {
          if (c.id === clipId) {
            return {
              ...c,
              startTime: Math.max(0, newStartTime),
              duration: Math.max(0.2, newDuration),
              trimIn: Math.max(0, newTrimIn),
              trimOut: Math.max(0, newTrimIn + newDuration),
            };
          }
          return c;
        }),
      }));

      const updated = {
        ...project,
        tracks,
        duration: calculateTotalDuration(tracks),
        updatedAt: Date.now(),
      };

      set({ project: updated, history });
      if (saveHistory) StorageService.saveProject(updated);
    },

    splitClip: (clipId, splitTime) => {
      const { project, currentTime } = get();
      const targetTime = splitTime !== undefined ? splitTime : currentTime;

      let foundClip: Clip | null = null;
      let trackId = '';

      project.tracks.forEach((t) => {
        const c = t.clips.find((clip) => clip.id === clipId);
        if (c) {
          foundClip = c;
          trackId = t.id;
        }
      });

      if (!foundClip) return;
      const clip = foundClip as Clip;
      const clipEnd = clip.startTime + clip.duration;

      if (targetTime <= clip.startTime + 0.1 || targetTime >= clipEnd - 0.1) {
        return; // Split point out of bounds
      }

      const history = recordHistory(project);
      const firstDuration = targetTime - clip.startTime;
      const secondDuration = clip.duration - firstDuration;

      const firstClip: Clip = {
        ...clip,
        duration: firstDuration,
        trimOut: clip.trimIn + firstDuration * clip.speed,
      };

      const secondClip: Clip = {
        ...clip,
        id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        startTime: targetTime,
        duration: secondDuration,
        trimIn: clip.trimIn + firstDuration * clip.speed,
        trimOut: clip.trimOut,
      };

      const tracks = project.tracks.map((t) => {
        if (t.id === trackId) {
          const newClips = t.clips.filter((c) => c.id !== clipId);
          newClips.push(firstClip, secondClip);
          return { ...t, clips: newClips.sort((a, b) => a.startTime - b.startTime) };
        }
        return t;
      });

      const updated = { ...project, tracks, updatedAt: Date.now() };
      set({ project: updated, history, selectedClipId: secondClip.id });
      StorageService.saveProject(updated);
    },

    deleteClip: (clipId) => {
      const { project } = get();
      const history = recordHistory(project);

      const tracks = project.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      }));

      const updated = {
        ...project,
        tracks,
        duration: calculateTotalDuration(tracks),
        updatedAt: Date.now(),
      };

      set({ project: updated, history, selectedClipId: null });
      StorageService.saveProject(updated);
    },

    duplicateClip: (clipId) => {
      const { project } = get();
      let targetClip: Clip | null = null;
      let targetTrackId = '';

      project.tracks.forEach((t) => {
        const c = t.clips.find((clip) => clip.id === clipId);
        if (c) {
          targetClip = c;
          targetTrackId = t.id;
        }
      });

      if (!targetClip) return;
      const history = recordHistory(project);
      const clip = targetClip as Clip;

      const duplicate: Clip = {
        ...clip,
        id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: `${clip.name} (Copy)`,
        startTime: clip.startTime + clip.duration + 0.2,
      };

      const tracks = project.tracks.map((t) => {
        if (t.id === targetTrackId) {
          return { ...t, clips: [...t.clips, duplicate].sort((a, b) => a.startTime - b.startTime) };
        }
        return t;
      });

      const updated = {
        ...project,
        tracks,
        duration: calculateTotalDuration(tracks),
        updatedAt: Date.now(),
      };

      set({ project: updated, history, selectedClipId: duplicate.id });
      StorageService.saveProject(updated);
    },

    addAsset: (asset) => {
      const { project } = get();
      const updated = {
        ...project,
        assets: [asset, ...project.assets],
        updatedAt: Date.now(),
      };
      set({ project: updated });
      StorageService.saveProject(updated);
    },

    deleteAsset: (assetId) => {
      const { project } = get();
      const updated = {
        ...project,
        assets: project.assets.filter((a) => a.id !== assetId),
        updatedAt: Date.now(),
      };
      set({ project: updated });
      StorageService.saveProject(updated);
    },

    setProject: (project) => {
      set({ project, currentTime: 0, selectedClipId: null, selectedTrackId: null });
      StorageService.saveProject(project);
    },

    newProject: () => {
      const newProj = createDefaultProject();
      set({ project: newProj, currentTime: 0, selectedClipId: null, selectedTrackId: null });
      StorageService.saveProject(newProj);
    },

    undo: () => {
      const { history, project } = get();
      if (history.past.length === 0) return;

      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, history.past.length - 1);

      set({
        project: previous,
        history: {
          past: newPast,
          future: [JSON.parse(JSON.stringify(project)), ...history.future],
        },
      });
      StorageService.saveProject(previous);
    },

    redo: () => {
      const { history, project } = get();
      if (history.future.length === 0) return;

      const next = history.future[0];
      const newFuture = history.future.slice(1);

      set({
        project: next,
        history: {
          past: [...history.past, JSON.parse(JSON.stringify(project))],
          future: newFuture,
        },
      });
      StorageService.saveProject(next);
    },
  };
});
