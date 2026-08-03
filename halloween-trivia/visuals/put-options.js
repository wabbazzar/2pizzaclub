const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderPutOptions(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract options ledger with a sharply falling market chart inside an evidence aperture",
    "data-visual": "put-options",
  });

  svg.innerHTML = `
    <g class="aperture" aria-hidden="true">
      <path class="aperture-wedge" d="M450 300 40 48 270 18Z"/><path class="aperture-wedge" d="M450 300 316 0 498 0Z"/>
      <path class="aperture-wedge" d="M450 300 555 0 852 58Z"/><path class="aperture-wedge" d="M450 300 900 120 900 318Z"/>
      <path class="aperture-wedge" d="M450 300 884 425 708 600Z"/><path class="aperture-wedge" d="M450 300 620 600 390 600Z"/>
      <path class="aperture-wedge" d="M450 300 320 600 42 550Z"/><path class="aperture-wedge" d="M450 300 0 430 0 185Z"/>
    </g>
    <g class="put-options-object" aria-hidden="true">
      <path class="put-options-shadow" d="M160 75h580v450H160Zm75 112h420v60H235Zm0 116h420v60H235Zm0 116h420v60H235ZM253 159l92 64 83-34 89 98 151-164-68 232-61-42-91 116-89-104-118 65Z"/>
      <g class="put-options-reveal">
        <path class="put-options-sheet" d="M160 75h580v450H160Z"/>
        <g class="put-options-grid"><path d="M235 151h420M235 247h420M235 343h420M235 439h420M315 125v354M425 125v354M535 125v354"/></g>
        <path class="put-options-call-line" d="m245 373 85-76 84 27 78-101 77 41"/>
        <g class="put-options-put-line"><path d="m245 206 91 37 78-30 82 91 94 67"/><path d="m562 326 28 45-52 9"/></g>
        <g class="put-options-tally"><rect x="548" y="112" width="132" height="67" rx="9"/><path d="M572 136h84M572 157h55"/></g>
      </g>
    </g>`;

  container.replaceChildren(svg);
  return svg;
}
