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
          setLoadError('지도 데이터를 불러오지 못했습니다.');
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
        <p>지도를 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="side-panel" aria-label="지도 조작">
        <div>
          <p className="eyebrow">판타지 지도</p>
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
          <span>공개된 지역</span>
        </div>
      </aside>

      <section className="map-panel" aria-label="인터랙티브 판타지 지도">
        <MapView
          config={mapData.config}
          markers={visibleMarkers}
          onMarkerClick={setSelectedMarker}
        />
      </section>

      {confirmStep === 'spoiler-warning' && pendingProgressLevel ? (
        <ConfirmDialog
          title="스포일러 경고"
          confirmLabel="계속"
          onCancel={cancelProgressChange}
          onConfirm={confirmProgressWarning}
        >
          <p>
            이야기 진행도를 바꾸면 이후 회차의 장소, 이름, 단서가 공개될 수 있습니다.
          </p>
          <p>변경하려는 단계: {pendingProgressLevel.label}</p>
        </ConfirmDialog>
      ) : null}

      {confirmStep === 'final-confirmation' && pendingProgressLevel ? (
        <ConfirmDialog
          title="진행도 변경 확인"
          confirmLabel="네, 괜찮습니다."
          onCancel={cancelProgressChange}
          onConfirm={applyProgressChange}
        >
          <p>
            최종 확인입니다. 진짜 지도를 {pendingProgressLevel.label} 단계로 바꾸시겠습니까?
            스포일러는 본인 책임입니다!?
          </p>
        </ConfirmDialog>
      ) : null}

      {selectedMarker ? (
        <RegionModal marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
      ) : null}
    </main>
  );
}
