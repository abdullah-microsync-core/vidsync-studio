# 🎬 VidSync Studio — Professional Browser-Based Video Editor

**VidSync** is a fast, lightweight, and professional browser-based video editing web application built with **React**, **TypeScript**, **Tailwind CSS**, and **HTML5 Canvas & Web Audio API**. It provides a CapCut / DaVinci Resolve-inspired multi-track editing experience that runs 100% locally in the browser with no server or desktop install required.

---

## ✨ Core Features

### 1. 📁 Media Library & Stock Assets
- **Drag-and-Drop Ingestion**: Upload custom MP4, MOV, WebM, MP3, WAV, PNG, and JPG files with automatic duration and thumbnail extraction.
- **Persistent IndexedDB Storage**: Uploaded files and projects are cached locally in IndexedDB so they persist across page refreshes.
- **Built-in Curated Stock Assets**: Royalty-free videos, animated templates, background music tracks (Synthpop, Lo-Fi, Cinematic, Techno), and sound effects (swoosh, bell ding, pop, risers).

### 2. 🎞️ Multi-Track Timeline Editor
- **Multi-Track System**: Video tracks (`V1`, `V2` for Picture-in-Picture), Text & Titles tracks (`T1`, `T2`), and Audio tracks (`A1`, `A2`).
- **Interactive Editing**:
  - **Trimming**: Left & right edge handles with live duration tooltips.
  - **Splitting**: Split active clip at playhead position (`S` shortcut).
  - **Magnetic Snapping**: Automatically snaps to clip boundaries and playhead.
  - **Duplicating & Deleting**: Fast clip duplicate (`Ctrl+D`) and delete (`Delete` / `Backspace`).
  - **Speed Multiplier**: Smooth slow-motion and fast-forward (`0.25x` to `4.0x`).
  - **Timeline Zoom**: Dynamic zoom slider from 15px to 150px per second with millisecond time markings.
  - **Full History**: Unlimited Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`).

### 3. 🎨 Real-Time Canvas Compositor
- Multi-layer rendering pipeline drawing active video frames, image overlays, vector stickers, and text titles in real-time.
- **On-Canvas Transform Gizmo**: Interactive bounding box on the preview player to drag, scale, and reposition overlays directly on screen.
- **Preset LUTs & Filters**: Cyberpunk, Hollywood Cinematic Teal & Orange, Vintage Warm Film, Noir B&W, Vivid Pop, Emerald, and fine-tuning sliders (Brightness, Contrast, Saturation, Vignette, Blur).
- **Transitions**: Fade, Crossfade, Wipe Left, Wipe Right, Wipe Up, Zoom In/Out, and Slide Left/Right with duration adjustment.

### 4. 🔤 Animated Text & Titles
- Custom typography presets using Google Fonts (*Montserrat, Inter, Bebas Neue, JetBrains Mono, Playfair Display*).
- Dynamic animations: **Pop-in, Typewriter, Bounce, Slide-up, Neon Glow Pulse, and Viral Karaoke Highlight**.

### 5. 🤖 AI Studio Suite
- **AI Auto-Captions**: Generates synchronized, word-by-word animated subtitles with viral highlight styles.
- **AI Voiceover (TTS)**: Web Speech Synthesis API voice synthesis directly to an audio clip on the timeline.
- **Silence Remover**: Detects audio pauses and automatically slices clips.

### 6. 🚀 High-Performance Video Export
- In-browser frame-by-frame export engine with synchronized Web Audio stream.
- Supports **720p HD, 1080p Full HD, and 4K Ultra HD** at **30 FPS / 60 FPS**.
- Real-time progress visualizer displaying rendered frames, percentage, elapsed time, and ETA.
- Direct download and instant preview.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Space`** | Play / Pause Playback |
| **`S`** | Split Selected Clip at Playhead |
| **`Delete` / `Backspace`** | Delete Selected Clip |
| **`Ctrl + D` / `Cmd + D`** | Duplicate Selected Clip |
| **`Ctrl + Z` / `Cmd + Z`** | Undo Last Action |
| **`Ctrl + Y` / `Cmd + Shift + Z`** | Redo Action |
| **`Left Arrow` / `Right Arrow`** | Step 1 Frame Backward / Forward |
| **`Shift + Left` / `Shift + Right`** | Step 1 Second Backward / Forward |
| **`Home` / `End`** | Jump to Timeline Start / End |
| **`+` / `-`** | Zoom In / Out on Timeline |
| **`M`** | Mute / Unmute Master Audio |
| **`F`** | Fullscreen Preview Player |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Dark Professional Editor Theme)
- **State Management**: Zustand
- **Video Compositing**: HTML5 Canvas 2D Compositor + WebCodecs / MediaStream
- **Audio Processing**: Web Audio API (Multi-Track Mixer, Synth Buffers, Waveforms)
- **Persistence**: IndexedDB (`idb-keyval`)
- **Icons**: Lucide React

---

## 🚀 Quick Start & Development

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build production bundle
npm run build
```

Open `http://localhost:5173` in any modern web browser (Chrome, Edge, Brave, Firefox, Safari).
