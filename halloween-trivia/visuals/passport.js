const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderPassport(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract passport illustration framed by an evidence aperture",
    "data-visual": "passport",
  });

  svg.innerHTML = `
    <g class="aperture" aria-hidden="true">
      <path class="aperture-wedge aperture-wedge--one" d="M450 300 40 48 270 18Z" />
      <path class="aperture-wedge aperture-wedge--two" d="M450 300 316 0 498 0Z" />
      <path class="aperture-wedge aperture-wedge--three" d="M450 300 555 0 852 58Z" />
      <path class="aperture-wedge aperture-wedge--four" d="M450 300 900 120 900 318Z" />
      <path class="aperture-wedge aperture-wedge--five" d="M450 300 884 425 708 600Z" />
      <path class="aperture-wedge aperture-wedge--six" d="M450 300 620 600 390 600Z" />
      <path class="aperture-wedge aperture-wedge--seven" d="M450 300 320 600 42 550Z" />
      <path class="aperture-wedge aperture-wedge--eight" d="M450 300 0 430 0 185Z" />
    </g>
    <g class="paper-debris" aria-hidden="true">
      <path d="M128 128 214 102 232 172 164 202Z" />
      <path d="m710 148 92 42-45 74-78-31Z" />
      <path d="m108 398 110-33 20 86-89 39Z" />
      <path d="m700 408 104-21 14 74-123 28Z" />
    </g>
    <g class="passport-object" aria-hidden="true">
      <path class="passport-shadow" d="M325 100 586 127 559 508 298 480Z" />
      <g class="passport-reveal">
        <path class="passport-cover" d="M325 100 586 127 559 508 298 480Z" />
        <path class="passport-spine" d="m352 107-27-7-27 380 29 3Z" />
        <circle class="passport-seal" cx="443" cy="275" r="76" />
        <path class="passport-seal-lines" d="M379 275h128M443 211c-42 38-42 90 0 128M443 211c42 38 42 90 0 128M390 237c32 22 76 24 108 3M386 312c36-19 78-17 108 6" />
        <path class="passport-title-line" d="M383 166h137M373 395h144M383 427h124" />
        <g class="passport-stamp">
          <circle cx="526" cy="420" r="47" />
          <path d="m488 442 73-43M495 457l72-43" />
        </g>
      </g>
    </g>
  `;

  container.replaceChildren(svg);
  return svg;
}
