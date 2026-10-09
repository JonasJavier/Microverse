// Luciérnagas (acto 03 · Transform). Una instancia por luciérnaga: un punto que
// vuela despacio alrededor de su origen (suma de senos: sin tablas de ruido) y
// parpadea a su ritmo. Billboard esférico. En la Sincronía, todas convergen a
// la misma fase (`uSync`). Solo vuelan las que su umbral deja (`uFireflies`).
attribute vec4 aHome; // x, y, z, radio de vuelo
attribute vec4 aSeed; // fase, velocidad, ritmo de parpadeo, umbral
uniform float uTime;
uniform float uFireflies;
uniform float uSync;
uniform float uSize;
varying float vGlow;
varying vec2 vUv;

void main() {
  float t = uTime * aSeed.y + aSeed.x * 100.0;
  vec3 flight = vec3(
    sin(t * 1.3) + 0.5 * sin(t * 2.9 + 1.7),
    0.6 * sin(t * 0.9 + 0.4) + 0.3 * sin(t * 2.3),
    cos(t * 1.1 + 2.1) + 0.5 * cos(t * 2.6)
  ) * aHome.w * 0.6;
  vec3 world = aHome.xyz + flight;

  // Parpadeo: la mayor parte del tiempo apagada, destellos suaves. En la
  // Sincronía, la fase propia cede a una común.
  float ownPhase = uTime * aSeed.z + aSeed.x * 6.2831;
  float commonPhase = uTime * 0.6;
  float phase = mix(ownPhase, commonPhase, uSync);
  float blink = pow(0.5 + 0.5 * sin(phase), 5.0);
  // (`active` es palabra reservada en GLSL.)
  float flying = smoothstep(aSeed.w, aSeed.w + 0.1, uFireflies);
  vGlow = flying * (0.08 + 0.92 * blink);
  vUv = position.xy;

  vec4 view = viewMatrix * vec4(world, 1.0);
  view.xy += position.xy * uSize * (0.75 + 0.25 * blink);
  gl_Position = projectionMatrix * view;
}
