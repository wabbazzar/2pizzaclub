const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderCointelpro(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract surveillance tape and anonymous letter package inside an evidence aperture",
    "data-visual": "cointelpro",
  });

  svg.innerHTML = `
    <g class="aperture" aria-hidden="true">
      <path class="aperture-wedge" d="M450 300 40 48 270 18Z"/><path class="aperture-wedge" d="M450 300 316 0 498 0Z"/>
      <path class="aperture-wedge" d="M450 300 555 0 852 58Z"/><path class="aperture-wedge" d="M450 300 900 120 900 318Z"/>
      <path class="aperture-wedge" d="M450 300 884 425 708 600Z"/><path class="aperture-wedge" d="M450 300 620 600 390 600Z"/>
      <path class="aperture-wedge" d="M450 300 320 600 42 550Z"/><path class="aperture-wedge" d="M450 300 0 430 0 185Z"/>
    </g>
    <g class="cointelpro-object" aria-hidden="true">
      <path class="cointelpro-shadow" d="M119 117h662v387H119Zm80 55 251 143 251-143v274H199ZM212 242a88 88 0 1 0 176 0 88 88 0 0 0-176 0Zm300 0a88 88 0 1 0 176 0 88 88 0 0 0-176 0Z"/>
      <g class="cointelpro-reveal">
        <path class="cointelpro-envelope" d="M199 172h502v274H199Z"/>
        <path class="cointelpro-envelope-fold" d="m199 172 251 143 251-143M199 446l179-173M701 446 522 273"/>
        <path class="cointelpro-letter" d="m273 93 401 47-39 335-401-47Z"/>
        <path class="cointelpro-letter-lines" d="m320 174 278 33M313 226l231 27M307 278l279 33M300 330l177 21"/>
        <g class="cointelpro-stamp"><rect x="447" y="354" width="159" height="66" rx="8"/><path d="M473 378h105M486 399h79"/></g>
        <g class="cointelpro-tape"><circle cx="257" cy="191" r="78"/><circle cx="257" cy="191" r="27"/><circle cx="631" cy="235" r="78"/><circle cx="631" cy="235" r="27"/><path d="M257 269c90 86 219 21 374 44 54 8 89 42 108 88"/></g>
      </g>
    </g>`;

  container.replaceChildren(svg);
  return svg;
}
