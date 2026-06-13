import { useState } from "react";
import { FaChartPie, FaExclamationTriangle, FaHourglassHalf, FaSyncAlt, FaWallet } from "react-icons/fa";
import { money, valueClass } from "../marketUtils";
import { normalizeApiError } from "../services/apiError";
import { endDay } from "../services/gameApi";
import type { DesktopAppRenderProps } from "../types";
import { AssetIcon } from "../visualCatalog";

function Metric({
  label,
  value,
  className = ""
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="mes-plate">
      <div className="mes-plate__label">{label}</div>
      <div className={`mes-plate__value ${className}`}>{value}</div>
    </div>
  );
}

function riskClass(riskLevel?: string) {
  if (riskLevel === "CRITICAL") return "mes-negative";
  if (riskLevel === "HIGH") return "mes-warning";
  if (riskLevel === "MEDIUM") return "mes-warning";
  return "mes-positive";
}

type RiskAlert = {
  id: string;
  label: string;
  detail: string;
  tone: "amber" | "orange" | "red";
  icon: "cash" | "concentration" | "runway" | "warning";
};

function alertClass(tone: RiskAlert["tone"]) {
  if (tone === "red") return "mes-alert--danger";
  return "mes-alert--warning";
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
    <section className="mes-app" data-active={isActive}>
      <div className="mes-app__header">
        <div>
          <h2 className="mes-app__title">
            Company Keep
          </h2>
          <p className="mes-app__subtitle">
            {company?.companyName ?? "Merchant company"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEndDay}
            disabled={!company || isEndingDay || isTerminalStatus}
            className="mes-button mes-button--primary mes-button--compact"
            title={isTerminalStatus ? `Game status: ${companyStatus}` : "Process next game day"}
          >
            {isEndingDay ? "Ending..." : "End Day"}
          </button>
          <button
            type="button"
            onClick={refreshAll}
            className="mes-icon-button"
            title="Refresh company"
            aria-label="Refresh company"
          >
            <FaSyncAlt aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mes-app__body">
        {isLoadingCompany && (
          <div className="mes-banner">
            Loading company...
          </div>
        )}
        {companyError && (
          <div className="mes-banner mes-banner--danger">
            {companyError}
          </div>
        )}
        {companyStatus === "BANKRUPT" && (
          <div className="mes-terminal-state mes-terminal-state--bankrupt">
            Bankruptcy declared. {company?.bankruptcyReason ?? "The guild has seized your trading license."}
          </div>
        )}
        {companyStatus === "VICTORIOUS" && (
          <div className="mes-terminal-state mes-terminal-state--victorious">
            Victory achieved. Your merchant house dominates the exchange.
          </div>
        )}
        {dayResult && (
          <div className="mes-banner mes-banner--warning">
            {dayResult}
          </div>
        )}
        {dayError && (
          <div className="mes-banner mes-banner--danger">
            {dayError}
          </div>
        )}

        <div className="mes-plate-grid">
          <Metric label="Game Day" value={String(gameDay)} className="mes-warning" />
          <Metric label="Status" value={String(companyStatus)} className={riskClass(companyStatus === "ACTIVE" ? company?.riskLevel : companyStatus === "VICTORIOUS" ? "LOW" : "CRITICAL")} />
          <Metric label="Daily Burn" value={money.format(dailyBurnRate)} className="mes-warning" />
          <Metric label="Cash Runway" value={`${cashRunwayDays.toFixed(1)} days`} className={cashRunwayDays <= 3 ? "mes-negative" : cashRunwayDays <= 10 ? "mes-warning" : "mes-positive"} />
          <Metric label="Critical Days" value={String(criticalDays)} className={criticalDays > 0 ? "mes-negative" : ""} />
          <Metric label="Victory Target" value={money.format(company?.victoryTarget ?? 1000000)} />
          <Metric label="Treasury / Cash" value={money.format(company?.cash ?? 0)} className="mes-positive" />
          <Metric label="Debt to Crown" value={money.format(company?.debt ?? 0)} className="mes-negative" />
          <Metric label="House Value" value={money.format(company?.companyValue ?? 0)} className="mes-warning" />
          <Metric label="Vault Holdings" value={money.format(portfolioValue)} />
          <Metric label="Realized P/L" value={money.format(realizedPnl)} className={valueClass(realizedPnl)} />
          <Metric label="Guild Renown" value={String(company?.reputation ?? 0)} />
          <Metric label="Peril Level" value={company?.riskLevel ?? "N/A"} className={riskClass(company?.riskLevel)} />
          <Metric label="Unrealized P/L" value={money.format(totalPnl)} className={valueClass(totalPnl)} />
        </div>

        <div className="mes-panel">
          <div className="mes-panel__header">
            <div className="mes-panel__title">
              Risk Alerts
            </div>
            <div className={`mes-data text-[10px] ${riskClass(company?.riskLevel)}`}>
              {company?.riskLevel ?? "N/A"}
            </div>
          </div>

          {riskAlerts.length === 0 && (
            <div className="mes-banner mes-banner--success">
              Risk desk clear.
            </div>
          )}

          {riskAlerts.length > 0 && (
            <div className="mes-alert-grid">
              {riskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`mes-alert ${alertClass(alert.tone)}`}
                >
                  <span className="mes-alert__icon">
                    <AlertIcon icon={alert.icon} />
                  </span>
                  <div className="min-w-0">
                    <div className="mes-alert__title">
                      {alert.label}
                    </div>
                    <div className="mes-alert__detail">
                      {alert.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mes-panel">
          <div className="mes-panel__header">
            <div>
              <div className="mes-panel__title">
                Vault Inventory
              </div>
              <div className="mes-panel__value">
                {money.format(portfolioValue)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenApp("portfolio")}
              className="mes-button mes-button--compact"
            >
              Open Vault
            </button>
          </div>

          <div className="grid gap-1">
            {visiblePortfolio.length === 0 && (
              <div className="mes-state min-h-[76px]">The vault stands empty.</div>
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
                  className={`mes-holding-row ${isSelected ? "is-selected" : ""} ${
                    product ? "" : "cursor-not-allowed opacity-60"
                  }`}
                >
                  <span className="mes-holding-row__asset">
                    <AssetIcon name={holding.assetName} sector={product?.sector} />
                    <span className="truncate">{holding.assetName}</span>
                  </span>
                  <span className="mes-neutral">x{holding.quantity}</span>
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
