#!/usr/bin/env python3
"""Vendor Pavel Dobryakov's MIT fluid sim (fluid-src.js) into a drivable fluid.js:
strip the promo popup / app-store links / dat.gui, point it at our own canvas,
add a hard stop flag, and tune the config defaults for muted gold smoke.
Idempotent string surgery — re-runnable from the pristine source."""
import re, sys

src = open("fluid-src.js").read()

# 0) stub Google Analytics — the sim peppers ga() calls (incl. during WebGL init)
#    and an undefined `ga` throws and aborts initialization on our page.
src = "var ga = (typeof window!=='undefined' && window.ga) ? window.ga : function(){};\n" + src

# 1) remove the promo popup + app-store link block (DOM that doesn't exist on our page)
start = src.index("const promoPopup")
end = src.index("// Simulation section")
src = src[:start] + src[end:]

# 2) bind to our injected canvas instead of the first <canvas> on the page
src = src.replace(
    "const canvas = document.getElementsByTagName('canvas')[0];",
    "const canvas = document.getElementById('smoke-fx-canvas');",
)

# 3) drop the dat.gui panel (the lib isn't loaded)
src = src.replace("\nstartGUI();\n", "\n")

# 4) hard stop: let the controller kill the rAF loop after a transition
src = src.replace(
    "function update () {\n    const dt = calcDeltaTime();",
    "function update () {\n    if (window.__SMOKE_STOP) return;\n    const dt = calcDeltaTime();",
)

# 4b) suppress the initial random smoke burst on load (we emit only on trigger)
src = src.replace("multipleSplats(parseInt(Math.random() * 20) + 5);\n", "")

# 5) tune defaults for muted, billowing smoke over a transparent background
tweaks = {
    "DENSITY_DISSIPATION: 1,": "DENSITY_DISSIPATION: 1.5,",
    "VELOCITY_DISSIPATION: 0.2,": "VELOCITY_DISSIPATION: 0.9,",
    "CURL: 30,": "CURL: 24,",
    "SPLAT_RADIUS: 0.25,": "SPLAT_RADIUS: 0.32,",
    "COLORFUL: true,": "COLORFUL: false,",
    "BLOOM: true,": "BLOOM: false,",
    "SUNRAYS: true,": "SUNRAYS: false,",
    # the sim draws a FAKE checkerboard as its transparency preview — kill it.
    "drawCheckerboard(target);": "void target;",
}
for a, b in tweaks.items():
    assert a in src, f"tweak target missing: {a}"
    src = src.replace(a, b)

# 6) expose a small control surface (config is a `let`, not on window) so the
#    easter egg / page transitions can drive the sim.
src += ("\n// --- control surface for eating-egg.js / page transitions ---\n"
        "window.SmokeFX = { splat: splat, update: update, initFramebuffers: initFramebuffers, "
        "multipleSplats: multipleSplats, get config(){ return config; } };\n")

# 7) SMOKE-AS-TRANSITION: the smoke density is a reveal mask. A ping-pong buffer
#    accumulates the max coverage; a composite pass paints the NEW image over the
#    OLD one wherever the smoke has wafted, plus the gold smoke on top. Opaque
#    output (no transparent-canvas-over-DOM), so it renders cleanly everywhere.
src += r"""
(function () {
    var revealFrag = compileShader(gl.FRAGMENT_SHADER,
        'precision highp float; varying vec2 vUv; uniform sampler2D uPrev; uniform sampler2D uDye;' +
        'void main(){ vec3 c = texture2D(uDye, vUv).rgb; float a = clamp(max(c.r, max(c.g, c.b)) * 2.5, 0.0, 1.0);' +
        ' float p = texture2D(uPrev, vUv).r; gl_FragColor = vec4(max(p, a), 0.0, 0.0, 1.0); }');
    var compFrag = compileShader(gl.FRAGMENT_SHADER,
        'precision highp float; varying vec2 vUv; uniform sampler2D uOld; uniform sampler2D uNew; uniform sampler2D uReveal; uniform sampler2D uDye; uniform float uGlobal;' +
        'void main(){ vec2 iuv = vec2(vUv.x, 1.0 - vUv.y);' +
        ' float r = max(uGlobal, smoothstep(0.04, 0.5, texture2D(uReveal, vUv).r));' +
        ' vec3 oldC = texture2D(uOld, iuv).rgb; vec3 newC = texture2D(uNew, iuv).rgb;' +
        ' vec3 base = mix(oldC, newC, r); vec3 smoke = texture2D(uDye, vUv).rgb;' +
        ' float a = clamp(max(smoke.r, max(smoke.g, smoke.b)) * 5.0, 0.0, 1.0);' +
        ' gl_FragColor = vec4(base * (1.0 - a) + smoke, 1.0); }');  // over-blend (muted veil), not additive white
    var revealProgram = new Program(baseVertexShader, revealFrag);
    var compProgram = new Program(baseVertexShader, compFrag);
    var revealFBO = null, texOld = null, texNew = null, transition = false, globalReveal = 0;

    function ensureFBO() {
        if (revealFBO) return;
        var res = getResolution(config.DYE_RESOLUTION);
        var f = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        revealFBO = createDoubleFBO(res.width, res.height, ext.formatRGBA.internalFormat, ext.formatRGBA.format, ext.halfFloatTexType, f);
    }
    function clearReveal() {
        ensureFBO();
        [revealFBO.read, revealFBO.write].forEach(function (fb) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb.fbo);
            gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        });
    }

    var origRender = render;
    render = function (target) {
        if (!transition || target != null) { origRender(target); return; }
        ensureFBO();
        gl.disable(gl.BLEND);
        // accumulate reveal = max(prev, smoke amount)
        revealProgram.bind();
        gl.uniform1i(revealProgram.uniforms.uPrev, revealFBO.read.attach(0));
        gl.uniform1i(revealProgram.uniforms.uDye, dye.read.attach(1));
        blit(revealFBO.write);
        revealFBO.swap();
        // composite old -> new by the reveal mask, smoke on top, to the screen (opaque)
        compProgram.bind();
        gl.uniform1i(compProgram.uniforms.uOld, texOld.attach(0));
        gl.uniform1i(compProgram.uniforms.uNew, texNew.attach(1));
        gl.uniform1i(compProgram.uniforms.uReveal, revealFBO.read.attach(2));
        gl.uniform1i(compProgram.uniforms.uDye, dye.read.attach(3));
        gl.uniform1f(compProgram.uniforms.uGlobal, globalReveal);
        blit(null);
    };

    window.SmokeFX.beginTransition = function (oldUrl, newUrl) {
        texOld = createTextureAsync(oldUrl);
        texNew = createTextureAsync(newUrl);
        globalReveal = 0;
        clearReveal();
        transition = true;
    };
    // ramp the whole frame to the new page (0..1) so the transition always
    // completes cleanly, even where the smoke didn't waft.
    window.SmokeFX.setGlobalReveal = function (v) { globalReveal = Math.max(0, Math.min(1, v)); };
    window.SmokeFX.endTransition = function () { transition = false; };
})();
"""

open("fluid.js", "w").write(src)
print("wrote fluid.js (%d lines)" % src.count(chr(10)))
