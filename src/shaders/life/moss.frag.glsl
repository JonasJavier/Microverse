// Parche del musgo (fragmento), jornada 11b · Realismo. Cada almohadilla era un
// poliedro de un solo color: de cerca, confeti. Ahora la base se oscurece (la
// luz no entra entre las almohadillas: oclusión propia) y el grano rompe el
// color plano. La oclusión de pantalla (N8AO) hace el resto entre vecinas.
// Jornada 17: relieve fino (pelusa) sobre la normal suave del vértice.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vPadHeight;
uniform float uDetail;
//#color
{
  float occlusion = smoothstep(-0.9, 0.7, vPadHeight);
  diffuseColor.rgb *= mix(0.5, 1.04, occlusion);
  float grain = surfNoise(vSurfPos * 180.0);
  diffuseColor.rgb *= mix(1.0, 0.86 + 0.28 * grain, uDetail);
}
//#normal
{
  // Pelusa: un relieve de celda más pequeña que la almohadilla, que la luz
  // rasante revela como textura en vez de como superficie lisa.
  float h = 0.0009 * (surfFbm(vSurfPos * 320.0) + 0.3 * surfNoise(vSurfPos * 900.0));
  normal = surfBump(-vViewPosition, normal, h * uDetail);
}
