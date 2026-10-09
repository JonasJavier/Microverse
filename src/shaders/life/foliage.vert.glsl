// Parche del follaje (vértice): distancia de la rama de cada mechón (atributo
// por instancia). Crecimiento (jornada 7): cada mechón brota cuando el frente de
// crecimiento llega a su rama; las nubes se llenan mechón a mechón. Viento
// (jornada 8): cada mechón se mece con un vaivén lento y una ráfaga más fina,
// más cuanto más lejos del tronco; con lluvia sopla algo más. Se usa también en
// el material de sombra: la sombra se mece igual.
// Nota: no escribir aquí directivas include literales; el reemplazo las buscaría.
attribute float pathDistance;
varying float vDistance;
uniform float uGrowth;
uniform float uTreeStart;
uniform float uTreeLength;
uniform float uTime;
uniform float uWind;
//#main
vDistance = pathDistance;
{
  float front = uTreeStart + uTreeLength * uGrowth;
  transformed *= smoothstep(pathDistance - 0.02, pathDistance + 0.1, front);
  // Posición del mechón en el árbol (columna de traslación de la instancia):
  // la fase del viento varía por el espacio, así la copa ondula, no vibra entera.
  #ifdef USE_INSTANCING
  vec3 tuft = instanceMatrix[3].xyz;
  #else
  vec3 tuft = vec3(0.0);
  #endif
  float reach = clamp((pathDistance - uTreeStart) / max(uTreeLength, 0.001), 0.0, 1.0);
  float slow = sin(uTime * 0.9 + tuft.x * 4.0 + tuft.z * 3.0);
  float gust = sin(uTime * 2.7 + tuft.y * 6.0 + tuft.x * 9.0);
  // En espacio local del mechón (su escala ya está en la matriz): con brisa (0,5)
  // se mueve un tercio de su radio; con lluvia (1,3), casi uno entero.
  transformed.xz += vec2(slow * 0.5 + gust * 0.15, gust * 0.2) * uWind * (0.3 + 0.7 * reach);
}
