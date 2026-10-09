// Parche del follaje (fragmento). Marchitez (jornada 7): la copa seca pierde el
// verde hacia un tono de hoja seca. Encendido (jornada 6): cuando el frente pasa
// por una rama, sus mechones destellan con luz cálida; como cada nube está a otra
// distancia de la semilla, la copa se enciende nube a nube. Floración (jornada
// 10): unos pocos mechones se vuelven flores Sol cuando el mundo está pleno y,
// del todo, en la Sincronía. Usa shaders/life/signals.glsl.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vDistance;
uniform float uFoliageFlash;
uniform float uWilt;
uniform float uBloom;
uniform vec3 uDryColor;
float flower;
//#color
{
  float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  diffuseColor.rgb = mix(diffuseColor.rgb, uDryColor * (0.55 + 1.2 * luma), uWilt * 0.6);
  // Qué mechones florecen: un hash estable de su distancia (cada mechón, la suya).
  float pick = fract(sin(vDistance * 912.37) * 43758.5453);
  flower = step(0.92, pick) * smoothstep(0.0, 0.6, uBloom);
  diffuseColor.rgb = mix(diffuseColor.rgb, uSolColor * 0.8, flower * 0.6);
}
//#emissive
if (uIgnition >= 0.0) {
  float x = (uIgnition - vDistance) / 0.12;
  totalEmissiveRadiance += uSolColor * exp(-x * x) * uFoliageFlash;
}
totalEmissiveRadiance += uSolColor * flower * (0.3 + 0.8 * uSync);
