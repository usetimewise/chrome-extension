import type { TopCategory, TopSite } from "../../../lib/types.js";
import { formatDuration, humanizeCategory } from "../../../lib/utils.js";

function sitesForCategory(category: string, sites: TopSite[]): TopSite[] {
  return sites
    .filter((site) => site.category === category && site.host)
    .slice(0, 2);
}

export function CategoryRows({ categories, sites }: { categories: TopCategory[]; sites: TopSite[] }) {
  if (!categories.length) {
    return (
      <div className="category-empty">
        <span>No category signal yet.</span>
      </div>
    );
  }

  return categories.map((item) => {
    const categorySites = sitesForCategory(item.category, sites);

    return (
      <section className="category-row" key={item.category}>
        <div className="category-line">
          <h2>{humanizeCategory(item.category)}</h2>
          <strong>{formatDuration(item.duration_ms)}</strong>
        </div>
        {categorySites.length > 0 ? (
          <div className="site-chips">
            {categorySites.map((site) => (
              <span className="site-chip" key={site.host}>{site.host}</span>
            ))}
          </div>
        ) : null}
      </section>
    );
  });
}
