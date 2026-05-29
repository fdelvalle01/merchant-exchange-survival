import { useState } from "react";
import { FaChartPie, FaExclamationTriangle, FaHourglassHalf, FaSyncAlt, FaWallet } from "react-icons/fa";
import { money, valueClass } from "../marketUtils";
import { normalizeApiError } from "../services/apiError";
import { endDay } from "../services/gameApi";
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
  icon: "cash" | "concentration" | "runway" | "warning";
};

function alertClass(tone: RiskAlert["tone"]) {
  if (tone === "red") return "border-red-600/60 bg-red-500/10 text-red-200";
  if (tone === "orange") return "border-orange-600/60 bg-orange-500/10 text-orange-200";
  return "border-amber-600/60 bg-amber-500/10 text-amber-100";
}

function AlertIcon({ icon }: { icon: RiskAlert["icon"] }) {
  if (icon === "cash") return <FaWallet aria-hidden="true" />;
  if (icon === "concentration") return <FaChartPie aria-hidden="true" />;
  if (icon === "runway") return <FaHourglassHalf aria-hidden="true" />;
  return <FaExclamationTriangle aria-hidden="true" />;
}

export default function CompanyDashboardApp({
  company,
  portfolio,
  products,
  selectedProduct,
  onSelectProduct,
  isLoadingCompany,
  companyError,
  onProductsChanged,
  onCompanyChanged,
  onPortfolioChanged,
  onOrdersChanged,
  onNewsChanged,
  onMarketEventsChanged,
  onOpenApp,
  isActive
}: DesktopAppRenderProps) {
  const [isEndingDay, setIsEndingDay] = useState(false);
  const [dayResult, setDayResult] = useState<string | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);
  const visiblePortfolio = portfolio.filter((holding) => holding.quantity > 0);
  const totalMarketValue = visiblePortfolio.reduce((total, holding) => total + holding.marketValue, 0);
  const totalPnl = visiblePortfolio.reduce((total, holding) => total + holding.unrealizedPnl, 0);
  const portfolioValue = company?.portfolioValue ?? totalMarketValue;
  const realizedPnl = company?.realizedPnl ?? 0;
  const cash = company?.cash ?? 0;
  const companyValue = company?.companyValue ?? 0;
  const gameDay = company?.gameDay ?? 1;
  const companyStatus = company?.status ?? "ACTIVE";
  const dailyBurnRate = company?.dailyBurnRate ?? 500;
  const cashRunwayDays = company?.cashRunwayDays ?? 0;
  const criticalDays = company?.criticalDays ?? 0;
  const isTerminalStatus = companyStatus === "BANKRUPT" || companyStatus === "VICTORIOUS";
  const productForHolding = (assetId: number) =>
    products.find((product) => String(product.id) === String(assetId));
  const largestHolding = visiblePortfolio.reduce(
    (largest, holding) => Math.max(largest, holding.marketValue),
    0
  );
  const concentrationPercent = portfolioValue > 0 ? (largestHolding / portfolioValue) * 100 : 0;
  const lowCashThreshold = Math.max(10000, companyValue * 0.1);
  const riskAlerts: RiskAlert[] = [
    ...(company && cash < 0
      ? [
          {
            id: "liquidity-crisis",
            label: "Liquidity crisis",
            detail: "Cash is negative. Recover within 3 days.",
            tone: "red" as const,
            icon: "cash" as const
          }
        ]
      : []),
    ...(company && cash >= 0 && cashRunwayDays <= 3
      ? [
          {
            id: "cash-runway",
            label: "Low cash runway",
            detail: `${cashRunwayDays.toFixed(1)} days remaining`,
            tone: "amber" as const,
            icon: "runway" as const
          }
        ]
      : []),
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
            detail: criticalDays > 0 ? `${criticalDays} critical day(s)` : "Company value or liquidity is under pressure",
            tone: "red" as const,
            icon: "warning" as const
          }
        ]
      : [])
  ];

  async function refreshAll() {
    await Promise.all([onCompanyChanged(), onPortfolioChanged()]);
  }

  async function handleEndDay() {
    if (!company || isTerminalStatus) return;

    setIsEndingDay(true);
    setDayError(null);
    setDayResult(null);

    try {
      const nextState = await endDay();
      if (nextState.status === "BANKRUPT") {
        setDayResult(nextState.bankruptcyReason ?? "Bankruptcy declared.");
      } else if (nextState.status === "VICTORIOUS") {
        setDayResult(nextState.victoryMessage ?? "Victory achieved.");
      } else {
        setDayResult(`Day ${nextState.gameDay ?? gameDay + 1} processed. Operating costs paid.`);
      }

      await Promise.all([
        onProductsChanged(),
        onCompanyChanged(),
        onPortfolioChanged(),
        onOrdersChanged(),
        onNewsChanged(),
        onMarketEventsChanged()
      ]);
    } catch (error) {
      const apiError = normalizeApiError(error);
      setDayError(apiError.message);
    } finally {
      setIsEndingDay(false);
    }
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEndDay}
            disabled={!company || isEndingDay || isTerminalStatus}
            className="rounded border border-amber-600/70 bg-amber-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            title={isTerminalStatus ? `Game status: ${companyStatus}` : "Process next game day"}
          >
            {isEndingDay ? "Ending..." : "End Day"}
          </button>
          <button
            type="button"
            onClick={refreshAll}
            className="grid h-7 w-7 place-items-center rounded border border-amber-700/40 bg-black/30 text-amber-300 transition hover:bg-amber-500/10"
            title="Refresh company"
          >
            <FaSyncAlt aria-hidden="true" />
          </button>
        </div>
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
        {companyStatus === "BANKRUPT" && (
          <div className="rounded border border-red-700/60 bg-red-500/15 px-3 py-2 text-xs text-red-100">
            Bankruptcy declared. {company?.bankruptcyReason ?? "The guild has seized your trading license."}
          </div>
        )}
        {companyStatus === "VICTORIOUS" && (
          <div className="rounded border border-emerald-700/60 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100">
            Victory achieved. Your merchant house dominates the exchange.
          </div>
        )}
        {dayResult && (
          <div className="rounded border border-amber-700/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {dayResult}
          </div>
        )}
        {dayError && (
          <div className="rounded border border-red-700/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {dayError}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Day" value={String(gameDay)} className="text-amber-100" />
          <Metric label="Status" value={String(companyStatus)} className={riskClass(companyStatus === "ACTIVE" ? company?.riskLevel : companyStatus === "VICTORIOUS" ? "LOW" : "CRITICAL")} />
          <Metric label="Daily Burn" value={money.format(dailyBurnRate)} className="text-orange-200" />
          <Metric label="Cash Runway" value={`${cashRunwayDays.toFixed(1)} days`} className={cashRunwayDays <= 3 ? "text-red-300" : cashRunwayDays <= 10 ? "text-amber-200" : "text-emerald-300"} />
          <Metric label="Critical Days" value={String(criticalDays)} className={criticalDays > 0 ? "text-red-300" : "text-stone-100"} />
          <Metric label="Victory Target" value={money.format(company?.victoryTarget ?? 1000000)} className="text-stone-100" />
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
            {visiblePortfolio.slice(0, 4).map((holding) => {
              const product = productForHolding(holding.assetId);
              const isSelected = String(selectedProduct?.id) === String(holding.assetId);

              return (
                <button
                  key={holding.assetId}
                  type="button"
                  onClick={() => {
                    if (product) onSelectProduct(product);
                  }}
                  disabled={!product}
                  title={product ? "Click to select asset" : "Asset not available in market feed"}
                  className={`flex w-full items-center justify-between gap-3 border-t border-[#241811] px-2 py-2 text-left font-mono text-xs transition ${
                    isSelected
                      ? "bg-amber-500/10 text-amber-100 outline outline-1 outline-amber-700/40"
                      : product
                      ? "hover:bg-[#20160f]"
                      : "cursor-not-allowed opacity-70"
                  }`}
                >
                  <span className="truncate text-stone-200">{holding.assetName}</span>
                  <span className="text-stone-500">x{holding.quantity}</span>
                  <span className={valueClass(holding.unrealizedPnl)}>
                    {money.format(holding.unrealizedPnl)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
