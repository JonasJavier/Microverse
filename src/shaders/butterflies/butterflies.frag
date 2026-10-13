// Mariposa: dos pares de alas (lóbulos) recortados del rectángulo, con el
// cuerpo oscuro en el centro y el borde del ala algo más oscuro.
uniform vec3 uColor;
varying vec2 vUv;
varying float vShade;
varying float vVisible;

float lobe(vec2 p, vec2 c, vec2 r) {
  vec2 d = (p - c) / r;
  return 1.0 - dot(d, d);
}

void main() {
  if (vVisible < 0.01) discard;
  vec2 p = vec2(abs(vUv.x), vUv.y);
  float upper = lobe(p, vec2(0.27, 0.08), vec2(0.27, 0.36));
  float lower = lobe(p, vec2(0.2, -0.24), vec2(0.2, 0.24));
  float wing = max(upper, lower);
  if (wing < 0.0) discard;
  float body = 1.0 - smoothstep(0.0, 0.07, p.x);
  float edge = smoothstep(0.0, 0.25, wing);
  vec3 color = uColor * vShade * mix(0.55, 1.0, edge);
  color = mix(color, uColor * 0.25, body);
  gl_FragColor = vec4(color, vVisible);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
