// Parche de los hongos (fragmento), jornada 8. Pie y sombrero de color distinto
// según la altura local; el sombrero brilla con Vida de noche (`uMushroomGlow`),
// más por debajo (las láminas) y con una respiración lenta propia de cada hongo.
// Jornada 17: el tono por hongo (`vTone`) oscurece unos sombreros hacia el pie
// y apaga parte de su brillo: pocos faros, muchos hongos. La semilla sigue
// siendo lo más luminoso del suelo.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
uniform float uMushroomGlow;
uniform float uTime;
uniform vec3 uCapColor;
uniform vec3 uVidaColor;
varying float vHeight;
varying float vPhase;
varying float vTone;
//#color
{
  float cap = smoothstep(0.42, 0.72, vHeight);
  // Sombrero: del pálido hueso (tono 1) a un pardo cercano al pie (tono 0).
  vec3 capColor = mix(diffuseColor.rgb * 0.9, uCapColor, 0.35 + 0.65 * vTone);
  diffuseColor.rgb = mix(diffuseColor.rgb, capColor, cap);
}
//#emissive
{
  float cap = smoothstep(0.4, 0.75, vHeight);
  // Láminas: la cara inferior del sombrero mira hacia abajo.
  float gills = 0.5 + 0.5 * clamp(-normal.y * 1.5, 0.0, 1.0);
  float breath = 0.8 + 0.2 * sin(uTime * 0.7 + vPhase * 6.2831);
  float vigor = 0.35 + 0.95 * vTone * vTone;
  totalEmissiveRadiance += uVidaColor * uMushroomGlow * cap * gills * breath * vigor;
}
