const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderKirkBallistics(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract split ballistics comparison with an unresolved center mark inside an evidence aperture",
    "data-visual": "kirk-ballistics",
  });

  svg.innerHTML = `
    <g class="aperture" aria-hidden="true">
      <path class="aperture-wedge" d="M450 300 40 48 270 18Z"/><path class="aperture-wedge" d="M450 300 316 0 498 0Z"/>
      <path class="aperture-wedge" d="M450 300 555 0 852 58Z"/><path class="aperture-wedge" d="M450 300 900 120 900 318Z"/>
      <path class="aperture-wedge" d="M450 300 884 425 708 600Z"/><path class="aperture-wedge" d="M450 300 620 600 390 600Z"/>
      <path class="aperture-wedge" d="M450 300 320 600 42 550Z"/><path class="aperture-wedge" d="M450 300 0 430 0 185Z"/>
    </g>
    <g class="kirk-ballistics-object" aria-hidden="true">
      <path class="kirk-ballistics-shadow" d="M102 105h288v390H102Zm408 0h288v390H510ZM385 231c0-82 130-105 168-29 47 95-73 111-73 179h-70c0-103 97-117 75-162-13-27-50-15-50 12Zm24 183h73v73h-73Z"/>
      <g class="kirk-ballistics-reveal">
        <path class="kirk-ballistics-panel" d="M102 105h288v390H102ZM510 105h288v390H510Z"/>
        <g class="kirk-ballistics-fragment"><path d="m169 190 63-37 78 29 31 91-47 117-105-16-52-91Z"/><path d="m181 219 111 124M166 273l118 77M218 175l99 121"/></g>
        <g class="kirk-ballistics-barrel"><ellipse cx="654" cy="294" rx="104" ry="143"/><ellipse cx="654" cy="294" rx="64" ry="102"/><path d="M589 205c62 34 76 133 20 188M633 161c73 60 92 213 22 279M690 171c63 73 70 203 2 255"/></g>
        <g class="kirk-ballistics-question"><path d="M385 231c0-82 130-105 168-29 47 95-73 111-73 179h-70c0-103 97-117 75-162-13-27-50-15-50 12"/><circle cx="445" cy="451" r="37"/></g>
        <path class="kirk-ballistics-divider" d="M450 87v426"/>
      </g>
    </g>`;

  container.replaceChildren(svg);
  return svg;
}
