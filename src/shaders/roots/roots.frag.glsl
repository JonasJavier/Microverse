// Parche de las raíces (fragmento). Ver experience/world/materialPatch.ts; usa
// las funciones de shaders/life/signals.glsl.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
//
// Raíces maestras (gruesas): cuerpo oscuro y borde luminoso → se leen como
// volumen, no como cable. Filamentos (finos): brillo uniforme y más tenue.
// Dormida, la red apenas se intuye; al despertar, un frente la enciende desde
// la semilla y después la recorren pulsos.
varying float vThickness;
varying float vDistance;
varying float vTemperament;
uniform float uThin;
uniform float uThick;
uniform float uFilament;
uniform float uDormant;
uniform float uPulseGain;
uniform float uSparkGain;
float rootWeight;
//#color
rootWeight = smoothstep(uThin, uThick, vThickness);
diffuseColor.rgb *= mix(1.0, 0.5, rootWeight);
//#emissive
{
  float facing = abs(dot(normal, normalize(vViewPosition)));
  float rim = 0.12 + 1.1 * pow(1.0 - facing, 2.0);
  float shape = mix(uFilament, rim, rootWeight);
  float lit = signalLit(vDistance);
  float pulse = signalPulse(vDistance, vTemperament) * lit * uPulseGain;
  totalEmissiveRadiance *= shape * (mix(uDormant, max(uLife, uDormant), lit) + pulse);
  totalEmissiveRadiance += uSolColor * signalSpark(vDistance) * uSparkGain;
}
