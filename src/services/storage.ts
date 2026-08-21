import { get, set, del, keys } from 'idb-keyval';
import { Project, MediaAsset } from '../types/editor';
import { STOCK_VIDEOS, STOCK_IMAGES, STOCK_AUDIO_TRACKS } from './stockAssets';

const PROJECT_PREFIX = 'vidforge_proj_';
const ASSET_BLOB_PREFIX = 'vidforge_blob_';
const LAST_ACTIVE_KEY = 'vidforge_last_active_project';

// Mappings for old CORS-blocked stock videos
const LEGACY_URL_MAPPING: { pattern: string; newUrl: string }[] = [
  { pattern: 'ForBiggerBlazes.mp4', newUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Big_Buck_Bunny_4K.webm' },
  { pattern: 'ForBiggerEscapes.mp4', newUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Sintel_movie_4K.webm' },
  { pattern: 'ForBiggerFun.mp4', newUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm' },
  { pattern: 'ForBiggerJoyrides.mp4', newUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Elephants_Dream_%281080p_24fps%29.webm' },
  { pattern: 'ForBiggerMeltdowns.mp4', newUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Caminandes_3_-_Llamigos_-_1080p.webm' },
];

export const StorageService = {
  async saveProject(project: Project): Promise<void> {
    try {
      await set(`${PROJECT_PREFIX}${project.id}`, project);
      await set(LAST_ACTIVE_KEY, project.id);
    } catch (e) {
      console.error('Failed to save project to IndexedDB', e);
    }
  },

  async loadProject(id: string): Promise<Project | null> {
    try {
      const proj = await get<Project>(`${PROJECT_PREFIX}${id}`);
      if (!proj) return null;

      // Hydrate blob URLs and sync stock assets
      let needsSave = false;
      const allStock = [...STOCK_VIDEOS, ...STOCK_IMAGES];

      for (const asset of proj.assets) {
        
        // Ensure stock assets always have the latest URL (fixes broken legacy URLs)
        if (asset.isStock) {
          const stockDef = allStock.find(s => s.id === asset.id);
          if (stockDef && asset.url !== stockDef.url) {
            asset.url = stockDef.url;
            asset.name = stockDef.name; // Also update name just in case
            
            // Update all clips referencing this stock asset
            proj.tracks.forEach((t) => {
              t.clips.forEach((c) => {
                if (c.assetId === asset.id) {
                  c.src = stockDef.url;
                  c.name = stockDef.name;
                }
              });
            });
            needsSave = true;
          }
        }

        if (asset.url.startsWith('blob:')) {
          const blob = await get<Blob>(`${ASSET_BLOB_PREFIX}${asset.id}`);
          if (blob) {
            const newUrl = URL.createObjectURL(blob);
            asset.url = newUrl;
            // Update clips referencing this asset
            proj.tracks.forEach((t) => {
              t.clips.forEach((c) => {
                if (c.assetId === asset.id) {
                  c.src = newUrl;
                }
              });
            });
            needsSave = true;
          }
        }
      }

      if (needsSave) {
        await set(`${PROJECT_PREFIX}${id}`, proj);
      }

      return proj;
    } catch (e) {
      console.error(`Failed to load project ${id}`, e);
      return null;
    }
  },

  async listProjects(): Promise<Project[]> {
    try {
      const allKeys = await keys();
      const projKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(PROJECT_PREFIX));
      const projects: Project[] = [];

      for (const key of projKeys) {
        const p = await get<Project>(key);
        if (p) projects.push(p);
      }

      return projects.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (e) {
      console.error('Failed to list projects', e);
      return [];
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      await del(`${PROJECT_PREFIX}${id}`);
    } catch (e) {
      console.error(`Failed to delete project ${id}`, e);
    }
  },

  async getLastActiveProjectId(): Promise<string | null> {
    try {
      return (await get<string>(LAST_ACTIVE_KEY)) || null;
    } catch {
      return null;
    }
  },

  async saveAssetBlob(assetId: string, blob: Blob): Promise<void> {
    try {
      await set(`${ASSET_BLOB_PREFIX}${assetId}`, blob);
    } catch (e) {
      console.error(`Failed to save blob for asset ${assetId}`, e);
    }
  },

  async loadAssetBlob(assetId: string): Promise<Blob | null> {
    try {
      return (await get<Blob>(`${ASSET_BLOB_PREFIX}${assetId}`)) || null;
    } catch (e) {
      console.error(`Failed to load blob for asset ${assetId}`, e);
      return null;
    }
  },
};
