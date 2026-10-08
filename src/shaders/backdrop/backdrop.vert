varying vec2 vUv;

void main() {
  vUv = uv;
  // Quad a pantalla completa en el plano lejano: no depende de la cámara.
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
