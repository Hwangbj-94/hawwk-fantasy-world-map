import type { MapConfig, MapData, ProgressLevel, WorldMarker } from './types';

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function loadMapData(): Promise<MapData> {
  const [config, progressLevels, markers] = await Promise.all([
    loadJson<MapConfig>('data/map.config.json'),
    loadJson<ProgressLevel[]>('data/progress-levels.json'),
    loadJson<WorldMarker[]>('data/markers.json')
  ]);

  return { config, progressLevels, markers };
}
