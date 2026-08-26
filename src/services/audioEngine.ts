import { Clip, Track } from '../types/editor';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackGains: Map<string, GainNode> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private analyser: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 1.0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioContext(): AudioContext {
    this.initContext();
    return this.ctx!;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(2, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public getAudioLevels(): { left: number; right: number } {
    if (!this.analyser) return { left: 0, right: 0 };
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sumLeft = 0;
    let sumRight = 0;
    const half = Math.floor(dataArray.length / 2);

    for (let i = 0; i < half; i++) sumLeft += dataArray[i];
    for (let i = half; i < dataArray.length; i++) sumRight += dataArray[i];

    const left = Math.min(100, Math.round((sumLeft / (half * 255)) * 140));
    const right = Math.min(100, Math.round((sumRight / (half * 255)) * 140));

    return { left, right };
  }

  // Generate synthetic high-quality audio buffer for stock sound tracks
  public async getStockAudioBuffer(trackId: string, subType: string, duration: number): Promise<AudioBuffer> {
    const cacheKey = `stock_${trackId}_${subType}_${duration}`;
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    this.initContext();
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const totalSamples = Math.floor(sampleRate * duration);
    const audioBuffer = ctx.createBuffer(2, totalSamples, sampleRate);
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.getChannelData(1);

    if (subType === 'upbeat') {
      // Upbeat synth chords + kick/snare groove
      const bpm = 124;
      const beatLen = 60 / bpm;
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const beatTime = t % beatLen;
        const barTime = t % (beatLen * 4);
        
        // Chords (C, G, Am, F)
        const chordIdx = Math.floor(t / (beatLen * 2)) % 4;
        const freqs = [
          [261.63, 329.63, 392.0], // C
          [196.0, 246.94, 293.66], // G
          [220.0, 261.63, 329.63], // Am
          [174.61, 220.0, 261.63], // F
        ][chordIdx];

        let synth = 0;
        freqs.forEach((f) => {
          synth += Math.sin(2 * Math.PI * f * t) * 0.15;
          synth += Math.sin(2 * Math.PI * (f * 2) * t) * 0.05;
        });

        // Kick drum on 1 and 3
        const kickTime = t % (beatLen);
        const kick = Math.sin(2 * Math.PI * Math.max(40, 150 - kickTime * 300) * kickTime) * Math.exp(-kickTime * 15);

        // Hi-hat
        const hihat = (Math.random() * 2 - 1) * Math.exp(-(t % (beatLen / 2)) * 30) * 0.08;

        const val = (synth + kick * 0.4 + hihat) * 0.6;
        leftChannel[i] = val;
        rightChannel[i] = val * 0.95 + synth * 0.05;
      }
    } else if (subType === 'lofi') {
      // Lo-fi jazz chords with vinyl crackle and tape warble
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const warble = Math.sin(2 * Math.PI * 0.5 * t) * 0.005;
        const freqs = [220.0, 277.18, 329.63, 415.3]; // A major 7
        let chord = 0;
        freqs.forEach((f) => {
          chord += Math.sin(2 * Math.PI * (f * (1 + warble)) * t) * 0.18;
        });
        const crackle = Math.random() < 0.002 ? (Math.random() * 2 - 1) * 0.1 : 0;
        const val = (chord + crackle) * 0.6;
        leftChannel[i] = val;
        rightChannel[i] = val;
      }
    } else if (subType === 'cinematic') {
      // Epic deep brass & swelling strings
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const swell = Math.min(1, t / 4) * (1 - Math.max(0, (t - duration + 3) / 3));
        const root = 65.41; // C2
        let val = (
          Math.sin(2 * Math.PI * root * t) * 0.3 +
          Math.sin(2 * Math.PI * (root * 1.5) * t) * 0.2 +
          Math.sin(2 * Math.PI * (root * 2.0) * t) * 0.15 +
          Math.sin(2 * Math.PI * (root * 4.0) * t) * 0.1
        ) * swell;
        leftChannel[i] = val;
        rightChannel[i] = val;
      }
    } else if (subType === 'techno') {
      // Techno rolling bassline & kick
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const bassNote = [55, 55, 65.41, 73.42][Math.floor(t * 4) % 4];
        const saw = ((t * bassNote) % 1) * 2 - 1;
        const kickTime = t % 0.46;
        const kick = Math.sin(2 * Math.PI * Math.max(45, 160 - kickTime * 400) * kickTime) * Math.exp(-kickTime * 12);
        const val = (saw * 0.2 + kick * 0.5) * 0.7;
        leftChannel[i] = val;
        rightChannel[i] = val;
      }
    } else if (subType === 'swoosh' || subType === 'transition') {
      // Whoosh sound effect
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const progress = t / duration;
        const env = Math.sin(Math.PI * progress);
        const noise = (Math.random() * 2 - 1) * env * 0.5;
        const sweepFreq = 200 + Math.pow(progress, 2) * 1200;
        const sweep = Math.sin(2 * Math.PI * sweepFreq * t) * env * 0.4;
        leftChannel[i] = (noise + sweep) * 0.7;
        rightChannel[i] = (noise + sweep) * 0.7;
      }
    } else if (subType === 'ding') {
      // Bell Ding sound
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 4);
        const val = (
          Math.sin(2 * Math.PI * 1046.5 * t) * 0.5 + // C6
          Math.sin(2 * Math.PI * 2093.0 * t) * 0.3 + // C7
          Math.sin(2 * Math.PI * 3135.96 * t) * 0.2   // G7
        ) * env * 0.6;
        leftChannel[i] = val;
        rightChannel[i] = val;
      }
    } else if (subType === 'pop') {
      // Bubble Pop
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 20);
        const freq = 300 + (1 - t / duration) * 600;
        const val = Math.sin(2 * Math.PI * freq * t) * env * 0.8;
        leftChannel[i] = val;
        rightChannel[i] = val;
      }
    } else {
      // Default ambient tone
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const val = Math.sin(2 * Math.PI * 440 * t) * 0.2;
        leftChannel[i] = val;
        rightChannel[i] = val;
      }
    }

    this.bufferCache.set(cacheKey, audioBuffer);
    return audioBuffer;
  }

  // Load and decode external audio URL / Blob
  public async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }
    this.initContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const decoded = await this.ctx!.decodeAudioData(arrayBuffer);
    this.bufferCache.set(url, decoded);
    return decoded;
  }

  // Extract waveform peaks array (100 bars)
  public extractWaveform(audioBuffer: AudioBuffer, numPeaks: number = 80): number[] {
    const rawData = audioBuffer.getChannelData(0);
    const step = Math.floor(rawData.length / numPeaks);
    const peaks: number[] = [];

    for (let i = 0; i < numPeaks; i++) {
      let max = 0;
      const start = i * step;
      const end = Math.min(start + step, rawData.length);
      for (let j = start; j < end; j += 10) {
        const abs = Math.abs(rawData[j]);
        if (abs > max) max = abs;
      }
      peaks.push(Math.min(1.0, max * 1.5));
    }
    return peaks;
  }

  // Sync and play active audio tracks at current playhead time
  public syncPlayback(tracks: Track[], currentTime: number, isPlaying: boolean) {
    this.initContext();
    const ctx = this.ctx!;

    // Stop previous sources
    this.stopAll();

    if (!isPlaying) return;

    tracks.forEach((track) => {
      if (track.isMuted || track.type === 'video' && track.isMuted) return;

      track.clips.forEach(async (clip) => {
        // Check if clip is active at currentTime
        const clipEnd = clip.startTime + clip.duration;
        if (currentTime >= clip.startTime && currentTime < clipEnd) {
          const offsetInClip = (currentTime - clip.startTime) * clip.speed + clip.trimIn;
          const remainingDuration = (clipEnd - currentTime);

          try {
            let buffer: AudioBuffer | null = null;
            if (clip.assetId?.startsWith('audio_') || clip.assetId?.startsWith('sfx_')) {
              const subType = clip.assetId.includes('upbeat') ? 'upbeat' :
                              clip.assetId.includes('lofi') ? 'lofi' :
                              clip.assetId.includes('cinematic') ? 'cinematic' :
                              clip.assetId.includes('techno') ? 'techno' :
                              clip.assetId.includes('swoosh') ? 'swoosh' :
                              clip.assetId.includes('ding') ? 'ding' :
                              clip.assetId.includes('pop') ? 'pop' : 'transition';
              buffer = await this.getStockAudioBuffer(clip.assetId, subType, clip.sourceDuration || 15);
            } else if (clip.src) {
              buffer = await this.loadAudioBuffer(clip.src);
            }

            if (buffer) {
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.playbackRate.value = clip.speed || 1.0;

              const gainNode = ctx.createGain();
              const trackVol = track.volume ?? 1.0;
              const clipVol = clip.volume ?? 1.0;
              gainNode.gain.setValueAtTime(trackVol * clipVol, ctx.currentTime);

              source.connect(gainNode);
              gainNode.connect(this.masterGain!);

              const safeOffset = Math.max(0, Math.min(buffer.duration - 0.05, offsetInClip));
              source.start(0, safeOffset, remainingDuration);
              this.activeSources.set(clip.id, source);
            }
          } catch (err) {
            console.warn('Audio play sync error', err);
          }
        }
      });
    });
  }

  public stopAll() {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // source may have already ended
      }
    });
    this.activeSources.clear();
  }
}

export const audioEngine = new AudioEngine();
