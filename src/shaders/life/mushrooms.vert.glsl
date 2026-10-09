// Parche de los hongos (vértice), jornada 8. Cada hongo asoma cuando `hongos`
// supera su umbral (atributo por instancia): crece desde el suelo, con un
// pequeño rebote. La altura local (0 pie → 1 sombrero) la usa el fragmento.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float aThreshold;
attribute float aPhase;
uniform float uMushrooms;
varying float vHeight;
varying float vPhase;
//#main
vHeight = position.y;
vPhase = aPhase;
{
  float t = smoothstep(aThreshold, aThreshold + 0.12, uMushrooms);
  // Rebote: pasa de 1 y vuelve (sombrero que se abre).
  float grow = t * (1.0 + 0.18 * sin(t * 3.14159));
  transformed *= grow;
}
