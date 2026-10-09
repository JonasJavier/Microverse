// Parche de la corteza (vértice). Crecimiento (jornada 7): el árbol se revela a lo
// largo de sus ramas, por la distancia desde la semilla. Los anillos que el frente
// aún no ha alcanzado se pliegan hacia el eje: la rama crece con punta, no aparece
// cortada. Se usa también en el material de sombra (las sombras crecen igual).
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float pathDistance;
attribute vec3 ringCenter;
varying float vDistance;
uniform float uGrowth;
uniform float uTreeStart;
uniform float uTreeLength;
//#main
vDistance = pathDistance;
{
  float front = uTreeStart + uTreeLength * uGrowth;
  float grown = smoothstep(front, front - 0.06, pathDistance);
  transformed = mix(ringCenter, transformed, grown);
}
