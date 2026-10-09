// Parche de los charcos (fragmento), jornada 7. Agua quieta y oscura que refleja
// el estudio (rugosidad casi nula) con borde suave; mientras llueve, ondas: tres
// impactos por charco que se abren en anillos y se apagan.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
uniform float uPuddle;
uniform float uRain;
uniform float uTime;
uniform vec3 uRippleColor;
varying vec2 vLocal;
varying float vPhase;

float puddleHash(float n) {
  return fract(sin(n) * 43758.5453);
}
//#color
diffuseColor.a *= uPuddle * 0.85 * (1.0 - smoothstep(0.7, 1.0, length(vLocal)));
//#emissive
{
  float rings = 0.0;
  for (int i = 0; i < 3; i++) {
    float k = float(i);
    float cycle = uTime * 0.9 + vPhase * 7.0 + k * 0.37;
    float id = floor(cycle);
    float age = fract(cycle);
    vec2 center = vec2(
      puddleHash(id * 12.9898 + k * 78.233 + vPhase * 43.1),
      puddleHash(id * 93.989 + k * 11.1 + vPhase * 17.3)
    ) * 1.1 - 0.55;
    float d = length(vLocal - center);
    float x = (d - age * 0.6) / 0.05;
    rings += exp(-x * x) * (1.0 - age);
  }
  totalEmissiveRadiance += uRippleColor * rings * uRain * uPuddle * 0.3;
  // Reflejo del estudio: un velo tenue, más fuerte en ángulo rasante (Fresnel), para
  // que el charco se lea como agua también desde la vista general (aviso de exceso).
  float grazing = pow(1.0 - max(dot(normalize(vViewPosition), normal), 0.0), 3.0);
  float edge = 1.0 - smoothstep(0.6, 1.0, length(vLocal));
  totalEmissiveRadiance += uRippleColor * uPuddle * edge * (0.015 + 0.08 * grazing);
}
