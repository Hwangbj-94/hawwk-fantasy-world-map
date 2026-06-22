import type { WorldMarker } from '../types';
import { assetUrl } from '../utils/assets';

interface RegionModalProps {
  marker: WorldMarker;
  onClose: () => void;
}

export function RegionModal({ marker, onClose }: RegionModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="region-dialog-title"
        aria-modal="true"
        className="modal-panel region-panel"
        role="dialog"
      >
        <div className="region-header">
          <div>
            <p className="eyebrow">{marker.type}</p>
            <h2 id="region-dialog-title">{marker.name}</h2>
          </div>
          <button aria-label="지역 상세 닫기" className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        {marker.image ? (
          <img className="region-image" src={assetUrl(marker.image.src)} alt={marker.image.alt} />
        ) : null}

        <p className="region-summary">{marker.summary}</p>

        <dl className="detail-list">
          <div>
            <dt>공개 조건</dt>
            <dd>{marker.revealLabel}</dd>
          </div>
          <div>
            <dt>관련 회차</dt>
            <dd>{marker.relatedEpisodes.join(', ')}</dd>
          </div>
        </dl>

        <ul className="tag-list" aria-label="태그">
          {marker.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
