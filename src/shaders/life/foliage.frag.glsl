// Parche del follaje (fragmento): cuando el frente de encendido pasa por una
// rama, sus mechones se iluminan con un destello cálido que se apaga. Como cada
// nube está a otra distancia de la semilla, la copa se enciende rama a rama.
// Usa shaders/life/signals.glsl.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vDistance;
uniform float uFoliageFlash;
//#emissive
if (uIgnition >= 0.0) {
  float x = (uIgnition - vDistance) / 0.12;
  totalEmissiveRadiance += uSolColor * exp(-x * x) * uFoliageFlash;
}
