import { useMemo, useState } from "react";
import { FaBolt, FaExclamationTriangle, FaScroll, FaSyncAlt } from "react-icons/fa";
import { valueClass } from "../marketUtils";
import {
  type HoldingImpactMeta,
  holdingImpactCardClass,
  holdingImpactClass,
  holdingImpactMetaForNews,
  newsImpactLabel
} from "../newsUtils";
import type { DesktopAppRenderProps, NewsSeverity, WorldNewsItem } from "../types";

type NewsFilter = "ALL" | "MY_PORTFOLIO" | "POSITIVE" | "NEGATIVE" | "CRITICAL";

const filters: Array<{ id: NewsFilter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "MY_PORTFOLIO", label: "My Portfolio" },
  { id: "POSITIVE", label: "Positive" },
  { id: "NEGATIVE", label: "Negative" },
  { id: "CRITICAL", label: "Critical" }
];

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function severityClass(severity: NewsSeverity) {
  if (severity === "CRITICAL") return "mes-negative";
  if (severity === "HIGH") return "mes-warning";
  if (severity === "MEDIUM") return "mes-info";
  return "mes-positive";
}

function severityCardClass(severity: NewsSeverity) {
  if (severity === "CRITICAL") return "mes-herald-card--critical";
  if (severity === "HIGH") return "mes-herald-card--high";
  if (severity === "MEDIUM") return "mes-herald-card--medium";
  return "mes-herald-card--low";
}

function impactClass(news: WorldNewsItem) {
  if (news.direction === "MIXED") return "text-amber-200";
  if (news.direction === "NEUTRAL") return "text-stone-400";
  return valueClass(news.impactPercent);
}

function impactLabel(news: WorldNewsItem) {
  return newsImpactLabel(news);
}

function NewsIcon({ severity }: { severity: NewsSeverity }) {
  if (severity === "CRITICAL" || severity === "HIGH") {
    return <FaExclamationTriangle aria-hidden="true" />;
  }
  if (severity === "MEDIUM") {
    return <FaBolt aria-hidden="true" />;
  }
  return <FaScroll aria-hidden="true" />;
}

function NewsCard({
  news,
  impactMeta
}: {
  news: WorldNewsItem;
  impactMeta: HoldingImpactMeta | null;
}) {
  const affectsYou = impactMeta !== null;

  return (
    <article
      className={`mes-herald-card ${severityCardClass(news.severity)} ${
        affectsYou ? holdingImpactCardClass(impactMeta.tone) : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-8 w-8 shrink-0 place-items-center border border-current/40 text-xs ${severityClass(news.severity)}`}>
          <NewsIcon severity={news.severity} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mes-herald-card__meta">
            <span className={`mes-herald-card__severity ${severityClass(news.severity)}`}>
              {news.severity}
            </span>
            <span className="mes-herald-card__time">{formatTime(news.timestamp)}</span>
            <span className="mes-herald-card__time">{news.category}</span>
            {affectsYou && (
              <span className={`mes-herald-card__severity ${holdingImpactClass(impactMeta.tone)}`}>
                {impactMeta.label}
              </span>
            )}
          </div>

          <div className="mes-herald-card__title-row">
            <h3 className="mes-herald-card__title">{news.title}</h3>
            <span className={`mes-herald-card__impact ${impactClass(news)}`}>
              {impactLabel(news)}
            </span>
          </div>

          <p className="mes-herald-card__summary">{news.summary}</p>
          {impactMeta && (
            <div className={`mt-2 border px-2 py-1 text-[10px] font-semibold ${holdingImpactClass(impactMeta.tone)}`}>
              {impactMeta.hint}
            </div>
          )}
          <p className="mes-herald-card__description">{news.description}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(news.affectedAssetName || news.affectedSector) && (
              <span className="mes-tag mes-warning">
                {news.affectedAssetName ?? news.affectedSector}
              </span>
            )}
            <span className="mes-tag">
              {news.direction}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function GuildHeraldApp({
  portfolio,
  products,
  worldNews,
  isLoadingNews,
  newsError,
  onNewsChanged,
  isActive
}: DesktopAppRenderProps) {
  const [activeFilter, setActiveFilter] = useState<NewsFilter>("ALL");
  const newsWithImpact = useMemo(
    () =>
      worldNews.map((news) => ({
        news,
        impactMeta: holdingImpactMetaForNews(news, portfolio, products)
      })),
    [portfolio, products, worldNews]
  );
  const filteredNews = useMemo(
    () =>
      newsWithImpact.filter(({ news, impactMeta }) => {
        if (activeFilter === "ALL") return true;
        if (activeFilter === "MY_PORTFOLIO") return impactMeta !== null;
        if (activeFilter === "POSITIVE") return news.direction === "POSITIVE";
        if (activeFilter === "NEGATIVE") return news.direction === "NEGATIVE";
        return news.severity === "CRITICAL";
      }),
    [activeFilter, newsWithImpact]
  );

  return (
    <section className="mes-app" data-active={isActive}>
      <div className="mes-app__header">
        <div>
          <h2 className="mes-app__title">
            Guild Herald
          </h2>
          <p className="mes-app__subtitle">Kingdom news with portfolio-aware impact</p>
        </div>
        <button
          type="button"
          onClick={onNewsChanged}
          className="mes-icon-button"
          title="Refresh news"
          aria-label="Refresh news"
        >
          <FaSyncAlt aria-hidden="true" />
        </button>
      </div>

      <div className="mes-app__body">
        <div className="mes-filter-group">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`mes-filter ${activeFilter === filter.id ? "is-active" : ""}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoadingNews && (
          <div className="mes-banner">
            Loading Guild Herald...
          </div>
        )}
        {newsError && (
          <div className="mes-banner mes-banner--danger">
            {newsError}
          </div>
        )}
        {!isLoadingNews && worldNews.length === 0 && (
          <div className="mes-state">
            No kingdom news yet.
          </div>
        )}
        {!isLoadingNews && worldNews.length > 0 && filteredNews.length === 0 && (
          <div className="mes-state">
            No news matches this filter.
          </div>
        )}
        <div className="mes-herald-list">
          {filteredNews.map(({ news, impactMeta }) => (
            <NewsCard key={news.id} news={news} impactMeta={impactMeta} />
          ))}
        </div>
      </div>
    </section>
  );
}
