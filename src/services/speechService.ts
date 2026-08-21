import { Clip, Track, TextOverlay } from '../types/editor';

export interface CaptionSegment {
  text: string;
  start: number; // in seconds
  end: number;
  words: { word: string; start: number; end: number }[];
}

export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  gender?: string;
}

export const SpeechService = {
  // Get available speech synthesis voices
  getVoices(): Promise<VoiceOption[]> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve([]);
        return;
      }

      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(
          voices.map((v) => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
            gender: v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') ? 'Female' : 'Male',
          }))
        );
        return;
      }

      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(
          voices.map((v) => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
            gender: v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') ? 'Female' : 'Male',
          }))
        );
      };
    });
  },

  // Synthesize Speech to audio and timeline clip
  speak(text: string, voiceURI?: string, pitch: number = 1.0, rate: number = 1.0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech Synthesis not supported in this browser.'));
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = pitch;
      utterance.rate = rate;

      if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const chosen = voices.find((v) => v.voiceURI === voiceURI);
        if (chosen) utterance.voice = chosen;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      window.speechSynthesis.speak(utterance);
    });
  },

  // Generate Auto-Captions from text or simulated speech transcription
  generateCaptions(
    rawText: string,
    startTime: number = 0,
    wordsPerCaption: number = 4
  ): CaptionSegment[] {
    const cleanWords = rawText.trim().split(/\s+/).filter(Boolean);
    if (cleanWords.length === 0) return [];

    const segments: CaptionSegment[] = [];
    const averageWordDuration = 0.38; // seconds per word

    let curTime = startTime;
    for (let i = 0; i < cleanWords.length; i += wordsPerCaption) {
      const chunk = cleanWords.slice(i, i + wordsPerCaption);
      const segStart = curTime;
      const wordDetails = chunk.map((word) => {
        const wStart = curTime;
        const wEnd = curTime + averageWordDuration;
        curTime += averageWordDuration;
        return { word, start: wStart, end: wEnd };
      });
      const segEnd = curTime;

      segments.push({
        text: chunk.join(' '),
        start: segStart,
        end: segEnd,
        words: wordDetails,
      });

      // Small pause between phrases
      curTime += 0.15;
    }

    return segments;
  },

  // Silence remover / auto-cut algorithm
  detectSilenceSegments(
    audioBuffer: AudioBuffer,
    silenceThreshold: number = 0.03, // amplitude threshold
    minSilenceDuration: number = 0.4  // minimum silence length in seconds
  ): { start: number; end: number }[] {
    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms chunks
    const silentRanges: { start: number; end: number }[] = [];

    let silenceStart: number | null = null;

    for (let i = 0; i < rawData.length; i += windowSize) {
      let maxAmp = 0;
      const end = Math.min(i + windowSize, rawData.length);
      for (let j = i; j < end; j++) {
        const amp = Math.abs(rawData[j]);
        if (amp > maxAmp) maxAmp = amp;
      }

      const time = i / sampleRate;
      if (maxAmp < silenceThreshold) {
        if (silenceStart === null) silenceStart = time;
      } else {
        if (silenceStart !== null) {
          const duration = time - silenceStart;
          if (duration >= minSilenceDuration) {
            silentRanges.push({ start: silenceStart, end: time });
          }
          silenceStart = null;
        }
      }
    }

    if (silenceStart !== null) {
      const duration = (rawData.length / sampleRate) - silenceStart;
      if (duration >= minSilenceDuration) {
        silentRanges.push({ start: silenceStart, end: rawData.length / sampleRate });
      }
    }

    return silentRanges;
  },
};
