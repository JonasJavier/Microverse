// Lluvia (acto 02 · Nourish). Una instancia por gota: un trazo vertical fino que
// cae de `aDrop.z` a `aDrop.w`. Billboard cilíndrico: siempre de cara a la cámara
// en horizontal, siempre vertical. Lluvia ligera = menos gotas (umbral por gota).
attribute vec4 aDrop; // x, z, salida, llegada
attribute vec4 aSeed; // fase, velocidad, largo, umbral
uniform float uTime;
uniform float uRain;
uniform float uWidth;
varying float vAlpha;
varying float vAlong;

void main() {
  float fall = max(aDrop.z - aDrop.w, 0.01);
  float t = fract(uTime * aSeed.y / fall + aSeed.x);
  vec3 head = vec3(aDrop.x, mix(aDrop.z, aDrop.w, t), aDrop.y);

  // Eje horizontal de la cámara en coordenadas del mundo.
  vec3 right = normalize(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]));
  vAlong = position.y + 0.5; // 0 en la cabeza (abajo), 1 en la cola
  vec3 world = head + right * position.x * uWidth + vec3(0.0, vAlong * aSeed.z, 0.0);

  float falling = step(aSeed.w, uRain);
  vAlpha = falling * smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.9, 1.0, t));
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
