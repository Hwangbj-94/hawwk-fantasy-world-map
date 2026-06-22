import type { ProgressLevel, WorldMarker } from '../types';

export const PROGRESS_STORAGE_KEY = 'fantasy-map-progress-level';

export function filterMarkersByProgress(
  markers: WorldMarker[],
  progressLevel: ProgressLevel
): WorldMarker[] {
  return markers.filter((marker) => marker.revealOrder <= progressLevel.maxRevealOrder);
}

export function getProgressLevelById(
  progressLevels: ProgressLevel[],
  progressLevelId: string
): ProgressLevel | undefined {
  return progressLevels.find((level) => level.id === progressLevelId);
}

export function resolveInitialProgressLevel(
  progressLevels: ProgressLevel[],
  defaultProgressLevelId: string,
  storedProgressLevelId: string | null
): ProgressLevel {
  const defaultProgressLevel =
    getProgressLevelById(progressLevels, defaultProgressLevelId) ?? progressLevels[0];

  if (!defaultProgressLevel) {
    throw new Error('At least one progress level is required.');
  }

  if (!storedProgressLevelId) {
    return defaultProgressLevel;
  }

  return getProgressLevelById(progressLevels, storedProgressLevelId) ?? defaultProgressLevel;
}
