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
  title: 'Test Atlas',
  subtitle: 'Test subtitle',
  mapImage: {
    src: 'assets/placeholder-map.svg',
    alt: 'Placeholder map',
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
    label: 'Prologue',
    maxRevealOrder: 1,
    description: 'Early map.'
  },
  {
    id: 'episode-8',
    label: 'Episode 8',
    maxRevealOrder: 6,
    description: 'Late map.'
  }
];

const markers: WorldMarker[] = [
  {
    id: 'grayharbor',
    name: 'Grayharbor',
    type: 'Port City',
    position: { x: 330, y: 730 },
    revealOrder: 1,
    revealLabel: 'Known from the prologue',
    summary: 'Safe early region.',
    image: {
      src: 'assets/grayharbor.svg',
      alt: 'Grayharbor skyline'
    },
    relatedEpisodes: ['Prologue'],
    tags: ['coast']
  },
  {
    id: 'ninth-gate',
    name: 'The Ninth Gate',
    type: 'Ruin',
    position: { x: 1290, y: 285 },
    revealOrder: 6,
    revealLabel: 'Major spoiler',
    summary: 'Hidden late region.',
    image: {
      src: 'assets/ninth-gate.svg',
      alt: 'Ancient stone gate'
    },
    relatedEpisodes: ['Episode 8'],
    tags: ['spoiler']
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

    expect(await screen.findByText('Grayharbor')).toBeInTheDocument();
    expect(screen.queryByText('The Ninth Gate')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Story progress'), {
      target: { value: 'episode-8' }
    });
    expect(screen.getByRole('dialog', { name: 'Spoiler warning' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('The Ninth Gate')).not.toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();

    fireEvent.change(screen.getByLabelText('Story progress'), {
      target: { value: 'episode-8' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('dialog', { name: 'Confirm progress change' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('The Ninth Gate')).not.toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();

    fireEvent.change(screen.getByLabelText('Story progress'), {
      target: { value: 'episode-8' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reveal this level' }));

    expect(await screen.findByText('The Ninth Gate')).toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe('episode-8');
  });

  it('does not render hidden markers or their images', async () => {
    render(<App />);

    const map = await screen.findByTestId('map-view');
    expect(within(map).getByText('Grayharbor')).toBeInTheDocument();
    expect(screen.queryByText('The Ninth Gate')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Ancient stone gate')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Grayharbor' }));
    expect(screen.getByRole('dialog', { name: 'Grayharbor' })).toBeInTheDocument();
    expect(screen.getByAltText('Grayharbor skyline')).toBeInTheDocument();
    expect(screen.queryByAltText('Ancient stone gate')).not.toBeInTheDocument();
  });
});
