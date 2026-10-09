// Parche del follaje (vértice): distancia de la rama de cada mechón (atributo
// por instancia). Crecimiento (jornada 7): cada mechón brota cuando el frente de
// crecimiento llega a su rama; las nubes se llenan mechón a mechón. Se usa también
// en el material de sombra.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float pathDistance;
varying float vDistance;
uniform float uGrowth;
uniform float uTreeStart;
uniform float uTreeLength;
//#main
vDistance = pathDistance;
{
  float front = uTreeStart + uTreeLength * uGrowth;
  transformed *= smoothstep(pathDistance - 0.02, pathDistance + 0.1, front);
}
