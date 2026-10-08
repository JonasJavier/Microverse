// Fondo de museo: Vacío con un degradado radial muy sutil detrás de la esfera.

uniform vec3 uCenterColor;
uniform vec3 uEdgeColor;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uAspect;

varying vec2 vUv;

void main() {
  vec2 p = vUv - uCenter;
  p.x *= uAspect;
  float t = smoothstep(0.0, 1.0, length(p) / uRadius);
  gl_FragColor = vec4(mix(uCenterColor, uEdgeColor, t), 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
