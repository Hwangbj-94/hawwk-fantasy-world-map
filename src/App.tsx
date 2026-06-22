import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { MapView } from './components/MapView';
import { ProgressSelector } from './components/ProgressSelector';
import { RegionModal } from './components/RegionModal';
import { loadMapData } from './data';
import type { MapData, ProgressLevel, WorldMarker } from './types';
import {
  filterMarkersByProgress,
  getProgressLevelById,
  PROGRESS_STORAGE_KEY,
  resolveInitialProgressLevel
} from './utils/progress';

type ConfirmStep = 'spoiler-warning' | 'final-confirmation';

export default function App() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProgressLevel, setSelectedProgressLevel] = useState<ProgressLevel | null>(null);
  const [pendingProgressLevel, setPendingProgressLevel] = useState<ProgressLevel | null>(null);
  const [confirmStep, setConfirmStep] = useState<ConfirmStep | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<WorldMarker | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadMapData()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const initialProgressLevel = resolveInitialProgressLevel(
          data.progressLevels,
          data.config.defaultProgressLevelId,
          window.localStorage.getItem(PROGRESS_STORAGE_KEY)
        );

        setMapData(data);
        setSelectedProgressLevel(initialProgressLevel);
      })
      .catch(() => {
        if (isMounted) {
          setLoadError('The map data could not be loaded.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleMarkers = useMemo(() => {
    if (!mapData || !selectedProgressLevel) {
      return [];
    }

    return filterMarkersByProgress(mapData.markers, selectedProgressLevel);
  }, [mapData, selectedProgressLevel]);

  function requestProgressChange(progressLevelId: string) {
    if (!mapData || !selectedProgressLevel || progressLevelId === selectedProgressLevel.id) {
      return;
    }

    const nextProgressLevel = getProgressLevelById(mapData.progressLevels, progressLevelId);

    if (!nextProgressLevel) {
      return;
    }

    setPendingProgressLevel(nextProgressLevel);
    setConfirmStep('spoiler-warning');
  }

  function cancelProgressChange() {
    setPendingProgressLevel(null);
    setConfirmStep(null);
  }

  function confirmProgressWarning() {
    setConfirmStep('final-confirmation');
  }

  function applyProgressChange() {
    if (!pendingProgressLevel) {
      return;
    }

    setSelectedProgressLevel(pendingProgressLevel);
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, pendingProgressLevel.id);
    setPendingProgressLevel(null);
    setConfirmStep(null);
    setSelectedMarker(null);
  }

  if (loadError) {
    return (
      <main className="app-shell state-shell">
        <p role="alert">{loadError}</p>
      </main>
    );
  }

  if (!mapData || !selectedProgressLevel) {
    return (
      <main className="app-shell state-shell">
        <p>Loading map...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="side-panel" aria-label="Map controls">
        <div>
          <p className="eyebrow">Fantasy Atlas</p>
          <h1>{mapData.config.title}</h1>
          {mapData.config.subtitle ? <p className="subtitle">{mapData.config.subtitle}</p> : null}
        </div>

        <ProgressSelector
          progressLevels={mapData.progressLevels}
          selectedProgressLevel={selectedProgressLevel}
          onRequestChange={requestProgressChange}
        />

        <p className="progress-description">{selectedProgressLevel.description}</p>

        <div className="marker-count" aria-live="polite">
          <strong>{visibleMarkers.length}</strong>
          <span>visible regions</span>
        </div>
      </aside>

      <section className="map-panel" aria-label="Interactive fantasy map">
        <MapView
          config={mapData.config}
          markers={visibleMarkers}
          onMarkerClick={setSelectedMarker}
        />
      </section>

      {confirmStep === 'spoiler-warning' && pendingProgressLevel ? (
        <ConfirmDialog
          title="Spoiler warning"
          confirmLabel="Continue"
          onCancel={cancelProgressChange}
          onConfirm={confirmProgressWarning}
        >
          <p>
            Changing story progress may reveal locations, names, and clues from later episodes.
          </p>
          <p>Requested level: {pendingProgressLevel.label}</p>
        </ConfirmDialog>
      ) : null}

      {confirmStep === 'final-confirmation' && pendingProgressLevel ? (
        <ConfirmDialog
          title="Confirm progress change"
          confirmLabel="Reveal this level"
          onCancel={cancelProgressChange}
          onConfirm={applyProgressChange}
        >
          <p>
            Final confirmation: switch the map to {pendingProgressLevel.label} and save this
            setting on this device?
          </p>
        </ConfirmDialog>
      ) : null}

      {selectedMarker ? (
        <RegionModal marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
      ) : null}
    </main>
  );
}
