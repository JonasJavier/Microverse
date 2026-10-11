// Luz del anillo del pedestal sobre el disco (jornada 11b): el anillo era una
// línea sobre negro; una lámpara real baña la superficie de alrededor. Un halo
// gaussiano centrado en el radio del anillo, más un resto tenue hacia dentro.
// Mezcla aditiva sobre el disco.
uniform vec3 uColor;
uniform float uRing;
uniform float uWidth;
varying vec2 vLocal;

void main() {
  float r = length(vLocal);
  float x = (r - uRing) / uWidth;
  float halo = exp(-x * x);
  // Resto tenue hacia dentro (sin punto brillante en el centro: eso era una lámpara, no un halo).
  float inner = smoothstep(uRing, uRing * 0.5, r) * 0.05;
  gl_FragColor = vec4(uColor * (halo + inner), 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
