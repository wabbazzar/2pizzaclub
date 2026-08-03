const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderPaperclip(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract personnel file clipped to a rising rocket inside an evidence aperture",
    "data-visual": "paperclip",
  });

  svg.innerHTML = `
    <g class="aperture" aria-hidden="true">
      <path class="aperture-wedge" d="M450 300 40 48 270 18Z"/><path class="aperture-wedge" d="M450 300 316 0 498 0Z"/>
      <path class="aperture-wedge" d="M450 300 555 0 852 58Z"/><path class="aperture-wedge" d="M450 300 900 120 900 318Z"/>
      <path class="aperture-wedge" d="M450 300 884 425 708 600Z"/><path class="aperture-wedge" d="M450 300 620 600 390 600Z"/>
      <path class="aperture-wedge" d="M450 300 320 600 42 550Z"/><path class="aperture-wedge" d="M450 300 0 430 0 185Z"/>
    </g>
    <g class="paperclip-object" aria-hidden="true">
      <path class="paperclip-shadow" d="M130 112h430l65 70v338H130ZM585 72c112 68 153 183 93 297l-62-42-71 111-53-93 61-104-61-42c31-59 48-94 93-127ZM520 404l-54 119 91-65 63 81 15-126Z"/>
      <g class="paperclip-reveal">
        <path class="paperclip-folder" d="M130 112h430l65 70v338H130Z"/>
        <path class="paperclip-fold" d="M560 112v70h65"/>
        <g class="paperclip-profile"><circle cx="288" cy="272" r="69"/><path d="M184 444c17-77 56-116 104-116s87 39 104 116Z"/></g>
        <path class="paperclip-lines" d="M408 244h149M408 286h117M408 328h149M408 370h99M408 412h132"/>
        <path class="paperclip-wire" d="M207 178c-68-78 91-147 118-53 18 65-92 141-131 83-31-46 45-104 74-64 21 29-23 65-48 53"/>
        <g class="paperclip-rocket"><path d="M585 72c112 68 153 183 93 297l-62-42-71 111-53-93 61-104-61-42c31-59 48-94 93-127Z"/><circle cx="606" cy="205" r="42"/><path d="m520 404-54 119 91-65 63 81 15-126Z"/></g>
      </g>
    </g>`;

  container.replaceChildren(svg);
  return svg;
}
