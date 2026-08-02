const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

export function renderMkultra(container) {
  const svg = svgElement("svg", {
    viewBox: "0 0 900 600",
    role: "img",
    "aria-label": "An original abstract laboratory vial and watchful eye illustration framed by an evidence aperture",
    "data-visual": "mkultra",
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
    <g class="mkultra-bubbles" aria-hidden="true">
      <circle cx="214" cy="142" r="24" />
      <circle cx="686" cy="164" r="38" />
      <circle cx="735" cy="390" r="20" />
      <circle cx="178" cy="426" r="34" />
    </g>
    <g class="mkultra-object" aria-hidden="true">
      <path class="mkultra-shadow" d="M352 74h196v74l-35 50v54c87 31 145 91 171 133-44 69-124 116-234 116s-190-47-234-116c26-42 84-102 171-133v-54l-35-50Zm98 202c-78 0-141 49-177 109 36 60 99 109 177 109s141-49 177-109c-36-60-99-109-177-109Zm0 47a62 62 0 1 1 0 124 62 62 0 0 1 0-124Z" />
      <g class="mkultra-reveal">
        <path class="mkultra-vial" d="M352 74h196v74l-35 50v254c0 33-27 60-60 60h-6c-33 0-60-27-60-60V198l-35-50Z" />
        <path class="mkultra-cap" d="M342 74h216v77H342Z" />
        <path class="mkultra-liquid" d="M387 286h126v166c0 33-27 60-60 60h-6c-33 0-60-27-60-60Z" />
        <path class="mkultra-label" d="M367 215h166v116H367Z" />
        <path class="mkultra-label-lines" d="M398 250h104M398 282h68" />
        <g class="mkultra-eye">
          <path d="M216 385c44-69 124-116 234-116s190 47 234 116c-44 69-124 116-234 116s-190-47-234-116Z" />
          <circle cx="450" cy="385" r="75" />
          <circle cx="450" cy="385" r="31" />
          <path d="M450 269v-53M450 554v-53M292 289l-39-39M647 520l-39-39M608 289l39-39M253 520l39-39" />
        </g>
      </g>
    </g>
  `;

  container.replaceChildren(svg);
  return svg;
}
