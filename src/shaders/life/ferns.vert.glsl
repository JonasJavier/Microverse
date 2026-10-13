// Parche de los helechos (vértice), jornada 16. Cada helecho brota cuando la
// condición del mundo (sombra húmeda: uFerns) supera su umbral, y se mece con
// un vaivén propio, más en la punta de las frondas.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float aThreshold;
attribute float aPhase;
uniform float uFerns;
uniform float uTime;
varying float vFrond;
//#main
{
  float grown = smoothstep(aThreshold, aThreshold + 0.15, uFerns);
  vFrond = transformed.y;
  float sway = sin(uTime * 1.1 + aPhase * 6.2831) * 0.08 * transformed.y;
  transformed.x += sway;
  transformed *= grown;
}
