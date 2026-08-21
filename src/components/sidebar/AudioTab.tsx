import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { STOCK_AUDIO_TRACKS, StockAudioTrack } from '../../services/stockAssets';
import { audioEngine } from '../../services/audioEngine';
import { Clip } from '../../types/editor';
import { Music, Play, Square, Plus, Volume2, Sparkles, Sliders } from 'lucide-react';

export const AudioTab: React.FC = () => {
  const { project, addClip, currentTime, selectedClipId, updateClip } = useEditorStore();
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);

  // Selected clip if audio
  let selectedClip: Clip | null = null;
  project.tracks.forEach((t) => {
    const c = t.clips.find((clip) => clip.id === selectedClipId && (clip.type === 'audio' || t.type === 'audio'));
    if (c) selectedClip = c;
  });

  const bgmTracks = STOCK_AUDIO_TRACKS.filter((t) => t.type === 'synth_bgm');
  const sfxTracks = STOCK_AUDIO_TRACKS.filter((t) => t.type === 'synth_sfx');

  const handlePreview = async (track: StockAudioTrack) => {
    if (playingPreviewId === track.id) {
      audioEngine.stopAll();
      setPlayingPreviewId(null);
      return;
    }

    audioEngine.stopAll();
    setPlayingPreviewId(track.id);

    try {
      const buffer = await audioEngine.getStockAudioBuffer(track.id, track.subType, track.duration);
      const ctx = audioEngine.getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => {
        setPlayingPreviewId((current) => (current === track.id ? null : current));
      };
    } catch (e) {
      console.warn('Audio preview error', e);
      setPlayingPreviewId(null);
    }
  };

  const handleAddTrackToTimeline = (track: StockAudioTrack) => {
    let audioTrack = project.tracks.find((t) => t.type === 'audio');
    if (!audioTrack) audioTrack = project.tracks[0];
    if (!audioTrack) return;

    addClip(audioTrack.id, {
      name: track.name,
      type: 'audio',
      assetId: track.id,
      startTime: currentTime,
      duration: track.duration,
      sourceDuration: track.duration,
      volume: track.type === 'synth_bgm' ? 0.75 : 1.0,
      fadeIn: track.type === 'synth_bgm' ? 1.0 : 0,
      fadeOut: track.type === 'synth_bgm' ? 1.5 : 0,
      colorTag: track.type === 'synth_bgm' ? '#10b981' : '#f59e0b',
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      {/* Audio Clip Envelope Controls if selected */}
      {selectedClip && (() => {
        const activeClip = selectedClip as Clip;
        return (
          <div className="rounded-xl bg-editor-card border border-editor-accent/40 p-3 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="truncate max-w-[180px]">{activeClip.name}</span>
              <span className="text-[10px] text-editor-cyan font-mono">SELECTED CLIP</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400">Fade In</span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.2"
                  value={activeClip.fadeIn || 0}
                  onChange={(e) => updateClip(activeClip.id, { fadeIn: Number(e.target.value) })}
                  className="w-full h-1 bg-editor-darker rounded"
                />
                <span className="text-[10px] font-mono text-slate-500">{(activeClip.fadeIn || 0).toFixed(1)}s</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Fade Out</span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.2"
                  value={activeClip.fadeOut || 0}
                  onChange={(e) => updateClip(activeClip.id, { fadeOut: Number(e.target.value) })}
                  className="w-full h-1 bg-editor-darker rounded"
                />
                <span className="text-[10px] font-mono text-slate-500">{(activeClip.fadeOut || 0).toFixed(1)}s</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stock Music Library */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Background Music */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-editor-cyan" />
            <span>Royalty-Free Music ({bgmTracks.length})</span>
          </div>

          <div className="space-y-2">
            {bgmTracks.map((track) => {
              const isPlaying = playingPreviewId === track.id;
              return (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-editor-border bg-editor-card/60 hover:bg-editor-card transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      onClick={() => handlePreview(track)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-editor-accent text-white shadow-lg shadow-indigo-500/40 animate-pulse'
                          : 'bg-editor-panel text-slate-300 hover:text-white hover:bg-editor-hover'
                      }`}
                    >
                      {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>

                    <div className="overflow-hidden">
                      <h5 className="text-xs font-bold text-slate-200 truncate">{track.name}</h5>
                      <span className="text-[10px] text-slate-400">
                        {track.genre} • {track.bpm} BPM • {track.duration}s
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddTrackToTimeline(track)}
                    title="Add to Timeline"
                    className="p-1.5 rounded-lg bg-editor-panel hover:bg-editor-accent hover:text-white text-slate-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sound Effects */}
        <div className="space-y-2 pt-2 border-t border-editor-border/60">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-editor-amber" />
            <span>Sound Effects & Transitions ({sfxTracks.length})</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {sfxTracks.map((track) => {
              const isPlaying = playingPreviewId === track.id;
              return (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-editor-border bg-editor-card/60 hover:bg-editor-card transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <button
                      onClick={() => handlePreview(track)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isPlaying ? 'bg-editor-amber text-black' : 'bg-editor-panel text-slate-300'
                      }`}
                    >
                      {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                    <span className="text-xs font-semibold text-slate-200 truncate">{track.name}</span>
                  </div>

                  <button
                    onClick={() => handleAddTrackToTimeline(track)}
                    className="p-1 rounded hover:bg-editor-hover text-slate-400 hover:text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
