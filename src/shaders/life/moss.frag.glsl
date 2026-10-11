// Parche del musgo (fragmento), jornada 11b · Realismo. Cada almohadilla era un
// poliedro de un solo color: de cerca, confeti. Ahora la base se oscurece (la
// luz no entra entre las almohadillas: oclusión propia) y el grano rompe el
// color plano. La oclusión de pantalla (N8AO) hace el resto entre vecinas.
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
