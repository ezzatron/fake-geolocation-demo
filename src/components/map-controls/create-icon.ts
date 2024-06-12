export function createIcon(name: string): SVGSVGElement {
  const viewBox = document
    .getElementById(`${name}-icon`)
    ?.getAttribute("viewBox");

  if (!viewBox) throw new Error("Missing viewBox");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.role = "img";
  svg.setAttribute("aria-hidden", "true");
  svg.dataset.icon = name;

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.href.baseVal = `#${name}-icon`;
  svg.appendChild(use);

  return svg;
}
