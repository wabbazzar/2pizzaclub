const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderLease(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract lease, key, and skyline illustration framed by an evidence aperture",
    "data-visual": "lease",
  });

  svg.innerHTML = `
    <g class="aperture" aria-hidden="true">
      <path class="aperture-wedge" d="M450 300 40 48 270 18Z" />
      <path class="aperture-wedge" d="M450 300 316 0 498 0Z" />
      <path class="aperture-wedge" d="M450 300 555 0 852 58Z" />
      <path class="aperture-wedge" d="M450 300 900 120 900 318Z" />
      <path class="aperture-wedge" d="M450 300 884 425 708 600Z" />
      <path class="aperture-wedge" d="M450 300 620 600 390 600Z" />
      <path class="aperture-wedge" d="M450 300 320 600 42 550Z" />
      <path class="aperture-wedge" d="M450 300 0 430 0 185Z" />
    </g>
    <g class="lease-sparks" aria-hidden="true">
      <path d="m130 180 58-38 18 72Z" />
      <path d="m716 126 48 58-74 9Z" />
      <path d="m728 424 64 18-50 54Z" />
    </g>
    <g class="lease-object" aria-hidden="true">
      <path class="lease-shadow" d="M252 86h344l58 61v325H252ZM559 86v77h95M196 414h512v96H196ZM305 274h70v140h-70Zm110-82h70v222h-70Zm110 42h70v180h-70ZM571 340a68 68 0 1 0 0 136 68 68 0 0 0 0-136Zm66 68h132v39h-43v41h-42v-41h-47Z" />
      <g class="lease-reveal">
        <path class="lease-paper" d="M252 86h307l95 95v291H252Z" />
        <path class="lease-fold" d="M559 86v95h95" />
        <path class="lease-heading" d="M309 166h183M309 214h263M309 254h220" />
        <g class="lease-skyline">
          <path d="M278 414h350v58H278Z" />
          <path d="M305 274h70v140h-70Z" />
          <path d="M415 192h70v222h-70Z" />
          <path d="M525 234h70v180h-70Z" />
          <path d="M334 297v90M444 216v171M554 258v129" />
        </g>
        <g class="lease-key">
          <circle cx="571" cy="408" r="68" />
          <circle cx="571" cy="408" r="25" />
          <path d="M637 408h132v39h-43v41h-42v-41h-47Z" />
        </g>
        <path class="lease-signature" d="M309 329c42-42 57 54 91 4 24-37 40 26 71-8 20-22 44 14 66-2" />
      </g>
    </g>
  `;

  container.replaceChildren(svg);
  return svg;
}
