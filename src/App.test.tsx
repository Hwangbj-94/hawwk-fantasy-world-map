import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { MapConfig, ProgressLevel, WorldMarker } from './types';
import { filterMarkersByProgress, PROGRESS_STORAGE_KEY } from './utils/progress';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

vi.mock('./components/MapView', () => ({
  MapView: ({
    markers,
    onMarkerClick
  }: {
    markers: WorldMarker[];
    onMarkerClick: (marker: WorldMarker) => void;
  }) => (
    <div aria-label="Mock map" data-testid="map-view">
      {markers.map((marker) => (
        <button key={marker.id} type="button" onClick={() => onMarkerClick(marker)}>
          {marker.name}
        </button>
      ))}
    </div>
  )
}));

const mapConfig: MapConfig = {
  title: '테스트 지도',
  subtitle: '테스트 부제',
  mapImage: {
    src: 'assets/placeholder-map.svg',
    alt: '임시 지도',
    width: 1600,
    height: 1000
  },
  defaultProgressLevelId: 'prologue',
  initialView: {
    center: { x: 800, y: 500 },
    zoom: -1,
    minZoom: -3,
    maxZoom: 2
  }
};

const progressLevels: ProgressLevel[] = [
  {
    id: 'prologue',
    label: '프롤로그',
    maxRevealOrder: 1,
    description: '초반 지도.'
  },
  {
    id: 'episode-8',
    label: '8화',
    maxRevealOrder: 6,
    description: '후반 지도.'
  }
];

const markers: WorldMarker[] = [
  {
    id: 'grayharbor',
    name: '잿빛항',
    type: '항구 도시',
    position: { x: 330, y: 730 },
    revealOrder: 1,
    revealLabel: '프롤로그에서 알려짐',
    summary: '초반에 안전하게 공개되는 지역입니다.',
    image: {
      src: 'assets/grayharbor.svg',
      alt: '잿빛항 전경'
    },
    relatedEpisodes: ['프롤로그'],
    tags: ['해안']
  },
  {
    id: 'ninth-gate',
    name: '아홉 번째 문',
    type: '폐허',
    position: { x: 1290, y: 285 },
    revealOrder: 6,
    revealLabel: '중대 스포일러',
    summary: '후반에 숨겨진 지역입니다.',
    image: {
      src: 'assets/ninth-gate.svg',
      alt: '고대 석문'
    },
    relatedEpisodes: ['8화'],
    tags: ['스포일러']
  }
];

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.endsWith('data/map.config.json')) {
        return Promise.resolve(Response.json(mapConfig));
      }

      if (url.endsWith('data/progress-levels.json')) {
        return Promise.resolve(Response.json(progressLevels));
      }

      if (url.endsWith('data/markers.json')) {
        return Promise.resolve(Response.json(markers));
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    })
  );
}

describe('fantasy map spoiler controls', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockFetch();
  });

  it('filters markers by selected progress level', () => {
    expect(filterMarkersByProgress(markers, progressLevels[0]).map((marker) => marker.id)).toEqual([
      'grayharbor'
    ]);
    expect(filterMarkersByProgress(markers, progressLevels[1]).map((marker) => marker.id)).toEqual([
      'grayharbor',
      'ninth-gate'
    ]);
  });

  it('requires two confirmations before changing progress', async () => {
    render(<App />);

    expect(await screen.findByText('잿빛항')).toBeInTheDocument();
    expect(screen.queryByText('아홉 번째 문')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('이야기 진행도'), {
      target: { value: 'episode-8' }
    });
    expect(screen.getByRole('dialog', { name: '스포일러 경고' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByText('아홉 번째 문')).not.toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();

    fireEvent.change(screen.getByLabelText('이야기 진행도'), {
      target: { value: 'episode-8' }
    });
    fireEvent.click(screen.getByRole('button', { name: '계속' }));
    expect(screen.getByRole('dialog', { name: '진행도 변경 확인' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByText('아홉 번째 문')).not.toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();

    fireEvent.change(screen.getByLabelText('이야기 진행도'), {
      target: { value: 'episode-8' }
    });
    fireEvent.click(screen.getByRole('button', { name: '계속' }));
    expect(
      screen.getByText('최종 확인입니다. 진짜 지도를 8화 단계로 바꾸시겠습니까? 스포일러는 본인 책임입니다!?')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '네, 괜찮습니다.' }));

    expect(await screen.findByText('아홉 번째 문')).toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe('episode-8');
  });

  it('does not render hidden markers or their images', async () => {
    render(<App />);

    const map = await screen.findByTestId('map-view');
    expect(within(map).getByText('잿빛항')).toBeInTheDocument();
    expect(screen.queryByText('아홉 번째 문')).not.toBeInTheDocument();
    expect(screen.queryByAltText('고대 석문')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '잿빛항' }));
    expect(screen.getByRole('dialog', { name: '잿빛항' })).toBeInTheDocument();
    expect(screen.getByAltText('잿빛항 전경')).toBeInTheDocument();
    expect(screen.queryByAltText('고대 석문')).not.toBeInTheDocument();
  });
});
