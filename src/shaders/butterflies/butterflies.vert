// Mariposas (jornada 16). Una instancia por mariposa: revolotea alrededor de su
// nube (suma de senos, como las luciérnagas) y aletea plegando las dos mitades
// del rectángulo alrededor del cuerpo, con pausas de planeo. Solo vuelan las
// que su umbral deja (uButterflies: día × floración).
attribute vec4 aHome; // x, y, z, radio de vuelo
attribute vec4 aSeed; // fase, velocidad, aleteos por segundo, umbral
uniform float uTime;
uniform float uButterflies;
uniform float uSize;
varying vec2 vUv;
varying float vShade;
varying float vVisible;

void main() {
  float t = uTime * aSeed.y + aSeed.x * 100.0;
  vec3 flight = vec3(
    sin(t * 1.7) + 0.4 * sin(t * 3.1 + 1.3),
    0.5 * sin(t * 2.3 + 0.7) + 0.25 * sin(t * 5.1),
    cos(t * 1.4 + 2.0) + 0.4 * cos(t * 2.9)
  ) * aHome.w;
  vec3 world = aHome.xyz + flight;

  // Aleteo con pausas: un segundo rápido, medio segundo planeando.
  float cycle = fract(uTime * 0.6 + aSeed.x * 7.0);
  float flapping = smoothstep(0.0, 0.08, cycle) * (1.0 - smoothstep(0.62, 0.7, cycle));
  float angle = mix(0.35, abs(sin(uTime * aSeed.z * 3.1416 + aSeed.x * 6.2831)) * 1.3, flapping);

  vVisible = smoothstep(aSeed.w, aSeed.w + 0.12, uButterflies);
  vUv = position.xy;
  // Las alas se pliegan hacia arriba alrededor del cuerpo (eje y local).
  vec3 local = vec3(position.x * cos(angle), position.y, abs(position.x) * sin(angle));
  // Orientación: la mariposa mira a donde vuela (aproximado con la velocidad en xz).
  vec2 dir = normalize(vec2(cos(t * 1.7) * 1.7, -sin(t * 1.4 + 2.0) * 1.4) + 1e-4);
  vec3 forward = vec3(dir.x, 0.0, dir.y);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 offset = (right * local.x + forward * local.y + vec3(0.0, local.z, 0.0)) * uSize;
  vShade = 0.7 + 0.3 * cos(angle);

  vec4 view = viewMatrix * vec4(world + offset * vVisible, 1.0);
  gl_Position = projectionMatrix * view;
}
