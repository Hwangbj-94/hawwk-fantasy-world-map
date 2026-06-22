export interface MapConfig {
  title: string;
  subtitle?: string;
  mapImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  defaultProgressLevelId: string;
  initialView: {
    center: Position;
    zoom: number;
    minZoom: number;
    maxZoom: number;
  };
}

export interface Position {
  x: number;
  y: number;
}

export interface ProgressLevel {
  id: string;
  label: string;
  maxRevealOrder: number;
  description: string;
}

export interface MarkerImage {
  src: string;
  alt: string;
}

export interface WorldMarker {
  id: string;
  name: string;
  type: string;
  position: Position;
  revealOrder: number;
  revealLabel: string;
  summary: string;
  image?: MarkerImage;
  relatedEpisodes: string[];
  tags: string[];
}

export interface MapData {
  config: MapConfig;
  progressLevels: ProgressLevel[];
  markers: WorldMarker[];
}
