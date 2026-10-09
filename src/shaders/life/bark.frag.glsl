// Parche de la corteza (fragmento): las señales siguen subiendo por el tronco
// como luz bajo la corteza (más en los bordes), y la chispa del encendido trepa
// hasta las ramas. Usa shaders/life/signals.glsl.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vDistance;
uniform float uBarkPulse;
uniform float uSparkGain;
//#emissive
{
  float lit = signalLit(vDistance);
  float facing = abs(dot(normal, normalize(vViewPosition)));
  float vein = 0.3 + 0.7 * pow(1.0 - facing, 1.5);
  totalEmissiveRadiance += uVidaColor * signalPulse(vDistance, 0.5) * lit * uLife * uBarkPulse * vein;
  totalEmissiveRadiance += uSolColor * signalSpark(vDistance) * uSparkGain;
}
