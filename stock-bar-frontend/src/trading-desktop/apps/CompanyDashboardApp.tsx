import { FaChartPie, FaExclamationTriangle, FaSyncAlt, FaWallet } from "react-icons/fa";
import { money, valueClass } from "../marketUtils";
import type { DesktopAppRenderProps } from "../types";

function Metric({
  label,
  value,
  className = "text-stone-100"
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-md border border-[#3b2a1f] bg-black/25 p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{label}</div>
      <div className={`mt-1 font-mono text-lg ${className}`}>{value}</div>
    </div>
  );
}

function riskClass(riskLevel?: string) {
  if (riskLevel === "CRITICAL") return "text-red-300";
  if (riskLevel === "HIGH") return "text-orange-300";
  if (riskLevel === "MEDIUM") return "text-amber-200";
  return "text-emerald-300";
}

type RiskAlert = {
  id: string;
  label: string;
  detail: string;
  tone: "amber" | "orange" | "red";
  icon: "cash" | "concentration" | "warning";
};

function alertClass(tone: RiskAlert["tone"]) {
  if (tone === "red") return "border-red-600/60 bg-red-500/10 text-red-200";
  if (tone === "orange") return "border-orange-600/60 bg-orange-500/10 text-orange-200";
  return "border-amber-600/60 bg-amber-500/10 text-amber-100";
}

function AlertIcon({ icon }: { icon: RiskAlert["icon"] }) {
  if (icon === "cash") return <FaWallet aria-hidden="true" />;
  if (icon === "concentration") return <FaChartPie aria-hidden="true" />;
  return <FaExclamationTriangle aria-hidden="true" />;
}

export default function CompanyDashboardApp({
  company,
  portfolio,
  isLoadingCompany,
  companyError,
  onCompanyChanged,
  onPortfolioChanged,
  onOpenApp,
  isActive
}: DesktopAppRenderProps) {
  const visiblePortfolio = portfolio.filter((holding) => holding.quantity > 0);
  const totalMarketValue = visiblePortfolio.reduce((total, holding) => total + holding.marketValue, 0);
  const totalPnl = visiblePortfolio.reduce((total, holding) => total + holding.unrealizedPnl, 0);
  const portfolioValue = company?.portfolioValue ?? totalMarketValue;
  const realizedPnl = company?.realizedPnl ?? 0;
  const cash = company?.cash ?? 0;
  const companyValue = company?.companyValue ?? 0;
  const largestHolding = visiblePortfolio.reduce(
    (largest, holding) => Math.max(largest, holding.marketValue),
    0
  );
  const concentrationPercent = portfolioValue > 0 ? (largestHolding / portfolioValue) * 100 : 0;
  const lowCashThreshold = Math.max(10000, companyValue * 0.1);
  const riskAlerts: RiskAlert[] = [
    ...(company && cash < lowCashThreshold
      ? [
          {
            id: "low-cash",
            label: "Low cash",
            detail: `${money.format(cash)} available`,
            tone: "amber" as const,
            icon: "cash" as const
          }
        ]
      : []),
    ...(concentrationPercent >= 50
      ? [
          {
            id: "high-concentration",
            label: "High concentration",
            detail: `${concentrationPercent.toFixed(0)}% in one position`,
            tone: "orange" as const,
            icon: "concentration" as const
          }
        ]
      : []),
    ...(totalPnl < 0
      ? [
          {
            id: "negative-pnl",
            label: "Negative unrealized P/L",
            detail: money.format(totalPnl),
            tone: "orange" as const,
            icon: "warning" as const
          }
        ]
      : []),
    ...(company?.riskLevel === "CRITICAL"
      ? [
          {
            id: "critical-risk",
            label: "Critical risk",
            detail: "Company value or drawdown is under pressure",
            tone: "red" as const,
            icon: "warning" as const
          }
        ]
      : [])
  ];

  async function refreshAll() {
    await Promise.all([onCompanyChanged(), onPortfolioChanged()]);
  }

  return (
    <section
      className={`min-h-full overflow-hidden rounded-md border bg-[#120d09]/95 shadow-2xl ${
        isActive ? "border-amber-600/70" : "border-[#3b2a1f]"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(116, 72, 33, 0.12), transparent 38%), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 18px)"
      }}
    >
      <div className="flex h-11 items-center justify-between border-b border-[#3b2a1f] bg-[#17100b] px-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">
            Company Dashboard
          </h2>
          <p className="text-[11px] text-stone-500">
            {company?.companyName ?? "Merchant company"}
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="grid h-7 w-7 place-items-center rounded border border-amber-700/40 bg-black/30 text-amber-300 transition hover:bg-amber-500/10"
          title="Refresh company"
        >
          <FaSyncAlt aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-3 p-4">
        {isLoadingCompany && (
          <div className="rounded border border-[#3b2a1f] bg-black/20 px-3 py-2 text-xs text-stone-500">
            Loading company...
          </div>
        )}
        {companyError && (
          <div className="rounded border border-red-700/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {companyError}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Cash" value={money.format(company?.cash ?? 0)} className="text-emerald-300" />
          <Metric label="Debt" value={money.format(company?.debt ?? 0)} className="text-red-300" />
          <Metric label="Company Value" value={money.format(company?.companyValue ?? 0)} />
          <Metric label="Portfolio Value" value={money.format(portfolioValue)} />
          <Metric label="Realized P/L" value={money.format(realizedPnl)} className={valueClass(realizedPnl)} />
          <Metric label="Reputation" value={String(company?.reputation ?? 0)} />
          <Metric label="Risk Level" value={company?.riskLevel ?? "N/A"} className={riskClass(company?.riskLevel)} />
          <Metric label="Unrealized P/L" value={money.format(totalPnl)} className={valueClass(totalPnl)} />
        </div>

        <div className="rounded-md border border-[#3b2a1f] bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
              Risk Alerts
            </div>
            <div className={`font-mono text-[11px] ${riskClass(company?.riskLevel)}`}>
              {company?.riskLevel ?? "N/A"}
            </div>
          </div>

          {riskAlerts.length === 0 && (
            <div className="rounded border border-emerald-700/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              Risk desk clear.
            </div>
          )}

          {riskAlerts.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {riskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-3 rounded border px-3 py-2 ${alertClass(alert.tone)}`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-current/30 bg-black/20 text-xs">
                    <AlertIcon icon={alert.icon} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em]">
                      {alert.label}
                    </div>
                    <div className="truncate font-mono text-[11px] text-stone-400">
                      {alert.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-[#3b2a1f] bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                Portfolio Snapshot
              </div>
              <div className="mt-1 font-mono text-sm text-stone-100">
                {money.format(portfolioValue)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenApp("portfolio")}
              className="rounded border border-amber-700/50 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/20"
            >
              OPEN
            </button>
          </div>

          <div className="grid gap-1">
            {visiblePortfolio.length === 0 && (
              <div className="py-4 text-center text-xs text-stone-500">No holdings yet.</div>
            )}
            {visiblePortfolio.slice(0, 4).map((holding) => (
              <div
                key={holding.assetId}
                className="flex items-center justify-between gap-3 border-t border-[#241811] py-2 font-mono text-xs"
              >
                <span className="truncate text-stone-200">{holding.assetName}</span>
                <span className="text-stone-500">x{holding.quantity}</span>
                <span className={valueClass(holding.unrealizedPnl)}>
                  {money.format(holding.unrealizedPnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
