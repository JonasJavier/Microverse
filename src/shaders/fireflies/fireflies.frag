// Luciérnaga: disco suave con núcleo más claro. Mezcla aditiva; valor HDR para
// que el bloom dibuje el halo.
uniform vec3 uColor;
uniform float uIntensity;
varying float vGlow;
varying vec2 vUv;

void main() {
  float d = length(vUv) * 2.0;
  float disc = 1.0 - smoothstep(0.35, 1.0, d);
  float core = 1.0 - smoothstep(0.0, 0.35, d);
  float a = vGlow * (disc * 0.6 + core);
  if (a < 0.002) discard;
  gl_FragColor = vec4(uColor * a * uIntensity, a);
}
