export type MediaType = 'video' | 'audio' | 'image' | 'text' | 'shape' | 'sticker';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type TrackType = 'video' | 'audio' | 'text' | 'overlay';

export type TransitionType = 
  | 'none' 
  | 'fade' 
  | 'crossfade' 
  | 'wipe-left' 
  | 'wipe-right' 
  | 'wipe-up' 
  | 'zoom-in' 
  | 'zoom-out' 
  | 'slide-left' 
  | 'slide-right';

export interface Transition {
  type: TransitionType;
  duration: number; // in seconds
}

export type FilterPreset = 
  | 'none' 
  | 'cinematic' 
  | 'cyberpunk' 
  | 'vintage' 
  | 'noir' 
  | 'vivid' 
  | 'warm-sunset' 
  | 'cool-breeze' 
  | 'emerald'
  | 'pastel';

export interface FilterSettings {
  preset: FilterPreset;
  brightness: number;  // 0 - 200, default 100
  contrast: number;    // 0 - 200, default 100
  saturation: number;  // 0 - 200, default 100
  temperature: number; // -100 - 100, default 0
  tint: number;        // -100 - 100, default 0
  blur: number;        // 0 - 20, default 0
  vignette: number;    // 0 - 100, default 0
  opacity: number;     // 0 - 100, default 100
}

export type TextAnimation = 
  | 'none' 
  | 'fade-in' 
  | 'typewriter' 
  | 'bounce' 
  | 'slide-up' 
  | 'neon-pulse' 
  | 'glow' 
  | 'karaoke-highlight'
  | 'pop-in';

export interface TextOverlay {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  backgroundPadding?: number;
  backgroundRadius?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  letterSpacing?: number;
  animation: TextAnimation;
}

export interface ClipTransform {
  x: number;          // normalized percentage -50% to +50% or center offset
  y: number;          // normalized percentage
  scale: number;      // default 1.0
  scaleX?: number;    // for flipping
  scaleY?: number;
  rotation: number;   // in degrees 0-360
  opacity: number;    // 0-1
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'lighten' | 'color-dodge';
}

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  type: MediaType;
  assetId?: string;
  src?: string;       // blob URL, external URL, or generated data
  startTime: number;  // timeline position in seconds
  duration: number;   // active length on timeline in seconds
  trimIn: number;     // offset into the source asset in seconds
  trimOut: number;    // endpoint in the source asset in seconds
  sourceDuration: number; // total duration of the original asset in seconds
  speed: number;      // 0.25 to 4.0
  volume: number;     // 0 to 2.0 (1.0 = 100%)
  fadeIn: number;     // seconds
  fadeOut: number;    // seconds
  transform: ClipTransform;
  text?: TextOverlay;
  filters: FilterSettings;
  transitionIn?: Transition;
  transitionOut?: Transition;
  waveform?: number[];
  colorTag?: string;
  locked?: boolean;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  isMuted: boolean;
  isLocked: boolean;
  isHidden: boolean;
  volume: number;     // 0 to 1.0
  clips: Clip[];
}

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  blob?: Blob;
  duration: number;   // in seconds
  width?: number;
  height?: number;
  thumbnail?: string;
  size?: number;      // bytes
  createdAt: number;
  isStock?: boolean;
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  fps: number;
  duration: number;   // timeline total duration in seconds
  tracks: Track[];
  assets: MediaAsset[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export type Resolution = '720p' | '1080p' | '4k';

export interface ExportSettings {
  format: 'webm' | 'mp4';
  resolution: Resolution;
  fps: 30 | 60;
  quality: 'high' | 'medium' | 'low';
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error';
  percentage: number;
  currentFrame: number;
  totalFrames: number;
  elapsedTime: number; // seconds
  estimatedTimeLeft: number; // seconds
  error?: string;
  outputBlob?: Blob;
  outputUrl?: string;
}
