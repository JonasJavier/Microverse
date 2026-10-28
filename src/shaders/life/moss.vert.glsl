// Parche del musgo (vértice). Jornada 11b: altura local dentro de la almohadilla
// (−1 abajo, 1 arriba) y posición en el mundo para el grano. Jornada 17: cada
// almohadilla tiene su propia silueta y una normal suave, sin geometría nueva.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying float vPadHeight;
varying vec3 vSurfPos;

float mossHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
//#main
{
  // Silueta propia (jornada 17): cada vértice se desplaza radialmente según un
  // hash de su posición y la de su instancia. Las caras no comparten índice,
  // pero los vértices duplicados comparten posición: el poliedro sigue cerrado.
  // Así un icosaedro de 20 caras deja de ser un cristal y se lee como un bulto.
  vec3 radial = normalize(position);
  #ifdef USE_INSTANCING
  vec3 padSeed = instanceMatrix[3].xyz * 97.0;
  #else
  vec3 padSeed = vec3(0.0);
  #endif
  float lump = mossHash(position * 3.1 + padSeed) - 0.5;
  transformed += radial * lump * 0.5;
  // Normal esférica suave en lugar de la plana por cara: el sombreado deja de
  // marcar las aristas y la almohadilla se lee como una cúpula blanda. Misma
  // transformación que `defaultnormal_vertex` (instancia y matriz de normales).
  vec3 padNormal = radial;
  #ifdef USE_INSTANCING
  padNormal = mat3(instanceMatrix) * padNormal;
  #endif
  vNormal = normalize(normalMatrix * padNormal);
}
vPadHeight = position.y;
#ifdef USE_INSTANCING
vSurfPos = (instanceMatrix * vec4(transformed, 1.0)).xyz;
#else
vSurfPos = transformed;
#endif
