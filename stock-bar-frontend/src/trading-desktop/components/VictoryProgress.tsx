import { money } from "../marketUtils";
import type { PlayerCompanyResponse } from "../types";

export default function VictoryProgress({
  company
}: {
  company: PlayerCompanyResponse | null;
}) {
  const current = company?.companyValue ?? 0;
  const target = company?.victoryTarget ?? 1000000;
  const rawPercent = target > 0 ? (current / target) * 100 : 0;
  const percent = Math.max(0, Math.min(rawPercent, 100));
  const tooltip = `Company value ${money.format(current)} of ${money.format(target)} (${rawPercent.toFixed(1)}%)`;

  return (
    <div className="mes-victory-progress" title={tooltip} aria-label={tooltip}>
      <div className="mes-victory-progress__copy">
        <span>VICTORY</span>
        <strong>{money.format(current)} / {money.format(target)}</strong>
      </div>
      <div
        className="mes-victory-progress__track"
        role="progressbar"
        aria-label="Victory progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
