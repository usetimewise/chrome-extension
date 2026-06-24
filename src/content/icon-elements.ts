const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

type ContentIconName = "close" | "site";

type ContentIconOptions = {
    className?: string;
    size?: number;
};

const ICON_PATHS: Record<ContentIconName, string[]> = {
    close: ["M18 6 6 18", "m6 6 12 12"],
    site: [
        "M21.54 15H17a2 2 0 0 0-2 2v4.54",
        "M7 3.34V5a3 3 0 0 0 3 3 2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17",
        "M11 21.95V18a2 2 0 0 0-2-2 2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05",
        "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    ],
};

export function createContentIcon(
    name: ContentIconName,
    options: ContentIconOptions = {},
): SVGSVGElement {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    const size = options.size ?? 18;

    svg.setAttribute("xmlns", SVG_NAMESPACE);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    if (options.className) {
        svg.setAttribute("class", options.className);
    }

    for (const pathData of ICON_PATHS[name]) {
        const path = document.createElementNS(SVG_NAMESPACE, "path");
        path.setAttribute("d", pathData);
        svg.append(path);
    }

    return svg;
}
