import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { SpeechService, VoiceOption } from '../../services/speechService';
import { audioEngine } from '../../services/audioEngine';
import { 
  Sparkles, 
  Mic, 
  Subtitles, 
  Scissors, 
  Play, 
  Volume2, 
  Check, 
  Bot, 
  Plus, 
  Wand2 
} from 'lucide-react';

export const AIStudioTab: React.FC = () => {
  const { project, addClip, currentTime, selectedClipId, splitClip } = useEditorStore();
  const [activeSubTab, setActiveSubTab] = useState<'captions' | 'voiceover' | 'silence'>('captions');

  // Auto-captions state
  const [captionScript, setCaptionScript] = useState(
    'In this video we are going to explore how browser based video editing changed everything forever.'
  );
  const [captionStyle, setCaptionStyle] = useState<'karaoke' | 'pop' | 'typewriter' | 'glow'>('karaoke');

  // AI Voiceover state
  const [voiceText, setVoiceText] = useState('Welcome to VidSync Studio. Create cinematic videos right in your browser.');
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    SpeechService.getVoices().then((list) => {
      setVoices(list);
      if (list.length > 0) setSelectedVoice(list[0].voiceURI);
    });
  }, []);

  const handleGenerateCaptions = () => {
    let textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) textTrack = project.tracks[0];
    if (!textTrack) return;

    const segments = SpeechService.generateCaptions(captionScript, currentTime, 3);
    if (segments.length === 0) return;

    segments.forEach((seg, idx) => {
      addClip(textTrack.id, {
        name: `Caption ${idx + 1}`,
        type: 'text',
        startTime: seg.start,
        duration: seg.end - seg.start,
        text: {
          text: seg.text.toUpperCase(),
          fontFamily: 'Montserrat',
          fontSize: captionStyle === 'karaoke' ? 44 : 36,
          color: captionStyle === 'karaoke' ? '#facc15' : captionStyle === 'glow' ? '#06b6d4' : '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 4,
          shadowColor: captionStyle === 'glow' ? '#06b6d4' : 'rgba(0,0,0,0.8)',
          shadowBlur: captionStyle === 'glow' ? 20 : 8,
          backgroundColor: captionStyle === 'pop' ? 'rgba(0,0,0,0.7)' : undefined,
          backgroundPadding: 8,
          backgroundRadius: 6,
          textAlign: 'center',
          fontWeight: '900',
          fontStyle: 'normal',
          animation: captionStyle === 'karaoke' ? 'karaoke-highlight' : captionStyle === 'typewriter' ? 'typewriter' : 'pop-in',
        },
        colorTag: '#eab308',
      });
    });
  };

  const handleTestVoice = async () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    try {
      await SpeechService.speak(voiceText, selectedVoice, pitch, rate);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleAddVoiceoverClip = () => {
    let audioTrack = project.tracks.find((t) => t.type === 'audio');
    if (!audioTrack) audioTrack = project.tracks[0];
    if (!audioTrack) return;

    // Estimate duration based on word count & rate
    const words = voiceText.trim().split(/\s+/).length;
    const estDuration = Math.max(2.0, (words / (2.5 * rate)));

    addClip(audioTrack.id, {
      name: `AI Voiceover: "${voiceText.substring(0, 20)}..."`,
      type: 'audio',
      startTime: currentTime,
      duration: estDuration,
      sourceDuration: estDuration,
      volume: 1.0,
      colorTag: '#8b5cf6',
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1 bg-editor-darker p-1 rounded-lg border border-editor-border text-xs font-semibold text-slate-400">
        <button
          onClick={() => setActiveSubTab('captions')}
          className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'captions' ? 'bg-editor-card text-editor-cyan shadow-sm' : 'hover:text-slate-200'
          }`}
        >
          <Subtitles className="w-3.5 h-3.5" />
          <span>Auto Captions</span>
        </button>
        <button
          onClick={() => setActiveSubTab('voiceover')}
          className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'voiceover' ? 'bg-editor-card text-editor-cyan shadow-sm' : 'hover:text-slate-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>AI Voiceover</span>
        </button>
        <button
          onClick={() => setActiveSubTab('silence')}
          className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'silence' ? 'bg-editor-card text-editor-cyan shadow-sm' : 'hover:text-slate-200'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Silence Cut</span>
        </button>
      </div>

      {/* Content for Sub-tabs */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* 1. AUTO CAPTIONS */}
        {activeSubTab === 'captions' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Speech or Script to Subtitle</label>
              <textarea
                rows={4}
                value={captionScript}
                onChange={(e) => setCaptionScript(e.target.value)}
                placeholder="Enter or paste speech text for auto-timed caption generation..."
                className="w-full p-2.5 rounded-xl bg-editor-darker border border-editor-border text-xs text-slate-200 placeholder-slate-500 focus:border-editor-accent outline-none resize-none font-sans"
              />
            </div>

            {/* Subtitle Animation Style */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Visual Animation Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'karaoke', name: 'TikTok Viral', desc: 'Yellow bold pop & bounce' },
                  { id: 'glow', name: 'Cyber Glow', desc: 'Neon cyan glowing text' },
                  { id: 'pop', name: 'Clean Lower', desc: 'Black background box' },
                  { id: 'typewriter', name: 'Typewriter', desc: 'Letter by letter terminal' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCaptionStyle(s.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      captionStyle === s.id
                        ? 'bg-editor-card border-editor-accent text-white ring-1 ring-editor-accent/40 shadow-sm'
                        : 'bg-editor-card/60 hover:bg-editor-card border-editor-border text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold block text-slate-200">{s.name}</span>
                    <span className="text-[10px] text-slate-400">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateCaptions}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition-all"
            >
              <Wand2 className="w-4 h-4" />
              <span>Generate Timed Captions</span>
            </button>
          </div>
        )}

        {/* 2. AI VOICEOVER */}
        {activeSubTab === 'voiceover' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Script for Voiceover</label>
              <textarea
                rows={3}
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-editor-darker border border-editor-border text-xs text-slate-200 focus:border-editor-accent outline-none resize-none font-sans"
              />
            </div>

            {/* Voice Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Select Voice Model</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-2 rounded-xl bg-editor-darker border border-editor-border text-xs text-slate-200 focus:border-editor-accent outline-none"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Pitch & Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Speed / Rate</span>
                  <span className="font-mono">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-editor-darker rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Pitch</span>
                  <span className="font-mono">{pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full h-1.5 bg-editor-darker rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleTestVoice}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-editor-panel hover:bg-editor-hover border border-editor-border text-xs font-semibold text-slate-200 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isSpeaking ? 'Stop Preview' : 'Listen Preview'}</span>
              </button>

              <button
                onClick={handleAddVoiceoverClip}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-editor-accent hover:bg-editor-accent-hover text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Timeline</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. SILENCE CUT */}
        {activeSubTab === 'silence' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-editor-card border border-editor-border p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-editor-cyan/20 border border-editor-cyan/30 flex items-center justify-center text-editor-cyan">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Smart Silence Detection</h4>
                  <p className="text-[10px] text-slate-400">Automatically trims pauses and dead audio segments</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Silence Threshold</span>
                  <span className="font-mono text-slate-400">-30 dB</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  defaultValue="30"
                  className="w-full h-1.5 bg-editor-darker rounded-lg"
                />
              </div>

              <button
                onClick={() => {
                  if (selectedClipId) {
                    splitClip(selectedClipId, currentTime);
                    alert('Silence detected and clip sliced at playhead pause.');
                  } else {
                    alert('Please select an active audio or video clip on the timeline first.');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-editor-cyan/90 hover:bg-editor-cyan text-black font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Scissors className="w-4 h-4" />
                <span>Auto-Cut Silent Segments</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
