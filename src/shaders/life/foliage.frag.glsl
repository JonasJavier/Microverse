// Parche del follaje (fragmento). Marchitez (jornada 7): la copa seca pierde el
// verde hacia un tono de hoja seca. Encendido (jornada 6): cuando el frente pasa
// por una rama, sus mechones destellan con luz cálida; como cada nube está a otra
// distancia de la semilla, la copa se enciende nube a nube. Floración (jornada
// 10): unos pocos mechones se vuelven flores Sol cuando el mundo está pleno y,
// del todo, en la Sincronía. Jornada 11b: la base de cada mechón se oscurece
// (oclusión propia), así la nube tiene volumen también de cerca. Jornada 17:
// grano de hojas sobre la normal suave de nube. Usa signals.glsl y surface.glsl.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vDistance;
varying float vTuftHeight;
uniform float uDetail;
uniform float uFoliageFlash;
uniform float uWilt;
uniform float uBloom;
uniform vec3 uDryColor;
// Estaciones (jornada 15): la copa vira a ámbar en otoño y palidece en invierno.
uniform float uSeason;
uniform vec3 uOtonoColor;
uniform vec3 uInviernoColor;
float flower;
//#color
{
  float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  float otono = exp(-pow((uSeason - 0.5) / 0.13, 2.0));
  float invierno = exp(-pow((uSeason - 0.75) / 0.12, 2.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, uOtonoColor * (0.45 + 1.1 * luma), otono * 0.8);
  diffuseColor.rgb = mix(diffuseColor.rgb, uInviernoColor * (0.45 + 1.1 * luma), invierno * 0.65);
  diffuseColor.rgb = mix(diffuseColor.rgb, uDryColor * (0.55 + 1.2 * luma), uWilt * 0.6);
  diffuseColor.rgb *= mix(0.62, 1.05, smoothstep(-1.0, 0.8, vTuftHeight));
  // Grano (jornada 17): con la normal de nube el mechón quedaría liso; unas
  // motas del tamaño de una hoja devuelven la textura sin geometría.
  float grain = surfNoise(vSurfPos * 160.0);
  diffuseColor.rgb *= mix(1.0, 0.8 + 0.4 * grain, uDetail);
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
