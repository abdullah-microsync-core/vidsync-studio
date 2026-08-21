import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { Track } from '../../types/editor';
import { 
  Video, 
  Music, 
  Type, 
  Layers, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2 
} from 'lucide-react';

interface TrackHeaderProps {
  track: Track;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track }) => {
  const {
    toggleMuteTrack,
    toggleHideTrack,
    toggleLockTrack,
    setTrackVolume,
    deleteTrack,
    selectTrack,
    selectedTrackId,
  } = useEditorStore(useShallow(state => ({
    toggleMuteTrack: state.toggleMuteTrack,
    toggleHideTrack: state.toggleHideTrack,
    toggleLockTrack: state.toggleLockTrack,
    setTrackVolume: state.setTrackVolume,
    deleteTrack: state.deleteTrack,
    selectTrack: state.selectTrack,
    selectedTrackId: state.selectedTrackId,
  })));

  const isSelected = selectedTrackId === track.id;

  const Icon =
    track.type === 'video' ? Video : track.type === 'audio' ? Music : track.type === 'text' ? Type : Layers;

  return (
    <div
      onClick={() => selectTrack(track.id)}
      className={`w-48 h-16 shrink-0 border-r border-b border-editor-border px-3 py-2 flex flex-col justify-between select-none transition-colors ${
        isSelected ? 'bg-editor-active border-r-editor-accent' : 'bg-editor-panel/90 hover:bg-editor-hover'
      }`}
    >
      {/* Top row: Icon, Name & Delete */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Icon className="w-3.5 h-3.5 text-editor-cyan shrink-0" />
          <span className="text-xs font-bold text-slate-200 truncate tracking-tight">{track.name}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTrack(track.id);
          }}
          title="Delete Track"
          className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom row: Mute, Hide, Lock, Volume */}
      <div className="flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-1">
          {/* Mute */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMuteTrack(track.id);
            }}
            title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
            className={`p-1 rounded hover:bg-editor-card transition-colors ${
              track.isMuted ? 'text-editor-rose bg-editor-rose/10' : 'hover:text-slate-200'
            }`}
          >
            {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </button>

          {/* Hide */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleHideTrack(track.id);
            }}
            title={track.isHidden ? 'Show Track' : 'Hide Track'}
            className={`p-1 rounded hover:bg-editor-card transition-colors ${
              track.isHidden ? 'text-editor-amber bg-editor-amber/10' : 'hover:text-slate-200'
            }`}
          >
            {track.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>

          {/* Lock */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLockTrack(track.id);
            }}
            title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
            className={`p-1 rounded hover:bg-editor-card transition-colors ${
              track.isLocked ? 'text-editor-cyan bg-editor-cyan/10' : 'hover:text-slate-200'
            }`}
          >
            {track.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>

        {/* Volume Slider if audio/video */}
        {(track.type === 'audio' || track.type === 'video') && (
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={track.volume ?? 1.0}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setTrackVolume(track.id, Number(e.target.value))}
            className="w-12 h-1 bg-editor-darker rounded cursor-pointer"
            title={`Track Volume: ${Math.round((track.volume ?? 1) * 100)}%`}
          />
        )}
      </div>
    </div>
  );
};
