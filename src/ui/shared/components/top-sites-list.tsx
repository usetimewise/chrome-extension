import type { TopSite } from "../../../lib/types.js";
import { formatDuration, humanizeCategory } from "../../../lib/utils.js";
import { categoryTone } from "../lib/presentation.js";

export function TopSitesList({ sites }: { sites: TopSite[] }) {
  return (
    <div className="top-sites-list">
      {sites.map((site, index) => (
        <article className="top-sites-row" key={`${site.host || "unknown"}:${index}`}>
          <div className="top-sites-icon" aria-hidden="true">
            <span className="fa-solid fa-globe" />
          </div>
          <div className="top-sites-copy">
            <strong>{site.host || "Unknown site"}</strong>
          </div>
          <span className={`top-sites-category-pill is-${categoryTone(site.category)}`}>
            {humanizeCategory(site.category)}
          </span>
          <strong className="top-sites-duration">{formatDuration(site.duration_ms)}</strong>
        </article>
      ))}
    </div>
  );
}
