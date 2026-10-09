// Parche del follaje (fragmento). Marchitez (jornada 7): la copa seca pierde el
// verde hacia un tono de hoja seca. Encendido (jornada 6): cuando el frente pasa
// por una rama, sus mechones destellan con luz cálida; como cada nube está a otra
// distancia de la semilla, la copa se enciende nube a nube.
// Usa shaders/life/signals.glsl.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vDistance;
uniform float uFoliageFlash;
uniform float uWilt;
uniform vec3 uDryColor;
//#color
{
  float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  diffuseColor.rgb = mix(diffuseColor.rgb, uDryColor * (0.55 + 1.2 * luma), uWilt * 0.6);
}
//#emissive
if (uIgnition >= 0.0) {
  float x = (uIgnition - vDistance) / 0.12;
  totalEmissiveRadiance += uSolColor * exp(-x * x) * uFoliageFlash;
}
