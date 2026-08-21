import { MediaAsset, Project } from '../types/editor';

// Curated stock assets with royalty-free videos, dynamic generators, audio tracks, and stickers
export const STOCK_VIDEOS: MediaAsset[] = [
  {
    id: 'stock_vid_1',
    name: 'Big Buck Bunny (Blender)',
    type: 'video',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.vp9.webm',
    duration: 596.0,
    width: 1280,
    height: 720,
    thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    isStock: true,
  },
  {
    id: 'stock_vid_2',
    name: 'Sintel (Blender)',
    type: 'video',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.480p.vp9.webm',
    duration: 888.0,
    width: 1280,
    height: 720,
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    isStock: true,
  },
  {
    id: 'stock_vid_3',
    name: 'Tears of Steel (Blender)',
    type: 'video',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/cb/Tears_of_Steel_1080p.webm/Tears_of_Steel_1080p.webm.480p.vp9.webm',
    duration: 734.0,
    width: 1280,
    height: 720,
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    isStock: true,
  },
  {
    id: 'stock_vid_4',
    name: 'Elephants Dream (Blender)',
    type: 'video',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a2/Elephants_Dream_%282006%29.webm/Elephants_Dream_%282006%29.webm.480p.vp9.webm',
    duration: 653.0,
    width: 1280,
    height: 720,
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    isStock: true,
  },
  {
    id: 'stock_vid_5',
    name: 'Caminandes 3 (Blender)',
    type: 'video',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/ab/Caminandes_3_-_Llamigos_-_Blender_Animated_Short.webm/Caminandes_3_-_Llamigos_-_Blender_Animated_Short.webm.480p.vp9.webm',
    duration: 150.0,
    width: 1280,
    height: 720,
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    isStock: true,
  },
];

export const STOCK_IMAGES: MediaAsset[] = [
  {
    id: 'stock_img_1',
    name: 'Cyberpunk Grid Abstract',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1280&auto=format&fit=crop&q=80',
    duration: 5.0,
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    isStock: true,
  },
  {
    id: 'stock_img_2',
    name: 'Vibrant Neon Lights',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&auto=format&fit=crop&q=80',
    duration: 5.0,
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    isStock: true,
  },
  {
    id: 'stock_img_3',
    name: 'Minimalist Architecture',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1280&auto=format&fit=crop&q=80',
    duration: 5.0,
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    isStock: true,
  },
  {
    id: 'stock_img_4',
    name: 'Golden Hour Mountain',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&auto=format&fit=crop&q=80',
    duration: 5.0,
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&auto=format&fit=crop&q=80',
    createdAt: Date.now(),
    isStock: true,
  },
];

export interface StockAudioTrack {
  id: string;
  name: string;
  genre: string;
  duration: number;
  bpm: number;
  type: 'synth_bgm' | 'synth_sfx';
  subType: 'upbeat' | 'lofi' | 'cinematic' | 'techno' | 'swoosh' | 'ding' | 'pop' | 'transition';
}

export const STOCK_AUDIO_TRACKS: StockAudioTrack[] = [
  {
    id: 'audio_upbeat_1',
    name: 'Electric Horizon (Upbeat Vlog)',
    genre: 'Synthpop',
    duration: 20.0,
    bpm: 124,
    type: 'synth_bgm',
    subType: 'upbeat',
  },
  {
    id: 'audio_lofi_1',
    name: 'Midnight Study (Lo-Fi Chill)',
    genre: 'Lo-Fi Chill',
    duration: 24.0,
    bpm: 85,
    type: 'synth_bgm',
    subType: 'lofi',
  },
  {
    id: 'audio_cinematic_1',
    name: 'Epic Rise (Cinematic Trailer)',
    genre: 'Orchestral',
    duration: 18.0,
    bpm: 110,
    type: 'synth_bgm',
    subType: 'cinematic',
  },
  {
    id: 'audio_techno_1',
    name: 'Cyber Pulse (High Energy EDM)',
    genre: 'Cyber Techno',
    duration: 16.0,
    bpm: 130,
    type: 'synth_bgm',
    subType: 'techno',
  },
  {
    id: 'sfx_swoosh_1',
    name: 'Fast Swoosh Transition',
    genre: 'Sound Effect',
    duration: 0.8,
    bpm: 120,
    type: 'synth_sfx',
    subType: 'swoosh',
  },
  {
    id: 'sfx_ding_1',
    name: 'Success Bell / Ding',
    genre: 'Sound Effect',
    duration: 1.2,
    bpm: 120,
    type: 'synth_sfx',
    subType: 'ding',
  },
  {
    id: 'sfx_pop_1',
    name: 'Modern UI Bubble Pop',
    genre: 'Sound Effect',
    duration: 0.4,
    bpm: 120,
    type: 'synth_sfx',
    subType: 'pop',
  },
  {
    id: 'sfx_transition_1',
    name: 'Cyber Whoosh Risers',
    genre: 'Sound Effect',
    duration: 1.5,
    bpm: 120,
    type: 'synth_sfx',
    subType: 'transition',
  },
];

export interface TextTemplate {
  id: string;
  name: string;
  category: 'Titles' | 'Lower Thirds' | 'Captions' | 'Neon' | 'Minimal';
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
  fontWeight: string;
  animation: 'none' | 'fade-in' | 'typewriter' | 'bounce' | 'slide-up' | 'neon-pulse' | 'glow' | 'karaoke-highlight' | 'pop-in';
}

export const TEXT_TEMPLATES: TextTemplate[] = [
  {
    id: 'tpl_bold_title',
    name: 'Cinematic Bold Title',
    category: 'Titles',
    text: 'VIDSYNC STUDIO',
    fontFamily: 'Montserrat',
    fontSize: 54,
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 4,
    shadowColor: 'rgba(0,0,0,0.8)',
    shadowBlur: 16,
    fontWeight: '900',
    animation: 'pop-in',
  },
  {
    id: 'tpl_neon_cyber',
    name: 'Cyberpunk Neon Glow',
    category: 'Neon',
    text: 'CYBERPUNK 2088',
    fontFamily: 'Bebas Neue',
    fontSize: 60,
    color: '#06b6d4',
    shadowColor: '#06b6d4',
    shadowBlur: 24,
    fontWeight: '800',
    animation: 'neon-pulse',
  },
  {
    id: 'tpl_lower_third',
    name: 'Sleek Modern Lower Third',
    category: 'Lower Thirds',
    text: 'Alex Vance | Creative Director',
    fontFamily: 'Inter',
    fontSize: 28,
    color: '#ffffff',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backgroundPadding: 14,
    backgroundRadius: 8,
    fontWeight: '600',
    animation: 'slide-up',
  },
  {
    id: 'tpl_viral_caption',
    name: 'TikTok Viral Dynamic Caption',
    category: 'Captions',
    text: 'THIS CHANGES EVERYTHING 🔥',
    fontFamily: 'Montserrat',
    fontSize: 38,
    color: '#facc15',
    strokeColor: '#000000',
    strokeWidth: 5,
    shadowColor: '#000000',
    shadowBlur: 8,
    fontWeight: '900',
    animation: 'karaoke-highlight',
  },
  {
    id: 'tpl_typewriter',
    name: 'Terminal Typewriter',
    category: 'Minimal',
    text: 'Initializing video sequence...',
    fontFamily: 'JetBrains Mono',
    fontSize: 30,
    color: '#10b981',
    backgroundColor: 'rgba(0,0,0,0.7)',
    backgroundPadding: 10,
    backgroundRadius: 4,
    fontWeight: '700',
    animation: 'typewriter',
  },
  {
    id: 'tpl_elegant_serif',
    name: 'Luxury Vogue Title',
    category: 'Titles',
    text: 'E L E G A N C E',
    fontFamily: 'Playfair Display',
    fontSize: 48,
    color: '#fef08a',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 10,
    fontWeight: '600',
    animation: 'fade-in',
  },
];

export interface StickerTemplate {
  id: string;
  name: string;
  category: 'Badges' | 'Social' | 'Arrows' | 'Shapes';
  svgContent: string;
}

export const STICKER_TEMPLATES: StickerTemplate[] = [
  {
    id: 'stk_subscribe',
    name: 'Subscribe Button',
    category: 'Social',
    svgContent: `<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="60" rx="30" fill="#ef4444"/>
      <path d="M70 20L85 30L70 40Z" fill="white"/>
      <text x="95" y="38" fill="white" font-family="sans-serif" font-weight="bold" font-size="20">SUBSCRIBE</text>
    </svg>`,
  },
  {
    id: 'stk_like',
    name: 'Thumbs Up Like',
    category: 'Social',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#3b82f6"/>
      <path d="M35 50V70H25V50H35ZM40 70H65C68 70 70 68 70 65L75 45C75 42 73 40 70 40H55V25C55 22 53 20 50 20L40 40V70Z" fill="white"/>
    </svg>`,
  },
  {
    id: 'stk_fire',
    name: 'Fire Badge',
    category: 'Badges',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10C50 10 30 35 30 55C30 70 40 85 50 90C60 85 70 70 70 55C70 45 65 35 65 35C65 35 60 45 55 45C50 45 50 35 50 35C50 35 45 45 40 45C35 45 38 60 50 65C45 60 48 50 50 50C52 50 55 58 52 65C58 60 58 50 50 10Z" fill="#f97316"/>
    </svg>`,
  },
  {
    id: 'stk_glow_arrow',
    name: 'Neon Glow Arrow',
    category: 'Arrows',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50H65M65 50L45 30M65 50L45 70" stroke="#06b6d4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,
  },
  {
    id: 'stk_warning',
    name: 'Warning Alert',
    category: 'Badges',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,15 90,85 10,85" fill="#eab308" stroke="#ca8a04" stroke-width="4"/>
      <line x1="50" y1="40" x2="50" y2="65" stroke="#000" stroke-width="8" stroke-linecap="round"/>
      <circle cx="50" cy="76" r="4" fill="#000"/>
    </svg>`,
  },
];
export const updateProjectWithFreshStockAssets = (project: Project): Project => {
  const stockAssetsMap = new Map<string, MediaAsset>();
  [...STOCK_VIDEOS, ...STOCK_IMAGES].forEach(a => {
    stockAssetsMap.set(a.id, a);
  });

  const updatedAssets = project.assets.map(asset => {
    if (asset.isStock && stockAssetsMap.has(asset.id)) {
      return stockAssetsMap.get(asset.id)!;
    }
    return asset;
  });

  const updatedTracks = project.tracks.map(track => ({
    ...track,
    clips: track.clips.map(clip => {
      if (clip.assetId && stockAssetsMap.has(clip.assetId)) {
        const freshAsset = stockAssetsMap.get(clip.assetId)!;
        return {
          ...clip,
          src: freshAsset.url,
          name: freshAsset.name
        };
      }
      return clip;
    })
  }));

  return {
    ...project,
    assets: updatedAssets,
    tracks: updatedTracks
  };
};
