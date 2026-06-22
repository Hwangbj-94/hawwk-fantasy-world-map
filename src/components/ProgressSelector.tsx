import type { ProgressLevel } from '../types';

interface ProgressSelectorProps {
  progressLevels: ProgressLevel[];
  selectedProgressLevel: ProgressLevel;
  onRequestChange: (progressLevelId: string) => void;
}

export function ProgressSelector({
  progressLevels,
  selectedProgressLevel,
  onRequestChange
}: ProgressSelectorProps) {
  return (
    <label className="progress-selector">
      <span>Story progress</span>
      <select
        aria-label="Story progress"
        value={selectedProgressLevel.id}
        onChange={(event) => onRequestChange(event.target.value)}
      >
        {progressLevels.map((level) => (
          <option key={level.id} value={level.id}>
            {level.label}
          </option>
        ))}
      </select>
    </label>
  );
}
