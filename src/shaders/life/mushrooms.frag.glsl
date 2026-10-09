// Parche de los hongos (fragmento), jornada 8. Pie y sombrero de color distinto
// según la altura local; el sombrero brilla con Vida de noche (`uMushroomGlow`),
// más por debajo (las láminas) y con una respiración lenta propia de cada hongo.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
uniform float uMushroomGlow;
uniform float uTime;
uniform vec3 uCapColor;
uniform vec3 uVidaColor;
varying float vHeight;
varying float vPhase;
//#color
{
  float cap = smoothstep(0.42, 0.72, vHeight);
  diffuseColor.rgb = mix(diffuseColor.rgb, uCapColor, cap);
}
//#emissive
{
  float cap = smoothstep(0.4, 0.75, vHeight);
  // Láminas: la cara inferior del sombrero mira hacia abajo.
  float gills = 0.5 + 0.5 * clamp(-normal.y * 1.5, 0.0, 1.0);
  float breath = 0.8 + 0.2 * sin(uTime * 0.7 + vPhase * 6.2831);
  totalEmissiveRadiance += uVidaColor * uMushroomGlow * cap * gills * breath;
}
