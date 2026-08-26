import { AspectRatio, Clip, FilterSettings, TextOverlay, Track, Transition } from '../types/editor';

export interface CanvasDimensions {
  width: number;
  height: number;
}

export class VideoCompositor {
  private videoPool: Map<string, HTMLVideoElement> = new Map();
  private imagePool: Map<string, HTMLImageElement> = new Map();
  private lastRenderTime: number = -1;
  private hiddenContainer: HTMLDivElement | null = null;
  /** Track which videos have been loaded to avoid calling load() every frame */
  private videoLoadRequested: Set<string> = new Set();
  /** Track videos that timed out loading */
  private videoTimedOut: Set<string> = new Set();
  
  /** Indicates if any video clip in the current frame is still loading */
  public isRenderingLoading: boolean = false;

  constructor() {
    // Create a hidden container for media elements to prevent browsers
    // from suspending loading for unattached elements.
    if (typeof document !== 'undefined') {
      this.hiddenContainer = document.createElement('div');
      this.hiddenContainer.style.position = 'absolute';
      this.hiddenContainer.style.left = '-9999px';
      this.hiddenContainer.style.top = '-9999px';
      this.hiddenContainer.style.width = '1px';
      this.hiddenContainer.style.height = '1px';
      this.hiddenContainer.style.opacity = '0';
      this.hiddenContainer.style.pointerEvents = 'none';
      this.hiddenContainer.id = 'vidsync-media-pool';
      document.body.appendChild(this.hiddenContainer);
    }
  }

  public static getDimensionsForAspectRatio(aspectRatio: AspectRatio, maxDimension: number = 1920): CanvasDimensions {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1920, height: 1080 };
      case '9:16':
        return { width: 1080, height: 1920 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '4:5':
        return { width: 1080, height: 1350 };
      case '21:9':
        return { width: 2560, height: 1080 };
      default:
        return { width: 1920, height: 1080 };
    }
  }

  // Pre-load or retrieve video element for a clip
  public getVideoElement(clipId: string, src: string): HTMLVideoElement {
    if (this.videoPool.has(clipId)) {
      const el = this.videoPool.get(clipId)!;
      if (el.getAttribute('src') !== src) {
        el.src = src;
        this.videoLoadRequested.delete(clipId);
        this.videoTimedOut.delete(clipId);
        el.load();
        this.videoLoadRequested.add(clipId);
        this.startLoadTimeout(clipId);
      }
      return el;
    }

    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    // Explicitly call load to force the browser to begin fetching metadata
    video.load();
    this.videoLoadRequested.add(clipId);

    // Debugging listeners in case the browser blocks the load
    video.onerror = () => console.error(`[VideoCompositor] Error loading video ${src}:`, video.error);
    video.onstalled = () => console.warn(`[VideoCompositor] Video stalled ${src}`);
    
    // Attach to DOM to ensure the browser doesn't throttle or suspend the download
    if (this.hiddenContainer) {
      this.hiddenContainer.appendChild(video);
    }

    this.videoPool.set(clipId, video);

    // Start a load timeout
    this.startLoadTimeout(clipId);

    return video;
  }

  /** Start a timeout — if video isn't ready in 15 seconds, mark it timed out */
  private startLoadTimeout(clipId: string) {
    const video = this.videoPool.get(clipId);
    if (!video) return;

    // Listen for canplay to clear the timeout flag
    const onCanPlay = () => {
      this.videoTimedOut.delete(clipId);
      video.removeEventListener('canplay', onCanPlay);
    };
    video.addEventListener('canplay', onCanPlay);

    // Set a generous timeout — remote videos on mobile can be slow
    setTimeout(() => {
      if (video.readyState < 2 && !video.error) {
        console.warn(`[VideoCompositor] Video load timeout for clip ${clipId}`);
        this.videoTimedOut.add(clipId);
      }
    }, 15000);
  }

  // Pre-load or retrieve image element
  public getImageElement(src: string): HTMLImageElement {
    if (this.imagePool.has(src)) {
      return this.imagePool.get(src)!;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => console.error(`[VideoCompositor] Error loading image: ${src}`);
    img.src = src;
    this.imagePool.set(src, img);
    return img;
  }

  // Composite full frame at currentTime onto target canvas
  public renderFrame(
    canvas: HTMLCanvasElement,
    tracks: Track[],
    currentTime: number,
    aspectRatio: AspectRatio,
    selectedClipId?: string | null,
    isPlaying: boolean = false
  ): void {
    this.isRenderingLoading = false;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { width, height } = canvas;

    // 1. Clear with deep editor canvas background
    ctx.save();
    ctx.fillStyle = '#06070a';
    ctx.fillRect(0, 0, width, height);

    // 2. Render tracks in order: Bottom to Top (Video 1 -> Video 2 -> Overlays -> Text 1 -> Text 2)
    // Audio tracks don't render on visual canvas
    const visualTracks = tracks.filter((t) => t.type !== 'audio' && !t.isHidden);
    
    // Keep track of which videos are actively being rendered this frame
    const activeClipIds = new Set<string>();

    for (const track of visualTracks) {
      for (const clip of track.clips) {
        const clipEnd = clip.startTime + clip.duration;
        if (currentTime >= clip.startTime && currentTime < clipEnd) {
          const clipTime = (currentTime - clip.startTime);
          const sourceTime = clipTime * (clip.speed || 1.0) + (clip.trimIn || 0);

          ctx.save();

          // Apply track volume & opacity
          ctx.globalAlpha = (clip.transform?.opacity ?? 1.0);

          // Apply transitions (In & Out)
          this.applyTransition(ctx, clip, clipTime, width, height);

          // Render specific clip type
          if (clip.type === 'video') {
            activeClipIds.add(clip.id);
            this.renderVideoClip(ctx, clip, sourceTime, width, height, isPlaying);
          } else if (clip.type === 'image') {
            this.renderImageClip(ctx, clip, width, height);
          } else if (clip.type === 'sticker' || clip.type === 'shape') {
            this.renderStickerClip(ctx, clip, width, height);
          } else if (clip.type === 'text' && clip.text) {
            this.renderTextClip(ctx, clip, clipTime, width, height);
          }

          // Apply color filters & vignette
          this.applyFiltersAndLUT(ctx, clip.filters, width, height);

          ctx.restore();
        }
      }
    }

    ctx.restore();
    this.lastRenderTime = currentTime;

    // Pause any videos that are not actively visible in this frame
    this.videoPool.forEach((video, id) => {
      if (!activeClipIds.has(id)) {
        if (!video.paused) {
          video.pause();
        }
      }
    });
  }

  private applyTransition(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    clipTime: number,
    width: number,
    height: number
  ): void {
    const duration = clip.duration;

    // Transition IN
    if (clip.transitionIn && clip.transitionIn.type !== 'none' && clipTime < clip.transitionIn.duration) {
      const progress = Math.max(0, Math.min(1, clipTime / clip.transitionIn.duration));
      this.handleTransitionType(ctx, clip.transitionIn.type, progress, true, width, height);
    }

    // Transition OUT
    if (clip.transitionOut && clip.transitionOut.type !== 'none' && clipTime > (duration - clip.transitionOut.duration)) {
      const progress = Math.max(0, Math.min(1, (duration - clipTime) / clip.transitionOut.duration));
      this.handleTransitionType(ctx, clip.transitionOut.type, progress, false, width, height);
    }
  }

  private handleTransitionType(
    ctx: CanvasRenderingContext2D,
    type: string,
    progress: number,
    isIn: boolean,
    width: number,
    height: number
  ): void {
    switch (type) {
      case 'fade':
      case 'crossfade':
        ctx.globalAlpha *= progress;
        break;
      case 'wipe-left': {
        const wipeWidth = width * progress;
        ctx.beginPath();
        ctx.rect(0, 0, wipeWidth, height);
        ctx.clip();
        break;
      }
      case 'wipe-right': {
        const wipeWidth = width * progress;
        ctx.beginPath();
        ctx.rect(width - wipeWidth, 0, wipeWidth, height);
        ctx.clip();
        break;
      }
      case 'wipe-up': {
        const wipeHeight = height * progress;
        ctx.beginPath();
        ctx.rect(0, height - wipeHeight, width, wipeHeight);
        ctx.clip();
        break;
      }
      case 'zoom-in': {
        const scale = 0.5 + 0.5 * progress;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        ctx.globalAlpha *= progress;
        break;
      }
      case 'slide-left': {
        const xOffset = width * (1 - progress);
        ctx.translate(isIn ? xOffset : -xOffset, 0);
        break;
      }
      case 'slide-right': {
        const xOffset = width * (1 - progress);
        ctx.translate(isIn ? -xOffset : xOffset, 0);
        break;
      }
    }
  }

  private renderVideoClip(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    sourceTime: number,
    width: number,
    height: number,
    isPlaying: boolean
  ): void {
    if (!clip.src) return;
    const video = this.getVideoElement(clip.id, clip.src);

    if (isPlaying) {
      if (video.paused && video.readyState >= 2) {
        // Suppress play interruption errors
        video.play().catch(() => {});
      }
      video.playbackRate = clip.speed || 1.0;
    } else {
      if (!video.paused) {
        video.pause();
      }
    }

    // Smarter sync logic to prevent infinite seek loops (keyframe snapping)
    const lastRequestedSeek = (video as any)._lastRequestedSeek ?? -1;
    const targetDiff = Math.abs(lastRequestedSeek - sourceTime);
    const actualDiff = Math.abs(video.currentTime - sourceTime);

    let shouldSeek = false;
    if (isPlaying) {
      // While playing, only force a seek if the video is drastically out of sync (1.5 seconds)
      // This prevents the browser from getting stuck in an endless loop of aborting decodes.
      if (actualDiff > 1.5 && targetDiff > 1.5) {
        shouldSeek = true;
      }
    } else {
      // While paused, only seek if the newly requested time is different from the last request.
      // This prevents the browser from infinitely snapping back to a keyframe and causing a seek loop.
      if (targetDiff > 0.1) {
        shouldSeek = true;
      }
    }

    if (shouldSeek && !video.seeking) {
      try {
        const target = Math.min(video.duration || 9999, Math.max(0, sourceTime));
        video.currentTime = target;
        (video as any)._lastRequestedSeek = sourceTime;
      } catch {
        // Safe seek error catch
      }
    }

    const transform = clip.transform || { x: 0, y: 0, scale: 1, rotation: 0 };
    const centerX = width / 2 + (transform.x / 100) * width;
    const centerY = height / 2 + (transform.y / 100) * height;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (transform.rotation) ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale || 1, transform.scale || 1);

    if (video.readyState >= 2) {
      // Calculate aspect-fit drawing
      const vWidth = video.videoWidth || width;
      const vHeight = video.videoHeight || height;
      const hRatio = width / vWidth;
      const vRatio = height / vHeight;
      const ratio = Math.max(hRatio, vRatio); // Cover fit

      const renderW = vWidth * ratio;
      const renderH = vHeight * ratio;

      ctx.drawImage(video, -renderW / 2, -renderH / 2, renderW, renderH);
    } else if (video.error || this.videoTimedOut.has(clip.id)) {
      // Draw error / timeout placeholder
      ctx.fillStyle = '#161922';
      ctx.fillRect(-640, -360, 1280, 720);
      ctx.fillStyle = '#ef4444'; // Red error text
      ctx.font = '24px Inter, sans-serif';
      ctx.textAlign = 'center';
      if (this.videoTimedOut.has(clip.id)) {
        ctx.fillText(`Video load timeout: ${clip.name}`, 0, -10);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px Inter, sans-serif';
        ctx.fillText('Video may be too large for mobile', 0, 20);
      } else {
        ctx.fillText(`Error: ${clip.name}`, 0, 0);
      }
    } else {
      this.isRenderingLoading = true;
      // Placeholder if loading
      ctx.fillStyle = '#161922';
      ctx.fillRect(-640, -360, 1280, 720);
      ctx.fillStyle = '#6366f1';
      ctx.font = '24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Loading video: ${clip.name}...`, 0, -10);

      // Show a subtle loading spinner
      const spinAngle = (performance.now() / 600) % (Math.PI * 2);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 30, 15, spinAngle, spinAngle + Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderImageClip(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    width: number,
    height: number
  ): void {
    if (!clip.src) return;
    const img = this.getImageElement(clip.src);
    const transform = clip.transform || { x: 0, y: 0, scale: 1, rotation: 0 };
    const centerX = width / 2 + (transform.x / 100) * width;
    const centerY = height / 2 + (transform.y / 100) * height;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (transform.rotation) ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale || 1, transform.scale || 1);

    if (img.complete && img.naturalWidth > 0) {
      const iWidth = img.naturalWidth;
      const iHeight = img.naturalHeight;
      const ratio = Math.max(width / iWidth, height / iHeight);
      const renderW = iWidth * ratio;
      const renderH = iHeight * ratio;

      ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    } else {
      ctx.fillStyle = '#161922';
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.fillStyle = '#6366f1';
      ctx.font = '24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Loading image: ${clip.name}...`, 0, 0);
    }
    ctx.restore();
  }

  private renderStickerClip(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    width: number,
    height: number
  ): void {
    const transform = clip.transform || { x: 0, y: 0, scale: 1, rotation: 0 };
    const centerX = width / 2 + (transform.x / 100) * width;
    const centerY = height / 2 + (transform.y / 100) * height;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (transform.rotation) ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale || 1, transform.scale || 1);

    if (clip.src && clip.src.startsWith('data:image/svg')) {
      const img = this.getImageElement(clip.src);
      if (img.complete) {
        ctx.drawImage(img, -100, -50, 200, 100);
      }
    }
    ctx.restore();
  }

  private renderTextClip(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    clipTime: number,
    width: number,
    height: number
  ): void {
    const textData = clip.text;
    if (!textData || !textData.text) return;

    const transform = clip.transform || { x: 0, y: 0, scale: 1, rotation: 0 };
    const centerX = width / 2 + (transform.x / 100) * width;
    const centerY = height / 2 + (transform.y / 100) * height;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (transform.rotation) ctx.rotate((transform.rotation * Math.PI) / 180);

    // Apply text animation
    let displayText = textData.text;
    let animScale = 1.0;
    let animAlpha = 1.0;
    let animYOffset = 0;
    let neonShadowBlur: number | null = null;

    switch (textData.animation) {
      case 'fade-in': {
        const t = Math.min(1, clipTime / 0.6);
        animAlpha = t;
        break;
      }
      case 'typewriter': {
        const charProgress = Math.min(1, clipTime / Math.max(0.5, clip.duration * 0.7));
        const numChars = Math.floor(charProgress * textData.text.length);
        displayText = textData.text.substring(0, numChars);
        if (charProgress < 1 && Math.floor(clipTime * 4) % 2 === 0) {
          displayText += '▌';
        }
        break;
      }
      case 'pop-in':
      case 'bounce': {
        const t = Math.min(1, clipTime / 0.5);
        // Elastic / overshoot curve
        animScale = t < 1 ? Math.sin(t * Math.PI * 0.75) * 1.2 : 1.0;
        break;
      }
      case 'slide-up': {
        const t = Math.min(1, clipTime / 0.5);
        animYOffset = (1 - t) * 60;
        animAlpha = t;
        break;
      }
      case 'neon-pulse': {
        // Use a local variable — don't mutate the shared state object
        const pulse = (Math.sin(clipTime * 6) + 1) / 2;
        neonShadowBlur = 15 + pulse * 20;
        break;
      }
      case 'karaoke-highlight': {
        // Dynamic karaoke style bounce
        const beat = (Math.sin(clipTime * 8) + 1) / 2;
        animScale = 1.0 + beat * 0.08;
        break;
      }
    }

    ctx.scale((transform.scale || 1) * animScale, (transform.scale || 1) * animScale);
    ctx.globalAlpha *= animAlpha;
    ctx.translate(0, animYOffset);

    ctx.font = `${textData.fontStyle || 'normal'} ${textData.fontWeight || '700'} ${textData.fontSize || 40}px "${textData.fontFamily || 'Inter'}", sans-serif`;
    ctx.textAlign = textData.textAlign || 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(displayText);
    const textWidth = metrics.width;
    const textHeight = (textData.fontSize || 40) * 1.2;

    // Draw background box if specified
    if (textData.backgroundColor) {
      ctx.save();
      ctx.fillStyle = textData.backgroundColor;
      const pad = textData.backgroundPadding || 12;
      const rad = textData.backgroundRadius || 6;
      const bgX = -textWidth / 2 - pad;
      const bgY = -textHeight / 2 - pad / 2;
      const bgW = textWidth + pad * 2;
      const bgH = textHeight + pad;

      ctx.beginPath();
      (ctx as any).roundRect ? (ctx as any).roundRect(bgX, bgY, bgW, bgH, rad) : ctx.rect(bgX, bgY, bgW, bgH);
      ctx.fill();
      ctx.restore();
    }

    // Shadow
    if (textData.shadowColor) {
      ctx.shadowColor = textData.shadowColor;
      ctx.shadowBlur = neonShadowBlur !== null ? neonShadowBlur : (textData.shadowBlur || 10);
      ctx.shadowOffsetX = textData.shadowOffsetX || 0;
      ctx.shadowOffsetY = textData.shadowOffsetY || 0;
    }

    // Stroke / Outline
    if (textData.strokeColor && textData.strokeWidth && textData.strokeWidth > 0) {
      ctx.strokeStyle = textData.strokeColor;
      ctx.lineWidth = textData.strokeWidth;
      ctx.strokeText(displayText, 0, 0);
    }

    // Fill
    ctx.fillStyle = textData.color || '#ffffff';
    ctx.fillText(displayText, 0, 0);

    ctx.restore();
  }

  private applyFiltersAndLUT(
    ctx: CanvasRenderingContext2D,
    filters: FilterSettings | undefined,
    width: number,
    height: number
  ): void {
    if (!filters) return;

    // Preset color tints
    if (filters.preset === 'cyberpunk') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)'; // Cyan
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.1)'; // Magenta
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else if (filters.preset === 'vintage') {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(217, 119, 6, 0.2)'; // Warm Sepia
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else if (filters.preset === 'cinematic') {
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = 'rgba(13, 148, 136, 0.15)'; // Teal shadows
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else if (filters.preset === 'noir') {
      // High contrast B&W overlay
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // Vignette
    if (filters.vignette && filters.vignette > 0) {
      ctx.save();
      const radius = Math.max(width, height) / 1.5;
      const grad = ctx.createRadialGradient(width / 2, height / 2, radius * 0.3, width / 2, height / 2, radius);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${(filters.vignette / 100) * 0.85})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  public cleanup() {
    this.videoPool.forEach((v) => {
      v.pause();
      v.src = '';
      v.remove();
    });
    this.videoPool.clear();
    this.imagePool.clear();
    this.videoLoadRequested.clear();
    this.videoTimedOut.clear();
    if (this.hiddenContainer) {
      this.hiddenContainer.remove();
      this.hiddenContainer = null;
    }
  }
}

export const compositor = new VideoCompositor();
