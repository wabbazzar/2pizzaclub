const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderUssLiberty(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract intelligence ship crossed by incoming attack marks inside an evidence aperture",
    "data-visual": "uss-liberty",
  });

  svg.innerHTML = `
    <g class="aperture" aria-hidden="true">
      <path class="aperture-wedge" d="M450 300 40 48 270 18Z"/><path class="aperture-wedge" d="M450 300 316 0 498 0Z"/>
      <path class="aperture-wedge" d="M450 300 555 0 852 58Z"/><path class="aperture-wedge" d="M450 300 900 120 900 318Z"/>
      <path class="aperture-wedge" d="M450 300 884 425 708 600Z"/><path class="aperture-wedge" d="M450 300 620 600 390 600Z"/>
      <path class="aperture-wedge" d="M450 300 320 600 42 550Z"/><path class="aperture-wedge" d="M450 300 0 430 0 185Z"/>
    </g>
    <g class="uss-liberty-object" aria-hidden="true">
      <path class="uss-liberty-shadow" d="M93 368h727l-111 132H219Zm220-112h293l88 112H248Zm130-153h34v153h-34Zm17 49a85 85 0 1 1 0 170 85 85 0 0 1 0-170Z"/>
      <g class="uss-liberty-reveal">
        <path class="uss-liberty-hull" d="M93 368h727l-111 132H219Z"/>
        <path class="uss-liberty-deck" d="M248 256h358l84 112H208Z"/>
        <path class="uss-liberty-mast" d="M443 103h34v206h-34Z"/>
        <circle class="uss-liberty-dish" cx="460" cy="237" r="85"/>
        <path class="uss-liberty-rigging" d="M460 103 315 368M460 103l164 265M330 304h268"/>
        <g class="uss-liberty-waves"><path d="M128 531c57-34 112 34 169 0s112 34 169 0 112 34 169 0 112 34 169 0"/></g>
        <g class="uss-liberty-attack"><path d="m118 123 202 111M91 208l196 72M782 109 612 247"/><circle cx="331" cy="303" r="39"/></g>
      </g>
    </g>`;

  container.replaceChildren(svg);
  return svg;
}
