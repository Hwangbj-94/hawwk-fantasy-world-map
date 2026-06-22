import L from 'leaflet';
import { CRS } from 'leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import { ImageOverlay, MapContainer, Marker, Tooltip, useMap } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';
import type { MapConfig, WorldMarker } from '../types';
import { assetUrl } from '../utils/assets';

interface MapViewProps {
  config: MapConfig;
  markers: WorldMarker[];
  onMarkerClick: (marker: WorldMarker) => void;
}

const MARKER_TYPE_CLASSES: Record<string, string> = {
  이동로: 'route',
  기록관: 'archive',
  숲: 'forest',
  폐허: 'ruin'
};

function MapBounds({ config }: { config: MapConfig }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([
      [0, 0],
      [config.mapImage.height, config.mapImage.width]
    ]);

    map.setMaxBounds(bounds.pad(0.25));
    map.fitBounds(bounds);
  }, [config, map]);

  return null;
}

function markerIcon(type: string) {
  const normalizedType =
    MARKER_TYPE_CLASSES[type] ??
    type
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  const markerClass = normalizedType || 'default';

  return L.divIcon({
    className: `map-marker map-marker-${markerClass}`,
    html: '<span aria-hidden="true"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

function formatZoomScale(zoom: number): string {
  const percent = 100 * 2 ** zoom;
  const roundedPercent = percent >= 20 ? Math.round(percent) : Number(percent.toFixed(1));

  return `${roundedPercent}%`;
}

function CoordinateReadout() {
  const map = useMap();
  const [coordinate, setCoordinate] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleMouseMove(event: LeafletMouseEvent) {
      setCoordinate({
        x: Math.round(event.latlng.lng),
        y: Math.round(event.latlng.lat)
      });
    }

    function handleMouseOut() {
      setCoordinate(null);
    }

    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', handleMouseOut);
    };
  }, [map]);

  return (
    <div className="coordinate-readout" aria-label="현재 지도 좌표">
      {coordinate ? `X: ${coordinate.x}, Y: ${coordinate.y}` : 'X: -, Y: -'}
    </div>
  );
}

function ScaleReadout() {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useEffect(() => {
    function updateZoom() {
      setZoom(map.getZoom());
    }

    updateZoom();
    map.on('zoom', updateZoom);
    map.on('zoomend', updateZoom);

    return () => {
      map.off('zoom', updateZoom);
      map.off('zoomend', updateZoom);
    };
  }, [map]);

  return (
    <div className="scale-readout" aria-label="현재 지도 축척">
      축척 {formatZoomScale(zoom)}
    </div>
  );
}

export function MapView({ config, markers, onMarkerClick }: MapViewProps) {
  const bounds = useMemo<L.LatLngBoundsExpression>(
    () => [
      [0, 0],
      [config.mapImage.height, config.mapImage.width]
    ],
    [config.mapImage.height, config.mapImage.width]
  );

  return (
    <MapContainer
      attributionControl={false}
      center={[config.initialView.center.y, config.initialView.center.x]}
      className="map-canvas"
      crs={CRS.Simple}
      maxZoom={config.initialView.maxZoom}
      minZoom={config.initialView.minZoom}
      scrollWheelZoom
      touchZoom
      zoom={config.initialView.zoom}
      zoomControl
    >
      <ImageOverlay
        alt={config.mapImage.alt}
        bounds={bounds}
        url={assetUrl(config.mapImage.src)}
      />
      <MapBounds config={config} />
      <CoordinateReadout />
      <ScaleReadout />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          eventHandlers={{ click: () => onMarkerClick(marker) }}
          icon={markerIcon(marker.type)}
          position={[marker.position.y, marker.position.x]}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={1}>
            {marker.name}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
