import { ExportProgress, ExportSettings, Project, Track } from '../types/editor';
import { compositor, VideoCompositor } from './compositor';
import { audioEngine } from './audioEngine';

export class VideoExportEngine {
  private isCancelled: boolean = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportProject(
    project: Project,
    settings: ExportSettings,
    onProgress: (progress: ExportProgress) => void
  ): Promise<Blob> {
    this.isCancelled = false;
    const startTime = performance.now();

    // 1. Calculate resolution dimensions
    let baseDim = VideoCompositor.getDimensionsForAspectRatio(project.aspectRatio);
    let scaleFactor = 1.0;
    if (settings.resolution === '720p') {
      scaleFactor = 720 / Math.min(baseDim.width, baseDim.height);
    } else if (settings.resolution === '1080p') {
      scaleFactor = 1080 / Math.min(baseDim.width, baseDim.height);
    } else if (settings.resolution === '4k') {
      scaleFactor = 2160 / Math.min(baseDim.width, baseDim.height);
    }

    const renderWidth = Math.round(baseDim.width * scaleFactor);
    const renderHeight = Math.round(baseDim.height * scaleFactor);

    // 2. Create offscreen export canvas
    const canvas = document.createElement('canvas');
    canvas.width = renderWidth;
    canvas.height = renderHeight;

    const fps = settings.fps || 30;
    const totalDuration = Math.max(1, project.duration);
    const totalFrames = Math.ceil(totalDuration * fps);

    onProgress({
      status: 'preparing',
      percentage: 0,
      currentFrame: 0,
      totalFrames,
      elapsedTime: 0,
      estimatedTimeLeft: 0,
    });

    // 3. Setup Audio Destination stream
    const audioCtx = audioEngine.getAudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    audioEngine.setMasterVolume(1.0);
    audioEngine.setMute(false);

    // 4. Setup Canvas Stream & MediaRecorder
    const canvasStream = (canvas as any).captureStream(fps);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    const videoBitsPerSecond =
      settings.quality === 'high' ? 8000000 : settings.quality === 'medium' ? 5000000 : 2500000;

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond,
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.start(100);

    // 5. Frame by frame rendering loop
    const frameInterval = 1 / fps;
    const renderStartTime = performance.now();

    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.isCancelled) {
        recorder.stop();
        throw new Error('Export cancelled by user.');
      }

      const currentTime = frame * frameInterval;

      // Sync audio
      audioEngine.syncPlayback(project.tracks, currentTime, true);

      // Render frame
      compositor.renderFrame(canvas, project.tracks, currentTime, project.aspectRatio);

      const elapsedSec = (performance.now() - renderStartTime) / 1000;
      const progressRatio = (frame + 1) / totalFrames;
      const estimatedTotalSec = elapsedSec / progressRatio;
      const estimatedLeftSec = Math.max(0, estimatedTotalSec - elapsedSec);

      onProgress({
        status: 'rendering',
        percentage: Math.round(progressRatio * 100),
        currentFrame: frame + 1,
        totalFrames,
        elapsedTime: Math.round(elapsedSec),
        estimatedTimeLeft: Math.round(estimatedLeftSec),
      });

      // Allow event loop / canvas buffer paint
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    // Stop audio
    audioEngine.stopAll();

    onProgress({
      status: 'encoding',
      percentage: 99,
      currentFrame: totalFrames,
      totalFrames,
      elapsedTime: Math.round((performance.now() - renderStartTime) / 1000),
      estimatedTimeLeft: 1,
    });

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(finalBlob);

        onProgress({
          status: 'completed',
          percentage: 100,
          currentFrame: totalFrames,
          totalFrames,
          elapsedTime: Math.round((performance.now() - renderStartTime) / 1000),
          estimatedTimeLeft: 0,
          outputBlob: finalBlob,
          outputUrl: url,
        });

        resolve(finalBlob);
      };

      setTimeout(() => {
        recorder.stop();
      }, 300);
    });
  }
}

export const exportEngine = new VideoExportEngine();
