// Lluvia: trazo más brillante en la cabeza que en la cola. Mezcla aditiva.
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
varying float vAlong;

void main() {
  float a = vAlpha * (1.0 - vAlong) * uOpacity;
  gl_FragColor = vec4(uColor * a, a);
}
