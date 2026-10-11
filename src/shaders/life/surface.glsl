// Microdetalle de superficie (jornada 11b · Realismo). Funciones compartidas por
// los parches de suelo, corteza y musgo: ruido de valor 3D barato (sin texturas)
// y relieve procedural (bump) a partir de un campo de altura evaluado en el
// fragmento. `vSurfPos` es la posición en el espacio del objeto (la isla y el
// árbol no se transforman: coincide con el mundo); la escribe el parche de vértice.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
varying vec3 vSurfPos;

float surfHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// Ruido de valor trilineal: 8 lecturas, continuo y sin tablas.
float surfNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(surfHash(i), surfHash(i + vec3(1, 0, 0)), f.x),
        mix(surfHash(i + vec3(0, 1, 0)), surfHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(surfHash(i + vec3(0, 0, 1)), surfHash(i + vec3(1, 0, 1)), f.x),
        mix(surfHash(i + vec3(0, 1, 1)), surfHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

// Tres octavas: grano fino sobre manchas más anchas. Devuelve 0..1 aproximadamente.
float surfFbm(vec3 p) {
  return 0.5 * surfNoise(p) + 0.3 * surfNoise(p * 2.03 + 11.7) + 0.2 * surfNoise(p * 4.11 + 5.3);
}

// Relieve de un campo de altura (Mikkelsen, "Bump Mapping Unparametrized
// Surfaces on the GPU"), con derivadas de pantalla sin normalizar: la altura está
// en unidades del mundo, así que el relieve no cambia de fuerza al acercar la cámara.
vec3 surfBump(vec3 viewPos, vec3 n, float height) {
  vec3 sigmaX = dFdx(viewPos);
  vec3 sigmaY = dFdy(viewPos);
  vec2 dH = vec2(dFdx(height), dFdy(height));
  vec3 r1 = cross(sigmaY, n);
  vec3 r2 = cross(n, sigmaX);
  float det = dot(sigmaX, r1);
  vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
  return normalize(abs(det) * n - grad);
}
