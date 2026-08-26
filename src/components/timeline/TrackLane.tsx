import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { Track, MediaAsset } from '../../types/editor';
import { ClipItem } from './ClipItem';

interface TrackLaneProps {
  track: Track;
  totalWidth: number;
}

export const TrackLane: React.FC<TrackLaneProps> = ({ track, totalWidth }) => {
  const { zoom, addClip, selectClip, selectTrack, selectedTrackId } = useEditorStore(useShallow(state => ({
    zoom: state.zoom,
    addClip: state.addClip,
    selectClip: state.selectClip,
    selectTrack: state.selectTrack,
    selectedTrackId: state.selectedTrackId
  })));
  const [isDragOver, setIsDragOver] = useState(false);

  const isSelected = selectedTrackId === track.id;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;

      const asset: MediaAsset = JSON.parse(raw);
      const laneEl = e.currentTarget as HTMLElement;
      const rect = laneEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const startTime = Math.max(0, clickX / zoom);

      addClip(track.id, {
        name: asset.name,
        type: asset.type,
        assetId: asset.id,
        src: asset.url,
        startTime,
        duration: asset.type === 'image' ? 5.0 : (asset.duration || 5.0),
        sourceDuration: asset.duration || 5.0,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <div
      style={{ width: `${totalWidth}px` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        selectTrack(track.id);
        selectClip(null);
      }}
      className={`h-16 relative border-b border-editor-border/80 timeline-grid transition-colors ${
        track.isHidden ? 'opacity-30 pointer-events-none' : ''
      } ${isDragOver ? 'bg-editor-cyan/10 border-editor-cyan' : isSelected ? 'bg-editor-active/40' : 'bg-editor-bg'}`}
    >
      {/* Clips */}
      {track.clips.map((clip) => (
        <ClipItem key={clip.id} clip={clip} trackType={track.type} />
      ))}
    </div>
  );
};
