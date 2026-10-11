// Parche de la corteza (fragmento): las señales siguen subiendo por el tronco
// como luz bajo la corteza (más en los bordes), y la chispa del encendido trepa
// hasta las ramas. Usa shaders/life/signals.glsl y surface.glsl.
// Jornada 11b · Realismo: la corteza era plástico liso. Ahora tiene grietas
// verticales (ruido estirado a lo largo del tronco) que oscurecen el albedo y
// perturban la normal, y una rugosidad que varía con ellas. `uDetail` lo apaga.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vDistance;
uniform float uBarkPulse;
uniform float uSparkGain;
uniform float uDetail;
float barkCrack;
//#color
{
  // Estirado en y: las grietas corren a lo largo del tronco, no en manchas.
  vec3 p = vec3(vSurfPos.x * 70.0, vSurfPos.y * 14.0, vSurfPos.z * 70.0);
  barkCrack = surfFbm(p);
  float fine = surfNoise(vSurfPos * 260.0);
  diffuseColor.rgb *= mix(1.0, 0.62 + 0.55 * barkCrack + 0.12 * fine, uDetail);
}
//#roughness
roughnessFactor *= mix(1.0, 0.85 + 0.25 * barkCrack, uDetail);
//#normal
{
  vec3 p = vec3(vSurfPos.x * 70.0, vSurfPos.y * 14.0, vSurfPos.z * 70.0);
  float h = 0.0022 * (surfFbm(p) + 0.4 * surfNoise(vSurfPos * 260.0));
  normal = surfBump(-vViewPosition, normal, h * uDetail);
}
//#emissive
{
  float lit = signalLit(vDistance);
  float facing = abs(dot(normal, normalize(vViewPosition)));
  float vein = 0.3 + 0.7 * pow(1.0 - facing, 1.5);
  totalEmissiveRadiance += uVidaColor * signalPulse(vDistance, 0.5) * lit * uLife * uBarkPulse * vein;
  totalEmissiveRadiance += uSolColor * signalSpark(vDistance) * uSparkGain;
}
