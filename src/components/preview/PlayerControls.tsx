import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useShallow } from 'zustand/react/shallow';
import { audioEngine } from '../../services/audioEngine';
import { compositor } from '../../services/compositor';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Maximize, 
  Minimize 
} from 'lucide-react';

interface PlayerControlsProps {
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  onToggleFullscreen,
  isFullscreen,
}) => {
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    project,
    isMuted,
    toggleMute,
    masterVolume,
    setMasterVolume,
    isLooping,
    setIsLooping,
  } = useEditorStore(useShallow(state => ({
    currentTime: state.currentTime,
    setCurrentTime: state.setCurrentTime,
    isPlaying: state.isPlaying,
    togglePlay: state.togglePlay,
    project: state.project,
    isMuted: state.isMuted,
    toggleMute: state.toggleMute,
    masterVolume: state.masterVolume,
    setMasterVolume: state.setMasterVolume,
    isLooping: state.isLooping,
    setIsLooping: state.setIsLooping,
  })));

  const [meterLevels, setMeterLevels] = useState<{ left: number; right: number }>({ left: 0, right: 0 });

  // Update stereo audio meter — throttled to 10fps, only when playing
  useEffect(() => {
    if (!isPlaying) {
      setMeterLevels({ left: 0, right: 0 });
      return;
    }

    const intervalId = setInterval(() => {
      setMeterLevels(audioEngine.getAudioLevels());
    }, 100); // 10fps — plenty for a VU meter visual

    return () => clearInterval(intervalId);
  }, [isPlaying]);

  // Format time to HH:MM:SS:FF
  const formatTimecode = (seconds: number, fps: number = 30) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * fps);

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const handleStepFrame = (frames: number) => {
    const frameDuration = 1 / project.fps;
    setCurrentTime(currentTime + frames * frameDuration);
  };

  const VolumeIcon = isMuted || masterVolume === 0 ? VolumeX : masterVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="h-12 border-t border-editor-border bg-editor-panel/90 backdrop-blur-md px-4 flex items-center justify-between select-none z-20">
      {/* Left: Timecode Display */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 sm:gap-2 bg-editor-darker px-2 sm:px-3 py-1 rounded-lg border border-editor-border font-mono text-[10px] sm:text-xs text-editor-cyan font-bold tracking-wider shadow-inner">
          <span>{formatTimecode(currentTime, project.fps)}</span>
          <span className="text-slate-500">/</span>
          <span className="hidden sm:inline text-slate-400">{formatTimecode(project.duration, project.fps)}</span>
        </div>

        {/* Audio VU Meter (Left/Right bars) */}
        <div className="hidden sm:flex items-center gap-1 bg-editor-darker px-2 py-1.5 rounded-lg border border-editor-border h-7">
          <div className="flex flex-col gap-0.5 justify-center">
            {/* Left Channel */}
            <div className="w-16 h-1.5 bg-slate-800 rounded-sm overflow-hidden">
              <div
                style={{ width: `${isMuted ? 0 : meterLevels.left}%` }}
                className="h-full bg-gradient-to-r from-editor-emerald via-editor-amber to-editor-rose transition-all duration-75"
              />
            </div>
            {/* Right Channel */}
            <div className="w-16 h-1.5 bg-slate-800 rounded-sm overflow-hidden">
              <div
                style={{ width: `${isMuted ? 0 : meterLevels.right}%` }}
                className="h-full bg-gradient-to-r from-editor-emerald via-editor-amber to-editor-rose transition-all duration-75"
              />
            </div>
          </div>
          <span className="text-[9px] font-mono text-slate-500 font-bold ml-1">L R</span>
        </div>
      </div>

      {/* Center: Main Playback Controls */}
      <div className="flex items-center gap-2">
        {/* Jump to start */}
        <button
          onClick={() => setCurrentTime(0)}
          className="hidden sm:block p-1.5 rounded-lg hover:bg-editor-hover text-slate-400 hover:text-slate-200 transition-colors"
          title="Jump to Start (Home)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Step 1 frame back */}
        <button
          onClick={() => handleStepFrame(-1)}
          className="p-1.5 rounded-lg hover:bg-editor-hover text-slate-300 hover:text-white transition-colors"
          title="Previous Frame (Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Big Center Play/Pause Button */}
        <button
          onClick={() => {
            if (!isPlaying) {
              compositor.unlockMobileVideos();
              // Synchronously unlock AudioContext inside user gesture
              audioEngine.getAudioContext().resume().catch(() => {});
            }
            togglePlay();
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-editor-accent text-white shadow-lg shadow-indigo-500/40'
              : 'bg-white hover:bg-slate-200 text-black shadow-md'
          }`}
          title="Play / Pause (Space)"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Step 1 frame forward */}
        <button
          onClick={() => handleStepFrame(1)}
          className="p-1.5 rounded-lg hover:bg-editor-hover text-slate-300 hover:text-white transition-colors"
          title="Next Frame (Right Arrow)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Jump to end */}
        <button
          onClick={() => setCurrentTime(project.duration)}
          className="hidden sm:block p-1.5 rounded-lg hover:bg-editor-hover text-slate-400 hover:text-slate-200 transition-colors"
          title="Jump to End (End)"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Loop toggle */}
        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`hidden sm:block p-1.5 rounded-lg transition-colors ${
            isLooping ? 'bg-editor-accent/20 text-editor-cyan' : 'hover:bg-editor-hover text-slate-400'
          }`}
          title="Toggle Loop Playback"
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Master Volume & Fullscreen */}
      <div className="flex items-center gap-3">
        {/* Volume Slider */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg hover:bg-editor-hover text-slate-400 hover:text-slate-200 transition-colors"
            title="Mute / Unmute (M)"
          >
            <VolumeIcon className="w-4 h-4" />
          </button>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={isMuted ? 0 : masterVolume}
            onChange={(e) => {
              if (isMuted) toggleMute();
              setMasterVolume(Number(e.target.value));
              audioEngine.setMasterVolume(Number(e.target.value));
            }}
            className="hidden sm:block w-16 h-1 bg-editor-darker rounded cursor-pointer"
            title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
          />
        </div>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-editor-hover text-slate-400 hover:text-slate-200 transition-colors"
          title="Toggle Fullscreen Preview (F)"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
