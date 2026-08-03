const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderDartPistol(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract cutaway pistol and tiny laboratory dart inside an evidence aperture",
    "data-visual": "dart-pistol",
  });

  svg.innerHTML = `
    <g class="aperture" aria-hidden="true">
      <path class="aperture-wedge" d="M450 300 40 48 270 18Z"/><path class="aperture-wedge" d="M450 300 316 0 498 0Z"/>
      <path class="aperture-wedge" d="M450 300 555 0 852 58Z"/><path class="aperture-wedge" d="M450 300 900 120 900 318Z"/>
      <path class="aperture-wedge" d="M450 300 884 425 708 600Z"/><path class="aperture-wedge" d="M450 300 620 600 390 600Z"/>
      <path class="aperture-wedge" d="M450 300 320 600 42 550Z"/><path class="aperture-wedge" d="M450 300 0 430 0 185Z"/>
    </g>
    <g class="dart-pistol-object" aria-hidden="true">
      <path class="dart-pistol-shadow" d="M127 198h587l62 62-62 91H492l39 169H350l-78-169H127Zm145 153 76 1 55 168h-53Z"/>
      <g class="dart-pistol-reveal">
        <path class="dart-pistol-body" d="M127 198h587l62 62-62 91H127Z"/>
        <path class="dart-pistol-grip" d="M303 351h177l51 169H350Z"/>
        <path class="dart-pistol-cutaway" d="M190 239h493v68H190Z"/>
        <path class="dart-pistol-trigger" d="M351 351c0 82 105 83 120 0"/>
        <g class="dart-pistol-dart"><path d="M210 273h377"/><path d="m587 273-69-35v70Z"/><path d="m210 273 47-27v54Z"/></g>
        <g class="dart-pistol-vial"><rect x="614" y="225" width="74" height="97" rx="12"/><path d="M630 247h42M630 270h42"/></g>
      </g>
    </g>`;

  container.replaceChildren(svg);
  return svg;
}
