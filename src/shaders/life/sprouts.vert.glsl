// Parche de los brotes (vértice), jornada 7. Cada brote asoma cuando la vitalidad
// supera su umbral (atributo por instancia): primero cerca de la semilla, después
// hacia fuera. Marchitos, se encogen y se abren hacia los lados.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float aThreshold;
uniform float uVital;
uniform float uWilt;
//#main
{
  float grown = smoothstep(aThreshold, aThreshold + 0.12, uVital);
  transformed.xz *= 1.0 + 0.9 * uWilt * transformed.y;
  transformed.y *= 1.0 - 0.4 * uWilt;
  transformed *= grown;
}
