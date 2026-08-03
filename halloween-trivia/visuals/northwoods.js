const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderNorthwoods(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract war-plan folder with a stamped city map inside an evidence aperture",
    "data-visual": "northwoods",
  });

  svg.innerHTML = `
    <g class="aperture" aria-hidden="true">
      <path class="aperture-wedge" d="M450 300 40 48 270 18Z"/><path class="aperture-wedge" d="M450 300 316 0 498 0Z"/>
      <path class="aperture-wedge" d="M450 300 555 0 852 58Z"/><path class="aperture-wedge" d="M450 300 900 120 900 318Z"/>
      <path class="aperture-wedge" d="M450 300 884 425 708 600Z"/><path class="aperture-wedge" d="M450 300 620 600 390 600Z"/>
      <path class="aperture-wedge" d="M450 300 320 600 42 550Z"/><path class="aperture-wedge" d="M450 300 0 430 0 185Z"/>
    </g>
    <g class="northwoods-object" aria-hidden="true">
      <path class="northwoods-shadow" d="M172 153h213l47 52h296v300H172Zm66-61h202l44 61H238Z"/>
      <g class="northwoods-reveal">
        <path class="northwoods-folder-back" d="M172 153h213l47 52h296v300H172Z"/>
        <path class="northwoods-folder-tab" d="M238 92h202l44 61H238Z"/>
        <path class="northwoods-paper" d="m239 193 399-21 25 275-399 24Z"/>
        <path class="northwoods-map" d="M312 263c48-45 99 36 150-8 53-45 106 34 151-12M334 363l79-55 69 50 82-59"/>
        <g class="northwoods-targets"><circle cx="311" cy="263" r="27"/><circle cx="462" cy="255" r="27"/><circle cx="613" cy="243" r="27"/></g>
        <g class="northwoods-stamp"><rect x="348" y="374" width="221" height="62" rx="8"/><path d="M377 397h163M391 417h135"/></g>
      </g>
    </g>`;

  container.replaceChildren(svg);
  return svg;
}
