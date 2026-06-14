import { money } from "../marketUtils";
import { desktopApps } from "../desktopApps";
import type { PlayerCompanyResponse } from "../types";

type Props = {
  company: PlayerCompanyResponse | null;
  isLoading: boolean;
  error: string | null;
  onOpen: () => void;
};

export default function CompanyHudLauncher({
  company,
  isLoading,
  error,
  onOpen
}: Props) {
  const CompanyIcon = desktopApps.company.icon;
  const companyName = company?.companyName ?? "Merchant Company";
  const status = company?.status ?? (isLoading ? "LOADING" : "UNAVAILABLE");
  const tooltip = error
    ? `${companyName}. Company data unavailable. Open Company Keep.`
    : `${companyName}. Open or focus Company Keep.`;

  return (
    <section className="mes-company-launcher" aria-label="Company status">
      <button
        type="button"
        className="mes-company-launcher__crest"
        onClick={onOpen}
        title={tooltip}
        aria-label={`Open Company Keep for ${companyName}`}
      >
        <CompanyIcon aria-hidden="true" />
      </button>
      <button
        type="button"
        className="mes-company-launcher__summary"
        onClick={onOpen}
        title={tooltip}
      >
        <span className="mes-company-launcher__heading">
          <strong>{companyName}</strong>
          <span className={`mes-company-launcher__status is-${String(status).toLowerCase()}`}>
            {status}
          </span>
        </span>
        <span className="mes-company-launcher__metrics">
          <span>Cash <strong>{money.format(company?.cash ?? 0)}</strong></span>
          <span>Runway <strong>{(company?.cashRunwayDays ?? 0).toFixed(1)} days</strong></span>
        </span>
      </button>
      <button
        type="button"
        className="mes-button mes-button--compact mes-company-launcher__open"
        onClick={onOpen}
        title={tooltip}
      >
        OPEN COMPANY KEEP
      </button>
    </section>
  );
}
